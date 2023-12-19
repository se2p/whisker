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

import {FitnessFunction} from "./FitnessFunction";
import {Pair} from "../utils/Pair";
import {Mutation} from "./Mutation";
import {Crossover} from "./Crossover";

/**
 * The Chromosome defines a gene representation for valid solutions to a given optimization problem.
 *
 * @param <C> the type of the chromosomes produced as offspring by mutation and crossover
 * @author Sophia Geserer
 */
export abstract class Chromosome {

    // TODO: If mutation based on lastImprovedFitness turns out to work well, we should think about subclassing this
    //  into something like SingleObjectiveChromosome. For now its placed here to reduce the amount of casts...
    /**
     * The position in the codon list after which no additional fitness improvement regarding the specified
     * targetFitness has been seen.
     */
    private _lastImprovedFitnessCodon: number;

    /**
     * The fitnessFunction this chromosome is optimising for. Only applicable for single-objective focused algorithms
     * like MIO.
     */
    private _targetFitness: FitnessFunction<Chromosome>;

    /**
     * Caches fitnessValues to avoid calculating the same fitness multiple times.
     */
    protected _fitnessCache = new Map<FitnessFunction<Chromosome>, number>();

    /**
     * Saves the number of statements that were covered by this chromosome.
     */
    private _coveredStatements: number;

    get lastImprovedFitnessCodon(): number {
        return this._lastImprovedFitnessCodon;
    }

    set lastImprovedFitnessCodon(value: number) {
        this._lastImprovedFitnessCodon = value;
    }

    get targetFitness(): FitnessFunction<Chromosome> {
        return this._targetFitness;
    }

    set targetFitness(value: FitnessFunction<Chromosome>) {
        this._targetFitness = value;
    }

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
    async getFitness(fitnessFunction: FitnessFunction<this>): Promise<number> {
        if (this._fitnessCache.has(fitnessFunction)) {
            return this._fitnessCache.get(fitnessFunction);
        } else {
            const fitness = await fitnessFunction.getFitness(this);
            this._fitnessCache.set(fitnessFunction, fitness);
            return fitness;
        }
    }

    /**
     * Deletes a specific entry from the cache in order to enforce its fitness calculation.
     * @param fitnessFunction the fitnessFunction that should be erased from the map.
     * @returns boolean set to true if the fitnessFunction was found and deleted from the map.
     */
    public deleteCacheEntry(fitnessFunction: FitnessFunction<this>): boolean {
        return this._fitnessCache.delete(fitnessFunction);
    }

    /**
     * Flushes the fitness cache to enforce a recalculation of the fitness values.
     */
    public flushFitnessCache(): void {
        this._fitnessCache.clear();
    }

    /**
     * Determines whether codons or a saved execution trace should be exectued.
     * @param executeCodons if true the saved codons will be exectued instead of the execution code originating from
     * a previous test execution.
     */
    async evaluate(executeCodons: boolean): Promise<void> {
        // No-op
    }

    /**
     * Determines the number of fitness objectives covered by a given test.
     * @param fitnessFunctions the fitness objectives.
     */
    public async determineCoveredObjectives(fitnessFunctions: FitnessFunction<Chromosome>[]): Promise<void> {
        let coverageCount = 0;
        for (const fitnessFunction of fitnessFunctions) {
            if (await fitnessFunction.isCovered(this)) {
                coverageCount++;
            }
        }
        this._coveredStatements = coverageCount;
    }

    /**
     * A chromosome consists of a sequence of genes. This method returns the number of genes.
     */
    abstract getLength(): number;

    /**
     * Creates a clone of the current chromosome with new genes.
     * @param newGenes
     */
    abstract cloneWith(newGenes: any[]): Chromosome;

    /**
     * Creates a clone of the current chromosome.
     */
    abstract clone(): Chromosome;

    get coveredStatements(): number {
        return this._coveredStatements;
    }
}
