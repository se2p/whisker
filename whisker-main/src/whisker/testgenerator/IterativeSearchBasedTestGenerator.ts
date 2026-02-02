/*
 * Copyright (C) 2020 Whisker contributors
 *
 * This file is part of the Whisker test generator for Scratch.
 *
 * Whisker is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Whisker is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Whisker. If not, see http://www.gnu.org/licenses/.
 *
 */

import {TestGenerator} from './TestGenerator';
import {TestChromosome} from '../testcase/TestChromosome';
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {WhiskerTestListWithSummary} from "./WhiskerTestListWithSummary";
import Arrays from "../utils/Arrays";
import {Container} from "../utils/Container";
import {StatementFitnessFunction} from "../testcase/fitness/StatementFitnessFunction";
import logger from '../../util/logger';
import {SearchAlgorithm} from "../search/SearchAlgorithm";

/**
 * To generate a test suite using single-objective search,
 * this class iterates over the list of coverage objective in
 * a project and instantiates a new search for each objective.
 */
export class IterativeSearchBasedTestGenerator extends TestGenerator {

    /**
     * Maps each target statement to the chromosome covering it, if any.
     */
    private _archive = new Map<number, TestChromosome>();

    override buildOptimizationAlgorithm(isManyObjective: boolean): SearchAlgorithm<TestChromosome> {
        return super.buildOptimizationAlgorithm(isManyObjective) as SearchAlgorithm<TestChromosome>;
    }

    /**
     * Generate Tests by sequentially targeting each target statement in the fitnessFunction map.
     * @returns testSuite covering as many targets as possible within the stoppingCriterion limit
     */
    async generateTests(): Promise<WhiskerTestListWithSummary> {
        this._vmWrapper.vm.registerCoverageTracer();
        const startTime = Date.now();
        this._fitnessFunctions = this.extractCoverageObjectives();
        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().startTime = Date.now();
        let numObjective = 1;
        const totalNumObjectives = this._fitnessFunctions.size;
        let createdTestsToReachFullCoverage = 0;
        for (const fitnessFunction of this._fitnessFunctions.keys()) {
            logger.info(`Current objective ${numObjective}/${totalNumObjectives}:${this._fitnessFunctions.get(fitnessFunction)}`);
            numObjective++;
            if (this._archive.has(fitnessFunction)) {
                // If already covered, we don't need to search again
                logger.info(`Objective ${fitnessFunction} already covered, skipping.`);
                continue;
            }
            // Generate searchAlgorithm responsible for covering the selected target statement.
            // TODO: Somehow set the fitness function as objective
            const searchAlgorithm = this.buildOptimizationAlgorithm(false);
            const nextFitnessTarget = this._fitnessFunctions.get(fitnessFunction);
            searchAlgorithm.setFitnessFunction(nextFitnessTarget);
            if(nextFitnessTarget instanceof StatementFitnessFunction) {
                Container.coverageObjectives = [nextFitnessTarget];
            }
            searchAlgorithm.setFitnessFunctions(this._fitnessFunctions);
            // TODO: Assuming there is at least one solution?
            const archive = await searchAlgorithm.findSolution();
            this.updateGlobalArchive(archive);
            createdTestsToReachFullCoverage += StatisticsCollector.getInstance().createdTestsToReachFullCoverage;
            // Stop if found Chromosome did not cover target statement. This implies that we ran out of search budget.
            if (!archive.has(fitnessFunction)) {
                break;
            }
        }
        // Update Statistics related to achieving full coverage
        if (this._archive.size === this._fitnessFunctions.size) {
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - startTime;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage = createdTestsToReachFullCoverage;
        }
        // Done at the end to prevent used SearchAlgorithm to distort fitnessFunctionCount & coveredFitnessFunctionCount
        StatisticsCollector.getInstance().fitnessFunctionCount = this._fitnessFunctions.size;
        const testChromosomes = Arrays.distinct(this._archive.values());
        const testSuite = await this.getTestSuite(testChromosomes);
        this.collectStatistics(testSuite);
        const summary = await this.summarizeSolution(this._archive);
        return new WhiskerTestListWithSummary(testSuite, summary);
    }

    /**
     * Updates the global Archive given a localArchive returned from a SearchAlgorithm.
     * @param localArchive an archive returned from a SearchAlgorithm
     */
    private updateGlobalArchive(localArchive: Map<number, TestChromosome>): void {
        const candidates = Arrays.distinct(localArchive.values());
        for (const candidate of candidates) {
            this._fitnessFunctions.forEach(async (fitnessFunction, fitnessKey) => {
                const bestLength = this._archive.has(fitnessKey) ?
                    this._archive.get(fitnessKey).getLength() : Number.MAX_SAFE_INTEGER;
                const candidateFitness = await candidate.getFitness(fitnessFunction);
                if (await fitnessFunction.isOptimal(candidateFitness) && candidate.getLength() < bestLength) {
                    this._archive.set(fitnessKey, candidate);
                }
            });
        }
    }
}
