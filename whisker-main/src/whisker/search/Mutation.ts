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

/**
 * Mutation introduces new genetic material to create a offspring by modifying the parent chromosome.
 *
 * @param <C> the type of chromosomes supported by this mutation operator
 * @author Sophia Geserer
 */
export interface Mutation<C extends Chromosome> {

    /**
     * Applies mutation to the specified chromosome and returns the resulting offspring.
     * @param chromosome the parent chromosome to modify by mutation
     * @returns the offspring fromed by mutating the parent
     */
    apply(chromosome: C): C;

}
