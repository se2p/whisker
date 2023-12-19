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
import {SearchAlgorithmProperties} from "./SearchAlgorithmProperties";
import {ChromosomeGenerator} from "./ChromosomeGenerator";
import {FitnessFunction} from "./FitnessFunction";
import {Selection} from "./Selection";
import {LocalSearch} from "./operators/LocalSearch/LocalSearch";

/**
 * Represents a strategy to search for an approximated solution to a given problem.
 *
 * @param <C> the solution encoding of the problem
 * @author Sophia Geserer
 */
export interface SearchAlgorithm<C extends Chromosome> {

    /**
     * Returns a list of possible admissible solutions for the given problem.
     * @returns Solution for the given problem
     */
    findSolution(): Promise<Map<number, C>>;

    /**
     * Sets the properties for this search algorithm.
     * @param properties the properties for the search algorithm
     */
    setProperties(properties: SearchAlgorithmProperties<C>): void;

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
     * Sets the map of fitness functions used by the search algorithm.
     * @param fitnessFunctions map of fitness functions used for the chromosome evaluation
     */
    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void;

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

    /**
     * Returns the list of best individuals at the current time during the search
     * @returns Solution for the given problem
     */
    getCurrentSolution(): C[];

    /**
     * Returns all fitness functions for this search algorithm
     * @return list with all fitness functions
     */
    getFitnessFunctions(): Iterable<FitnessFunction<C>>;

    /**
     * Get starting time of Algorithm
     * @returns startTime of Algorithm in ms.
     */
    getStartTime(): number;
}
