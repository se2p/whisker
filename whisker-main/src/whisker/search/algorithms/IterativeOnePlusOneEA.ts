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
 * along with Whisker. ßIf not, see http://www.gnu.org/licenses/.
 *
 */

import {Chromosome} from '../Chromosome';
import {List} from '../../utils/List';
import {SearchAlgorithmProperties} from '../SearchAlgorithmProperties';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {FitnessFunction} from "../FitnessFunction";
import {StoppingCondition} from "../StoppingCondition";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {StatisticsCollector} from "../../utils/StatisticsCollector";

export class IterativeOnePlusOneEA<C extends Chromosome> extends SearchAlgorithmDefault<C> {

    /**
     * Generator responsible for generating initial chromosome whenever we select a new target.
     */
    private _chromosomeGenerator: ChromosomeGenerator<C>;

    /**
     * SearchAlgorithm properties set via config file.
     */
    private _properties: SearchAlgorithmProperties<C>;

    /**
     * Contains all fitnessFunction, i.e all target statements.
     */
    private _fitnessFunctions: Map<number, FitnessFunction<C>>;

    /**
     * Defines the stopping Condition.
     */
    private _stoppingCondition: StoppingCondition<C>;

    /**
     * Number of generations
     */
    private _iterations = 0;

    /**
     * Saves the top performing chromosomes. Those are used to construct the final test suite at the end of the Search.
     */
    private _bestIndividuals = new List<C>();

    /**
     * Saves the start time of the SearchAlgorithm in ms.
     */
    private _startTime: number;

    /**
     * The archive maps to each covered target statement the chromosome covering that statement.
     * Uncovered statements are not included.
     */
    private _archive = new Map<number, C>();

    /**
     * Determines if we have to generate a new chromosome, or keep mutating on an existing one.
     */
    private _generateNewChromosome = false;

    /**
     * Determines if we have reached full coverage during search.
     */
    private _fullCoverageReached = false;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.getStoppingCondition();
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    setSelectionOperator(): void {
        return;
    }

    setLocalSearchOperators(): void {
        return;
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): List<C> {
        return this._bestIndividuals;
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        return this._fitnessFunctions.values();
    }

    /**
     * Returns a list of possible admissible solutions for the given problem.
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<List<C>> {
        this.initializeSearch();
        console.log(`Iterative-1+1EA started at ${this._startTime}`);
        let chromosome: C;

        // Go through each target Statement until we meet a stopping criterion.
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            if (this._archive.has(fitnessFunctionKey)) {
                console.log(`Target ${fitnessFunctionKey} already covered continue search on next target.`);
                continue;
            }
            console.log(`Starting 1+1EA on target ${fitnessFunctionKey}/${this._fitnessFunctions.size}`)
            this._generateNewChromosome = true;
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
            let bestFitness: number;
            let covered = false;

            // If we haven't met a stopping Condition yet, try to cover the current target statement.
            if (!this._stoppingCondition.isFinished(this)) {
                // Try covering the current statement until we reach it or the search budget runs out.
                while (!(this._stoppingCondition.isFinished(this)) && !covered) {

                    // Decide if we generate a new Chromosome.
                    // We generate a new one at the start of the search or if we reached a target statement.
                    if (this._generateNewChromosome) {
                        chromosome = this._chromosomeGenerator.get();
                        await chromosome.evaluate();
                        this.updateArchive(chromosome);
                        bestFitness = fitnessFunction.getFitness(chromosome);
                        this._generateNewChromosome = false;
                    }
                    const mutant = chromosome.mutate();
                    await mutant.evaluate();
                    const mutantFitness = fitnessFunction.getFitness(mutant);
                    this.updateArchive(mutant);
                    if (fitnessFunction.compare(mutantFitness, bestFitness) >= 0) {
                        bestFitness = mutantFitness;
                        chromosome = mutant;
                    }
                    // If we reached the target statement fetch the next one.
                    if (fitnessFunction.isOptimal(bestFitness)) {
                        this._generateNewChromosome = true;
                        covered = true;
                    }
                    this._iterations++;
                    this.updateStatistics();
                }
            }
            // If we reach a stopping condition stop the search.
            else {
                break;
            }
        }
        console.log(`Finished Iterative 1+1EA with ${this._archive.size}/${this._fitnessFunctions.size} covered targets`);
        return this._bestIndividuals;
    }

    /**
     * Summarize the solution saved in _archive.
     * @returns: For MOSA.ts, for each statement that is not covered, it returns 4 items:
     *        - Not covered: the statement that’s not covered by any
     *        function in the _bestIndividuals.
     *        - ApproachLevel: the approach level of that statement
     *        - BranchDistance: the branch distance of that statement
     *        - Fitness: the fitness value of that statement
     * For other search algorithms, it returns an empty string.
     */
    summarizeSolution(): string {
        const summary = [];
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const curSummary = {};
            if (!this._archive.has(fitnessFunctionKey)) {
                const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
                curSummary['block'] = fitnessFunction.toString();
                let fitness = Number.MAX_VALUE;
                let approachLevel = Number.MAX_VALUE;
                let branchDistance = Number.MAX_VALUE;
                let CFGDistance = Number.MAX_VALUE;
                for (const chromosome of this._bestIndividuals) {
                    const curFitness = fitnessFunction.getFitness(chromosome);
                    if (curFitness < fitness) {
                        fitness = curFitness;
                        approachLevel = fitnessFunction.getApproachLevel(chromosome);
                        branchDistance = fitnessFunction.getBranchDistance(chromosome);
                        if (approachLevel === 0 && branchDistance === 0) {
                            CFGDistance = fitnessFunction.getCFGDistance(chromosome);
                        } else {
                            CFGDistance = Number.MAX_VALUE;
                            //this means that it was unnecessary to calculate cfg distance, since
                            //approach level or branch distance was not 0;
                        }
                    }
                }
                curSummary['ApproachLevel'] = approachLevel;
                curSummary['BranchDistance'] = branchDistance;
                curSummary['CFGDistance'] = CFGDistance;
                curSummary['Fitness'] = fitness;
                if (Object.keys(curSummary).length > 0) {
                    summary.push(curSummary);
                }
            }

        }
        return JSON.stringify({'uncoveredBlocks': summary});
    }

    /**
     * Initializes Statistics at the start of the search.
     */
    private initializeSearch(): void {
        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 0;
        StatisticsCollector.getInstance().bestTestSuiteSize = 1;
        StatisticsCollector.getInstance().startTime = Date.now();
        this._startTime = Date.now();
        this._fullCoverageReached = false;
    }

    /**
     * Updates the archive of best chromosomes.
     * We store a chromosome if it either manages to cover a previously uncovered statement or
     * if it covers a previously covered statement using less genes than the current chromosome covering that statement.
     *
     * @param candidateChromosome the chromosome to update the archive with.
     * @returns boolean defining whether the candidateChromosome improved Coverage.
     */
    private updateArchive(candidateChromosome: C) {
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
                this._bestIndividuals = new List<C>(Array.from(this._archive.values())).distinct();
            }
        }
    }

    /**
     * Updates the StatisticsCollector on the following points:
     *  - bestTestSuiteSize
     *  - iterationCount
     *  - createdTestsToReachFullCoverage
     *  - timeToReachFullCoverage
     */
    private updateStatistics() {
        StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.size();
        StatisticsCollector.getInstance().incrementIterationCount();
        if (this._archive.size == this._fitnessFunctions.size && !this._fullCoverageReached) {
            this._fullCoverageReached = true;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage = this._iterations + 1;
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        }
    }
}
