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
import { Pair } from "../utils/Pair";

/**
 * The crossover operator recombines the genetic material of two given chromosomes.
 *
 * @param <C> the type of the chromosome supported by this crossover operator
 * @author Sophia Geserer, Sebastian Schweikl
 */
export abstract class Crossover<C extends Chromosome> {

    /**
     * Applies crossover to the two given parent chromosomes
     * and returns the resulting pair of chromosomes.
     * @param parent1 the first parent
     * @param parent2 the second parent
     * @returns the offspring formed by applying crossover to the given parents
     */
    abstract apply(parent1: C, parent2: C): Pair<C>;

    /**
     * Applies crossover to the given pair of parent chromosomes
     * and returns the resulting pair of chromosomes.
     * @param parents the pair of parent chromosomes
     * @returns the offspring formed by applying crossover to the given parents
     */
    applyFromPair([parent1, parent2]: Pair<C>): Pair<C> {
        return this.apply(parent1, parent2);
    }
}
