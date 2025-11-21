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

import {Chromosome} from "./Chromosome";
import {FitnessFunction} from "./FitnessFunction";
import {Selection} from "./Selection";
import {LocalSearch} from "./operators/LocalSearch/LocalSearch";
import {ChromosomeGenerator} from "./ChromosomeGenerator";
import {Hyperparameter, OptimizationAlgorithm} from "../core/OptimizationAlgorithm";

/**
 * Represents a strategy to search for an approximated solution to a given problem.
 *
 * @param <C> the solution encoding of the problem
 * @author Sophia Geserer
 */
export interface SearchAlgorithm<C extends Chromosome> extends OptimizationAlgorithm<C> {

    /**
     * Sets the properties for this optimization algorithm.
     * @param properties the properties for the search algorithm
     */
    setProperties(properties: Hyperparameter): void;

    /**
     * Sets the chromosome generator for this search algorithm.
     * @param generator the generator to create a chromosome
     */
    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void;

    /**
     * Sets the fitness function used by the search algorithm.
     * @param fitnessFunction fitness function for chromosome evaluation
     */
    setFitnessFunction(fitnessFunction: FitnessFunction<C>): void;

    /**
     * Sets the selection operator used by the search algorithm.
     * @param selectionOperator the selection operator used by the algorithm
     */
    setSelectionOperator(selectionOperator: Selection<C>): void;

    /**
     * Sets the LocalSearch operators callable by the algorithm under certain circumstances.
     * @param localSearchOperators the LocalSearch operators callable by the algorithm.
     */
    setLocalSearchOperators(localSearchOperators: LocalSearch<C>[]): void

    /**
     * Return the number of iterations currently performed
     * @returns the number of performed iterations
     */
    getNumberOfIterations(): number;
}
