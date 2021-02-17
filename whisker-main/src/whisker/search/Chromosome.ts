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

import {FitnessFunction} from "./FitnessFunction"
import {Pair} from "../utils/Pair"
import {Mutation} from "./Mutation"
import {Crossover} from "./Crossover"
import {List} from "../utils/List";

/**
 * The Chromosome defines a gene representation for valid solutions to a given optimization problem.
 *
 * @param <C> the type of the chromosomes produced as offspring by mutation and crossover
 * @author Sophia Geserer
 */
export abstract class Chromosome {

    /**
     * Retrieve the crossover operator to apply
     */
    abstract getCrossoverOperator(): Crossover<this>;

    /**
     * Retrieve the mutation operator to apply
     */
    abstract getMutationOperator(): Mutation<this>;

    /**
     * Mutates this chromosome and returns the resulting chromosome.
     * @returns the mutated chromosome
     */
    mutate(): this {
        return this.getMutationOperator().apply(this);
    }

    /**
     * Pairs this chromosome with the other given chromosome and returns the resulting offspring.
     * @param other the chromosome to pair with
     * @returns the offspring
     */
    crossover(other: this): Pair<this> {
        return this.getCrossoverOperator().apply(this, other);
    }

    /**
     * Computes and returns the fitness of this chromosome using the supplied fitness function.
     * @param fitnessFunction the fitness function with which to compute the fitness of the
     *                        chromosome
     * @returns the fitness of this chromosome
     */
    getFitness(fitnessFunction: FitnessFunction<this>): number {
        return fitnessFunction.getFitness(this);
    }

    async evaluate(): Promise<void> {
        console.log("Evaluate")
        // No-op
    }

    /**
     * A chromosome consists of a sequence of genes. This method returns the number of genes.
     */
    abstract getLength(): number;

    /**
     * Creates a clone of the current chromosome with new genes.
     * @param newGenes
     */
    abstract cloneWith(newGenes: List<any>): Chromosome;

    /**
     * Creates a clone of the current chromosome.
     */
    abstract clone(): Chromosome;
}
