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
import {SearchAlgorithmProperties} from '../SearchAlgorithmProperties';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {FitnessFunction} from "../FitnessFunction";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {Container} from "../../utils/Container";

export class OnePlusOneEA<C extends Chromosome> extends SearchAlgorithmDefault<C> {

    /**
     * Holds the currently best performing Chromosome on which we will keep mutating on.
     */
    private _bestIndividual: C;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setFitnessFunction(fitnessFunction: FitnessFunction<C>): void {
        this._fitnessFunction = fitnessFunction;
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.stoppingCondition;
    }

    /**
     * Returns a list of possible admissible solutions for the given problem.
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<Map<number, C>> {
        // Prevent statistics to be reset in case of IterativeSearch.
        this._startTime = Date.now();
        if (!this.isIterativeSearch()) {
            this.initializeStatistics();
        }
        Container.debugLog("1+1 EA started at " + this._startTime);

        let bestIndividual = this._chromosomeGenerator.get();
        await bestIndividual.evaluate();
        this.updateArchive(bestIndividual);
        this._bestIndividual = bestIndividual;
        let bestFitness = bestIndividual.getFitness(this._fitnessFunction);

        if (this._stoppingCondition.isFinished(this)) {
            this.updateStatisticsAtEnd();
        }

        while (!(this._stoppingCondition.isFinished(this))) {
            const candidateChromosome = bestIndividual.mutate();
            await candidateChromosome.evaluate();
            this.updateArchive(candidateChromosome);
            const candidateFitness = candidateChromosome.getFitness(this._fitnessFunction);
            Container.debugLog(`Iteration ${this._iterations}: BestChromosome with fitness ${bestFitness} and length ${bestIndividual.getLength()} executed
${bestIndividual.toString()}`);
            if (this._fitnessFunction.compare(candidateFitness, bestFitness) >= 0) {
                if (this._fitnessFunction.isOptimal(candidateFitness)) {
                    this.updateStatisticsAtEnd();
                }
                bestFitness = candidateFitness;
                bestIndividual = candidateChromosome;
                this._bestIndividual = bestIndividual;
            }
            this._iterations++;
            StatisticsCollector.getInstance().incrementIterationCount();
        }
        Container.debugLog("1+1 EA completed at " + Date.now());
        return this._archive;
    }

    /**
     * Determines whether the used TestGenerator is the IterativeSearchBasedTestGenerator.
     * If so we do no want to update statistics in the OnePlusOne-Algorithm.
     * @returns boolean defining whether OnePlusOneEA has been called by the IterativeSearchBasedTestGenerator
     */
    private isIterativeSearch(): boolean {
        return this._properties.testGenerator === 'iterative';
    }

    /**
     * Initializes Statistic related values.
     */
    private initializeStatistics(): void {
        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 0;
        StatisticsCollector.getInstance().bestTestSuiteSize = 1;
        StatisticsCollector.getInstance().startTime = this._startTime;
    }

    /**
     * Updates statistic values using the StatisticsCollector when the search is about to stop.
     */
    private updateStatisticsAtEnd(): void {
        StatisticsCollector.getInstance().createdTestsToReachFullCoverage = this._iterations + 1;
        StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): C[] {
        return [this._bestIndividual];
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        return [this._fitnessFunction];
    }

    getStartTime(): number {
        return this._startTime;
    }
}
