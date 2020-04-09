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
 * along with Whisker.
 * If not, see http://www.gnu.org/licenses/.
 * 
 */

import { List } from "../utils/List";
import { Chromosome } from "./Chromosome";
import { SearchAlgorithmProperties } from "./SearchAlgorithmProperties";
import { ChromosomeGenerator } from "./ChromosomeGenerator";

/**
 * Represents a strategy to search for an approximated solution to a given problem.
 * 
 * @param <C> the solution encoding of the problem
 * @author Sophia Geserer
 */
export interface SearchAlgorithm<C extends Chromosome<C>> {

    _properties: SearchAlgorithmProperties;

    _chromosomeGenerator: ChromosomeGenerator<C>;

    /**
     * Returns a list of possible admissible solutions for the given problem.
     * @returns Solution for the given problem
     */
    findSolution(): List<C>;

    /**
     * Sets the properties for this search algorithm.
     * @param properties the properties for the search algorithm
     */
    setProperties(properties: SearchAlgorithmProperties): void;

    /**
     * Sets the chromosome generator for this search algorithm.
     * @param generator the generator to create a chromosome
     */
    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void;

}
