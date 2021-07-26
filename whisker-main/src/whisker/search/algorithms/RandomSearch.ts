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
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {StatisticsCollector} from "../../utils/StatisticsCollector";

export class RandomSearch<C extends Chromosome> extends SearchAlgorithmDefault<C> {

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setFitnessFunction(fitnessFunction: FitnessFunction<C>): void {
        StatisticsCollector.getInstance().fitnessFunctionCount = 1;
        this._fitnessFunction = fitnessFunction;
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.getStoppingCondition();
    }

    /**
     * Returns a list of possible admissible solutions for the given problem.
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<Map<number, C>> {

        let bestIndividual = null;
        let bestFitness = 0;
        this._startTime = Date.now();
        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 0;
        StatisticsCollector.getInstance().startTime = Date.now();

        while (!(this._stoppingCondition.isFinished(this))) {
            const candidateChromosome = this._chromosomeGenerator.get();
            await candidateChromosome.evaluate();
            this.updateArchive(candidateChromosome);
            const candidateFitness = this._fitnessFunction.getFitness(candidateChromosome);

            if (this._fitnessFunction.compare(candidateFitness, bestFitness) > 0) {
                bestFitness = candidateFitness;
                bestIndividual = candidateChromosome;
                this._bestIndividuals.clear();
                this._bestIndividuals.add(bestIndividual);
            }
            this.updateStatistics();
            this._iterations++;
        }
        return this._archive;
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): List<C> {
        return this._bestIndividuals;
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        if(this._fitnessFunctions) {
            return this._fitnessFunctions.values();
        }
        else
            return [this._fitnessFunction];
    }

    getStartTime(): number {
        return this._startTime;
    }
}
