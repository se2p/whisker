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
import {Container} from "../../utils/Container";

export class OnePlusOneEA<C extends Chromosome> extends SearchAlgorithmDefault<C> {

    _chromosomeGenerator: ChromosomeGenerator<C>;

    _fitnessFunction: FitnessFunction<C>;

    _fitnessFunctions: List<FitnessFunction<C>> = new List();

    _stoppingCondition: StoppingCondition<C>;

    _properties: SearchAlgorithmProperties<C>;

    _iterations = 0;

    _bestIndividuals = new List<C>();

    _startTime: number;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setFitnessFunction(fitnessFunction: FitnessFunction<C>): void {
        StatisticsCollector.getInstance().fitnessFunctionCount = 1;
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
    findSolution(): List<C> {

        this._startTime = Date.now();
        console.log("1+1 EA started at "+this._startTime);

        let bestIndividual = this._chromosomeGenerator.get();
        this._bestIndividuals.add(bestIndividual);
        let bestFitness = this._fitnessFunction.getFitness(bestIndividual);
        let bestLength = bestIndividual.getLength();
        console.log("Best Fitness: ", bestFitness+" at length "+bestLength+": "+bestIndividual.toString());
        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 0;
        StatisticsCollector.getInstance().bestTestSuiteSize = 1;

        while (!this._stoppingCondition.isFinished(this)) {
            StatisticsCollector.getInstance().incrementIterationCount();
            const oldString = bestIndividual.toString();
            let candidateChromosome = bestIndividual.mutate();
            while (oldString === candidateChromosome.toString()) {
                candidateChromosome = bestIndividual.mutate();
            }
            const candidateFitness = this._fitnessFunction.getFitness(candidateChromosome);
            console.log("Iteration "+this._iterations+" ["+bestFitness+"]: "+candidateChromosome.toString()+" has fitness "+candidateFitness);
            this._iterations++;
            if (this._fitnessFunction.compare(candidateFitness, bestFitness) > 0 ||
                (this._fitnessFunction.compare(candidateFitness, bestFitness) === 0 && candidateChromosome.getLength() <= bestLength)) {
                if (this._fitnessFunction.isOptimal(candidateFitness) && !this._fitnessFunction.isOptimal(bestFitness)) {
                    StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 1;
                    StatisticsCollector.getInstance().createdTestsToReachFullCoverage = this._iterations + 1;
                    StatisticsCollector.getInstance().timeToReachFullCoverage = Container.vmWrapper.getTotalTimeElapsed();
                }
                bestFitness = candidateFitness;
                bestLength = candidateChromosome.getLength();
                bestIndividual = candidateChromosome;
                this._bestIndividuals.clear();
                this._bestIndividuals.add(bestIndividual);
                console.log("Best Fitness: ", bestFitness+" at length "+bestLength+": "+bestIndividual.toString());
            }
        }
        console.log("1+1 EA completed at "+Date.now());
        StatisticsCollector.getInstance().createdTestsCount = this._iterations + 1;

        return this._bestIndividuals;
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): List<C> {
        return this._bestIndividuals;
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        return this._fitnessFunctions;
    }

    getStartTime(): number {
        return this._startTime;
    }
}
