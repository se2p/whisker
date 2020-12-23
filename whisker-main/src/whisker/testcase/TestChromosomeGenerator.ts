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

import {ChromosomeGenerator} from "../search/ChromosomeGenerator";
import {SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";
import {List} from "../utils/List";
import {Randomness} from "../utils/Randomness";
import {TestChromosome} from "./TestChromosome";
import {Mutation} from "../search/Mutation";
import {Crossover} from "../search/Crossover";

// TODO: This is a clone of IntegerListGenerator, maybe we should use "has a" rather than "is a" in TestChromosome?

export class TestChromosomeGenerator implements ChromosomeGenerator<TestChromosome> {

    protected readonly _length: number;

    private readonly _min: number;

    private readonly _max: number;

    private _mutationOp: Mutation<TestChromosome>;

    private _crossoverOp: Crossover<TestChromosome>;

    constructor(properties: SearchAlgorithmProperties<TestChromosome>,
                mutationOp: Mutation<TestChromosome>,
                crossoverOp: Crossover<TestChromosome>) {
        this._length = properties.getChromosomeLength();
        this._min = properties.getMinIntRange();
        this._max = properties.getMaxIntRange();
        this._mutationOp = mutationOp;
        this._crossoverOp = crossoverOp;
    }

    /**
     * Creates and returns a random chromosome.
     * @returns a random chromosome
     */
    get(): TestChromosome {
        const codons = new List<number>();
        const length = this.getLength();
        for(let i = 0; i < length; i++) {
            codons.add(Randomness.getInstance().nextInt(this._min, this._max));
        }
        return new TestChromosome(codons, this._mutationOp, this._crossoverOp);
    }

    protected getLength(): number {
        return this._length;
    }

    setMutationOperator(mutationOp: Mutation<TestChromosome>): void {
        this._mutationOp = mutationOp;
    }

    setCrossoverOperator(crossoverOp: Crossover<TestChromosome>): void {
        this._crossoverOp = crossoverOp;
    }

}
