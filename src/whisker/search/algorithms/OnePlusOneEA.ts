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
import {SearchAlgorithm} from '../SearchAlgorithm';
import {List} from '../../utils/List';
import {SearchAlgorithmProperties} from '../SearchAlgorithmProperties';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {FitnessFunction} from "../FitnessFunction";
import {StoppingCondition} from "../StoppingCondition";
import {Selection} from "../Selection";
import {NotSupportedFunctionException} from "../../core/exceptions/NotSupportedFunctionException";

export class OnePlusOneEA<C extends Chromosome> implements SearchAlgorithm<C> {

    _chromosomeGenerator: ChromosomeGenerator<C>;

    _fitnessFunction: FitnessFunction<C>;

    _stoppingCondition: StoppingCondition<C>;

    _properties: SearchAlgorithmProperties<C>;

    _iterations = 0;

    _bestIndividuals = new List<C>();

    setChromosomeGenerator(generator : ChromosomeGenerator<C>) {
        this._chromosomeGenerator = generator;
    }

    setFitnessFunction(fitnessFunction : FitnessFunction<C>) {
        this._fitnessFunction = fitnessFunction;
    }

    setStoppingCondition(stoppingCondition : StoppingCondition<C>) {
        this._stoppingCondition = stoppingCondition;
    }

    setProperties(properties: SearchAlgorithmProperties<C>) {
        this._properties = properties;
    }

    setSelectionOperator(selectionOperator: Selection<C>) {
        throw new NotSupportedFunctionException();
    }

    /**
     * Returns a list of possible admissible solutions for the given problem.
     * @returns Solution for the given problem
     */
    findSolution(): List<C> {

        let bestIndividual = this._chromosomeGenerator.get();
        this._bestIndividuals.add(bestIndividual);
        let bestFitness = this._fitnessFunction.getFitness(bestIndividual);

        while(!this._stoppingCondition.isFinished(this)) {
            this._iterations++;
            let candidateChromosome = bestIndividual.mutate();
            let candidateFitness = this._fitnessFunction.getFitness(candidateChromosome);
            if(this._fitnessFunction.compare(candidateFitness, bestFitness) <= 0) {
                bestFitness = candidateFitness;
                bestIndividual = candidateChromosome;
                this._bestIndividuals.clear();
                this._bestIndividuals.add(bestIndividual);
            }
        }
        return this._bestIndividuals;
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): List<C> {
        return this._bestIndividuals;
    }
}
