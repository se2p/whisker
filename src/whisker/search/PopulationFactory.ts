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

import {ChromosomeGenerator} from "./ChromosomeGenerator"
import {Chromosome} from "./Chromosome"
import {List} from "../utils/List"

/**
 * A factory for populations of genetic algorithms.
 *
 * @author Sophia Geserer
 */
export class PopulationFactory {

    private constructor() {
    }

    /**
     * Generates a new population of the specified size using the supplied generator to create
     * population individuals.
     * @param generator the generator used to create random chromosomes
     * @param size the number of chromosomes in the population
     * @returns the resultion population of chromosomes
     */
    static generate<C extends Chromosome>(generator: ChromosomeGenerator<C>, size: number): List<C> {
        const population = new List<C>();
        for (let i = 0; i < size; i++) {
            population.add(generator.get());
        }
        return population;
    }
}
