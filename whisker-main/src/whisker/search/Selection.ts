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

import { Chromosome } from "./Chromosome";
import {FitnessFunction} from "./FitnessFunction";

/**
 * The selection operator is responsible for determining which chromosomes should be subjected to
 * mutation and crossover.
 *
 * @param <C> the type of chromosomes this selection function is compatible with
 * @author Sophia Geserer
 */
export interface Selection<C extends Chromosome> {

    /**
     * Selects a chromosome from the given population and returns the result.
     * @param population the population of chromosomes from which to select
     * @param fitnessFunction the fitness function on which the selection is based
     * @returns the selected chromosome
     */
    apply(population: C[], fitnessFunction?: FitnessFunction<C>): Promise<C>;

}
