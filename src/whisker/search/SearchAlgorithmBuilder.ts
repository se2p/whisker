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

import {ChromosomeGenerator} from "./ChromosomeGenerator";
import {Chromosome} from "./Chromosome";
import {FitnessFunction} from "./FitnessFunction";
import {StoppingCondition} from "./StoppingCondition";
import {SearchAlgorithm} from "./SearchAlgorithm";
import {SearchAlgorithmProperties} from "./SearchAlgorithmProperties";
import {Selection} from "./Selection";
import {BitstringChromosome} from "../bitstring/BitstringChromosome";

/**
 * Interface for a builder to set necessary properties of a search algorithm.
 *
 * @param <C> the type of the chromosomes handled by the search algorithm.
 * @author Sophia Geserer
 */
export interface SearchAlgorithmBuilder<C extends Chromosome>{

    /**
     * Builds a new search algorithm with the corresponding properties (e.g. fitness function).
     * @returns the search algorithm with all corresponding information set in the builder
     */
    buildSearchAlgorithm(): SearchAlgorithm<C>;

    /**
     * Adds the generator used to generate chromosomes.
     * @param generator the generator to use
     * @returns the search builder with the applied chromosome generator
     */
    addChromosomeGenerator(generator: ChromosomeGenerator<C>): SearchAlgorithmBuilder<C>;

    /**
     * Adds the fitness function used by the search algorithm.
     * @param fitnessFunction the fitness function to use
     * @returns the search builder with the applied fitness function
     */
    addFitnessFunction(fitnessFunction: FitnessFunction<C>): SearchAlgorithmBuilder<C>;

    /**
     * Adds a map of the fitness functions per chromosome.
     * @param fitnessFunctions map of fitness functions
     * @returns the search builder with the applied fitness functions
     */
    addFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): SearchAlgorithmBuilder<C>;

    /**
     * Adds the properties needed by the search algorithm.
     * @param properties the properties to use
     * @returns the search builder with the applied properties
     */
    addProperties(properties: SearchAlgorithmProperties<C>): SearchAlgorithmBuilder<C>;

    /**
     * Adds the selection operation to use.
     * @param selection the selection operator to use
     * @returns the search builder with the applied selection operation
     */
    addSelectionOperator(selectionOperator: Selection<C>): SearchAlgorithmBuilder<C>;

}
