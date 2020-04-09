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

import { FitnessFunction } from "./FitnessFunction"
import { Pair } from "../utils/Pair"
import { Mutation } from "./Mutation"
import { Crossover } from "./Crossover"
import { NotYetImplementedException } from "../core/exceptions/NotYetImplementedException";

/**
 * The Chromosome defines a gene representation for valid solutions to a given optimization problem.
 * 
 * @param <C> the type of the chromosomes produced as offspring by mutation and crossover
 * @author Sophia Geserer
 */
export abstract class Chromosome<C extends Chromosome<C>> {

    /**
     * The crossover operation that defines how to manipulate the gene of two chromosomes. 
     */
    private _crossoverOp: Crossover<C>;

    /**
     * The mutation operator that defines how to mutate the chromosome.
     */
    private _mutationOp: Mutation<C>;

    /**
     * Constructs a new chromosome using the specified crossover and mutation.
     * @param crossover the strategy to perform crossover
     * @param mutation the strategy to perform mutation
     */
    constructor(crossover: Crossover<C>, mutation: Mutation<C>) {
        this._crossoverOp = crossover;
        this._mutationOp = mutation;
    }

    /**
     * Mutates this chromosome and returns the resulting chromosome.
     * @returns the mutated chromosome
     */
    mutate(): C {
        // TODO: I am not sure if this will work (Would be only syntactic sugar)
        // because 'this' cannot be given to mutation as parameter.
        // There is a problem with the generic types.
        throw new NotYetImplementedException();
    }

    /**
     * Pairs this chromosome with the other given chromosome and returns the resulting offspring.
     * @param other the chomosome to pair with
     * @returns the offspring
     */
    crossover(other: C): Pair<C> {
        // TODO: Same issue as in 'mutate'
        throw new NotYetImplementedException();
    }

    /**
     * Computes and returns the fitness of this chromosome using the supplied fitness function.
     * @param fitnessFunction the fitness function with which to compute the fitness of the
     *                        chromosome
     * @returns the fitness of this chromosome
     */
    getFitness(fitnessFunction: FitnessFunction<C>): number {
        // TODO: Same issue as in 'mutate'
        throw new NotYetImplementedException();
    }
}
