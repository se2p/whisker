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

import {List} from "../../utils/List";
import {Chromosome} from "./../Chromosome";
import {SearchAlgorithmProperties} from "./../SearchAlgorithmProperties";
import {ChromosomeGenerator} from "./../ChromosomeGenerator";
import {FitnessFunction} from "./../FitnessFunction";
import {Selection} from "./../Selection";
import {SearchAlgorithm} from "../SearchAlgorithm";
import {NotSupportedFunctionException} from "../../core/exceptions/NotSupportedFunctionException";

/**
 * Represents a strategy to search for an approximated solution to a given problem.
 *
 * @param <C> the solution encoding of the problem
 * @author Sophia Geserer
 */
export abstract class SearchAlgorithmDefault<C extends Chromosome> implements SearchAlgorithm<C> {

    async findSolution(): Promise<List<C>> {
        throw new NotSupportedFunctionException();
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        throw new NotSupportedFunctionException();
    }

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        throw new NotSupportedFunctionException();
    }

    setFitnessFunction(fitnessFunction: FitnessFunction<C>): void {
        throw new NotSupportedFunctionException();
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        throw new NotSupportedFunctionException();
    }

    setHeuristicFunctions(heuristicFunctions: Map<number, Function>): void {
        throw new NotSupportedFunctionException();
    }

    setSelectionOperator(selectionOperator: Selection<C>): void {
        throw new NotSupportedFunctionException();
    }

    getNumberOfIterations(): number {
        throw new NotSupportedFunctionException();
    }

    getCurrentSolution(): List<C> {
        throw new NotSupportedFunctionException();
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        throw new NotSupportedFunctionException();
    }

    getStartTime(): number {
        throw new NotSupportedFunctionException();
    }

    async evaluatePopulation(population: List<C>) : Promise<void> {
        for (const chromosome of population) {
            await chromosome.evaluate();
        }
    }
}
