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
import {List} from '../utils/List';
import {TestChromosome} from '../testcase/TestChromosome';
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {WhiskerTestListWithSummary} from "./WhiskerTestListWithSummary";

/**
 * To generate a test suite using single-objective search,
 * this class iterates over the list of coverage goals in
 * a project and instantiates a new search for each goal.
 */
export class IterativeSearchBasedTestGenerator extends TestGenerator {

    /**
     * Maps each target statement to the chromosome covering it, if any.
     */
    private _archive = new Map<number, TestChromosome>();

    /**
     * Saves the bestIndividuals, i.e all distinct Chromosomes in the archive.
     */
    private _bestIndividuals = new List<TestChromosome>();

    /**
     * Generate Tests by sequentially targeting each target statement in the fitnessFunction map.
     * @returns testSuite covering as many targets as possible within the stoppingCriterion limit
     */
    async generateTests(): Promise<WhiskerTestListWithSummary> {
        const startTime = Date.now();
        this._fitnessFunctions = this.extractCoverageGoals();
        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().startTime = Date.now();
        let numGoal = 1;
        const totalGoals = this._fitnessFunctions.size;
        let createdTestsToReachFullCoverage = 0;
        for (const fitnessFunction of this._fitnessFunctions.keys()) {
            console.log(`Current goal ${numGoal}/${totalGoals}:${fitnessFunction}`);
            numGoal++;
            if (this._archive.has(fitnessFunction)) {
                // If already covered, we don't need to search again
                console.log(`Goal ${fitnessFunction} already covered, skipping.`);
                continue;
            }
            // Generate searchAlgorithm responsible for covering the selected target statement.
            // TODO: Somehow set the fitness function as objective
            const searchAlgorithm = this.buildSearchAlgorithm(false);
            searchAlgorithm.setFitnessFunction(this._fitnessFunctions.get(fitnessFunction));
            // TODO: Assuming there is at least one solution?
            const testChromosome = (await searchAlgorithm.findSolution()).get(0);
            this.updateArchive(testChromosome);
            createdTestsToReachFullCoverage += StatisticsCollector.getInstance().createdTestsToReachFullCoverage;
            // Stop if found Chromosome did not cover target statement. This implies that we ran out of search budget.
            const targetFitness = this._fitnessFunctions.get(fitnessFunction).getFitness(testChromosome);
            if (!this._fitnessFunctions.get(fitnessFunction).isOptimal(targetFitness)) {
                break;
            }
        }
        // Update Statistics related to achieving full coverage
        if (this._archive.size === this._fitnessFunctions.size) {
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - startTime;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage = createdTestsToReachFullCoverage;
        }
        // Done at the end to prevent used SearchAlgorithm to distort fitnessFunctionCount
        StatisticsCollector.getInstance().fitnessFunctionCount = this._fitnessFunctions.size;
        const testSuite = await this.getTestSuite(this._bestIndividuals);
        await this.collectStatistics(testSuite);
        return new WhiskerTestListWithSummary(testSuite, '');
    }

    /**
     * Updates the archive of best chromosomes.
     * We store a chromosome if it either manages to cover a previously uncovered statement or
     * if it covers a previously covered statement using less genes than the current chromosome covering that statement.
     *
     * @param candidateChromosome the chromosome to update the archive with.
     * @returns boolean defining whether the candidateChromosome improved Coverage.
     */
    private updateArchive(candidateChromosome: TestChromosome): void {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
            let bestLength = this._archive.has(fitnessFunctionKey)
                ? this._archive.get(fitnessFunctionKey).getLength()
                : Number.MAX_SAFE_INTEGER;
            const candidateFitness = fitnessFunction.getFitness(candidateChromosome);
            const candidateLength = candidateChromosome.getLength();
            if (fitnessFunction.isOptimal(candidateFitness) && candidateLength < bestLength) {
                bestLength = candidateLength;
                if (!this._archive.has(fitnessFunctionKey)) {
                    StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount();
                }
                this._archive.set(fitnessFunctionKey, candidateChromosome);
                this._bestIndividuals = new List<TestChromosome>(Array.from(this._archive.values())).distinct();
            }
        }
    }
}
