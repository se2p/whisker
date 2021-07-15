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

export class OnePlusOneEA<C extends Chromosome> extends SearchAlgorithmDefault<C> {

    _chromosomeGenerator: ChromosomeGenerator<C>;

    _fitnessFunction: FitnessFunction<C>;

    _fitnessFunctions: List<FitnessFunction<C>> = new List();

    _stoppingCondition: StoppingCondition<C>;

    _properties: SearchAlgorithmProperties<C>;

    _iterations = 0;

    _bestIndividual: C;

    _startTime: number;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setFitnessFunction(fitnessFunction: FitnessFunction<C>): void {
        this._fitnessFunction = fitnessFunction;
        this._fitnessFunctions.clear();
        this._fitnessFunctions.add(fitnessFunction)
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.getStoppingCondition();
    }

    /**
     * Returns a list of possible admissible solutions for the given problem.
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<List<C>> {

        this._startTime = Date.now();
        console.log("1+1 EA started at " + this._startTime);

        let bestIndividual = this._chromosomeGenerator.get();
        await bestIndividual.evaluate();
        this._bestIndividual = bestIndividual;
        let bestFitness = this._fitnessFunction.getFitness(bestIndividual);

        // Prevent statistics to be reset in case of IterativeSearch.
        if (!this.isIterativeSearch()) {
            StatisticsCollector.getInstance().iterationCount = 0;
            StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 0;
            StatisticsCollector.getInstance().bestTestSuiteSize = 1;
            StatisticsCollector.getInstance().startTime = Date.now();
        }

        if (this._stoppingCondition.isFinished(this)) {
            this.updateStatistics();
        }

        while (!(this._stoppingCondition.isFinished(this))) {
            StatisticsCollector.getInstance().incrementIterationCount();
            const candidateChromosome = bestIndividual.mutate();
            await candidateChromosome.evaluate();
            const candidateFitness = this._fitnessFunction.getFitness(candidateChromosome);
            console.log(`Iteration ${this._iterations}: BestChromosome with fitness ${bestFitness} and length ${bestIndividual.getLength()} executed
${bestIndividual.toString()}`);
            if (this._fitnessFunction.compare(candidateFitness, bestFitness) >= 0) {
                if (this._fitnessFunction.isOptimal(candidateFitness)) {
                    this.updateStatistics();
                }
                bestFitness = candidateFitness;
                bestIndividual = candidateChromosome;
                this._bestIndividual = bestIndividual;
                this._iterations++;
                StatisticsCollector.getInstance().incrementIterationCount();
            }
        }
        console.log("1+1 EA completed at " + Date.now());
        return new List<C>([this._bestIndividual]);
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
        const summary = {};
        summary['block'] = this._fitnessFunction.toString();
        const approachLevel = this._fitnessFunction.getApproachLevel(this._bestIndividual);
        const branchDistance = this._fitnessFunction.getBranchDistance(this._bestIndividual);
        let CFGDistance = Number.MAX_VALUE;
        if (approachLevel === 0 && branchDistance === 0) {
            CFGDistance = this._fitnessFunction.getCFGDistance(this._bestIndividual);
        }
        summary['ApproachLevel'] = approachLevel;
        summary['BranchDistance'] = branchDistance;
        summary['CFGDistance'] = CFGDistance;
        summary['Fitness'] = this._fitnessFunction.getFitness(this._bestIndividual);
        return JSON.stringify({'Target': summary});
    }

    /**
     * Determines whether the used TestGenerator is the IterativeSearchBasedTestGenerator.
     * If so we do no want to update statistics in the OnePlusOne-Algorithm.
     * @returns boolean defining whether OnePlusOneEA has been called by the IterativeSearchBasedTestGenerator
     */
    private isIterativeSearch(): boolean {
        return this._properties.getTestGenerator() === 'iterative';
    }

    /**
     * Updates statistic values using the StatisticsCollector
     */
    private updateStatistics(): void {
        StatisticsCollector.getInstance().createdTestsToReachFullCoverage = this._iterations + 1;
        StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        if (!this.isIterativeSearch()) {
            StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount();
        }
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): List<C> {
        return new List<C>([this._bestIndividual]);
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        return this._fitnessFunctions;
    }

    getStartTime(): number {
        return this._startTime;
    }
}
