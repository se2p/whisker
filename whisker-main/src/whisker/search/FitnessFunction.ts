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
 * A fitness function maps a given chromosome onto a numeric value that represents the goodness of
 * the solution encoded by that particular chromosome.
 *
 * @param <C> the type of the chromosmes rated by this fitness function
 * @author Sophia Geserer
 */
export interface FitnessFunction<C extends Chromosome> {

    /**
     * Computes and returns the fitness value for the given chromosome.
     * @param chromosome the chromosome to rate
     * @returns the fitness value of the specified chromosome
     */
    getFitness(chromosome: C): Promise<number>;

    /**
     * Computes and returns the branch distance value for the given chromosome.
     * @param chromosome the chromosome to rate
     * @returns the branch distance value of the specified chromosome
     */
    getBranchDistance(chromosome: C): number;

    /**
     * Computes and returns the approach level value for the given chromosome.
     * @param chromosome the chromosome to rate
     * @returns the approach level  value of the specified chromosome
     */
    getApproachLevel(chromosome: C): number;

    /**
     * Computes and returns the CFG Distance value for the given chromosome.
     * @param chromosome the chromosome to rate
     * @param hasUnexecutedCdgPredecessor
     * @returns the CFG distance value of the specified chromosome
     */
    getCFGDistance(chromosome: C, hasUnexecutedCdgPredecessor: boolean): number;

    /**
     * @returns the nesting depth of the fitness function itself
     */
    getCDGDepth(): number;

    /**
     * Comparator for two fitness values:
     *
     * We are sorting ascending, from bad fitness to better fitness
     *
     * Return greater than 0 if value1 is better than value2
     * Return 0 if value1 equals value2
     * Return less than 0 if value1 is worse than value2
     *
     * @param value1 first fitness value
     * @param value2 second fitness value
     */
    compare(value1: number, value2: number): number;

    /**
     * Confirm whether the given fitness value is the optimal one
     *
     * @param fitnessValue to check
     */
    isOptimal(fitnessValue: number): Promise<boolean>;

    /**
     * Confirm whether the fitness function achieves an optimal value for the given chromosome
     *
     * @param chromosome to check the fitness function with
     */
    isCovered(chromosome: Chromosome): Promise<boolean>;
}
