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

import {SearchAlgorithmBuilder} from "../SearchAlgorithmBuilder";
import {BitstringChromosome} from "../../bitstring/BitstringChromosome";
import {BitstringChromosomeGenerator} from "../../bitstring/BitstringChromosomeGenerator";
import {FitnessFunction} from "../FitnessFunction";
import {SearchAlgorithmProperties} from "../SearchAlgorithmProperties";
import {StoppingCondition} from "../StoppingCondition";
import {OneMaxFitnessFunction} from "../../bitstring/OneMaxFitnessFunction";
import {OneOfStoppingCondition} from "../stoppingconditions/OneOfStoppingCondition";
import {FixedIterationsStoppingCondition} from "../stoppingconditions/FixedIterationsStoppingCondition";
import {OptimalSolutionStoppingCondition} from "../stoppingconditions/OptimalSolutionStoppingCondition";
import {Selection} from "../Selection";
import {NotSupportedFunctionException} from "../../core/exceptions/NotSupportedFunctionException";
import {SearchAlgorithm} from "../SearchAlgorithm";
import {RandomSearch} from "./RandomSearch";

/**
 * Builder for the random search algorithm.
 *
 * @author Sophia Geserer
 */
export class RandomSearchBuilder implements SearchAlgorithmBuilder<BitstringChromosome> {

    private _chromosomeGenerator: BitstringChromosomeGenerator;

    private _fitnessFunction: FitnessFunction<BitstringChromosome>;

    private _properties: SearchAlgorithmProperties<BitstringChromosome>;

    private _stoppingCondition: StoppingCondition<BitstringChromosome>;

    constructor() {
        const populationSize = 50;
        const chromosomeLength = 10;
        const crossoverProbability = 1;
        const mutationProbability = 1;
        const maxIterations = 100;

        this._properties = new SearchAlgorithmProperties(populationSize, chromosomeLength, crossoverProbability, mutationProbability);
        this._chromosomeGenerator = new BitstringChromosomeGenerator(this._properties);
        this._fitnessFunction = new OneMaxFitnessFunction(chromosomeLength);
        this._stoppingCondition = new OneOfStoppingCondition(
            new FixedIterationsStoppingCondition(maxIterations),
            new OptimalSolutionStoppingCondition(this._fitnessFunction)
        );
    }

    addChromosomeGenerator(generator: BitstringChromosomeGenerator): SearchAlgorithmBuilder<BitstringChromosome> {
        this._chromosomeGenerator = generator;
        return this;
    }

    addFitnessFunction(fitnessFunction: FitnessFunction<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        this._fitnessFunction = fitnessFunction;
        return this;
    }

    addProperties(properties: SearchAlgorithmProperties<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        this._properties = properties;
        return this;
    }

    addStoppingCondition(stoppingCondition: StoppingCondition<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        this._stoppingCondition = stoppingCondition;
        return this;
    }

    addSelectionOperator(selectionOp: Selection<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        throw new NotSupportedFunctionException();
    }

    buildSearchAlgorithm(): SearchAlgorithm<BitstringChromosome> {
        const randomSearch: RandomSearch<BitstringChromosome> = new RandomSearch();
        randomSearch.setProperties(this._properties);
        randomSearch.setChromosomeGenerator(this._chromosomeGenerator);
        randomSearch.setStoppingCondition(this._stoppingCondition);
        randomSearch.setFitnessFunction(this._fitnessFunction);
        return randomSearch;
    }

}
