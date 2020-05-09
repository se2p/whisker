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
import {OneOfStoppingCondition} from "../stoppingconditions/OneOfStoppingCondition";
import {FixedIterationsStoppingCondition} from "../stoppingconditions/FixedIterationsStoppingCondition";
import {OneMaxFitnessFunction} from "../../bitstring/OneMaxFitnessFunction";
import {OptimalSolutionStoppingCondition} from "../stoppingconditions/OptimalSolutionStoppingCondition";
import {NotSupportedFunctionException} from "../../core/exceptions/NotSupportedFunctionException";
import {Selection} from "../Selection";
import {SearchAlgorithm} from "../SearchAlgorithm";
import {OnePlusOneEA} from "./OnePlusOneEA";

/**
 * Builder for the 1+1 algorithm.
 *
 * @author Sophia Geserer
 */
export class OnePlusOneEABuilder implements SearchAlgorithmBuilder<BitstringChromosome> {

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

    addFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<BitstringChromosome>>):
        SearchAlgorithmBuilder<BitstringChromosome> {
        throw new NotSupportedFunctionException();
    }

    addProperties(properties: SearchAlgorithmProperties<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        this._properties = properties;
        return this;
    }

    addSelectionOperator(selectionOp: Selection<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        throw new NotSupportedFunctionException();
    }

    buildSearchAlgorithm(): SearchAlgorithm<BitstringChromosome> {
        const onePlusOneEA: OnePlusOneEA<BitstringChromosome> = new OnePlusOneEA();
        onePlusOneEA.setProperties(this._properties);
        onePlusOneEA.setChromosomeGenerator(this._chromosomeGenerator);
        onePlusOneEA.setFitnessFunction(this._fitnessFunction);
        return onePlusOneEA;
    }

}

