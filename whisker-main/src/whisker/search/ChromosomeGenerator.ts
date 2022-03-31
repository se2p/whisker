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
import {Mutation} from "./Mutation";
import {Crossover} from "./Crossover";

/**
 * A generator for random chromosomes.
 *
 * @param <C> the type of the chromosomes this generator is able to produce
 * @author Sophia Geserer
 */
export interface ChromosomeGenerator<C extends Chromosome> {

    /**
     * Creates and returns a random chromosome.
     * @returns a random chromosome
     */
    get(): C;

    /**
     * Helper method to ensure a mutation operator is configured in the generator.
     */
    setMutationOperator(mutationOp: Mutation<C>): void;

    /**
     * Helper method to ensure a crossover operator is configured in the generator.
     */
    setCrossoverOperator(crossoverOp: Crossover<C>): void;

}
