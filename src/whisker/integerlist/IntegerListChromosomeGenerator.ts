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

import {ChromosomeGenerator} from '../search/ChromosomeGenerator';
import {SearchAlgorithmProperties} from '../search/SearchAlgorithmProperties';
import {List} from '../utils/List';
import {IntegerListChromosome} from "./IntegerListChromosome";
import {Randomness} from "../utils/Randomness";
import {Mutation} from "../search/Mutation";
import {BitstringChromosome} from "../bitstring/BitstringChromosome";
import {Crossover} from "../search/Crossover";
import {IntegerListMutation} from "./IntegerListMutation";
import {SinglePointCrossover} from "../search/operators/SinglePointCrossover";

export class IntegerListChromosomeGenerator implements ChromosomeGenerator<IntegerListChromosome> {

    private readonly _length: number;

    private readonly _min: number;

    private readonly _max: number;

    private _mutationOp: Mutation<IntegerListChromosome>;

    private _crossoverOp: Crossover<IntegerListChromosome>;

    // TODO: Set min and max

    constructor(properties: SearchAlgorithmProperties<IntegerListChromosome>) {
        this._min = 0;  // TODO get from properties -> Add to properties
        this._max = 10;  // TODO see _min
        this._length = properties.getChromosomeLength();
        this._mutationOp = new IntegerListMutation(this._min, this._max);
        this._crossoverOp = new SinglePointCrossover<IntegerListChromosome>();
    }

    /**
     * Creates and returns a random chromosome.
     * @returns a random chromosome
     */
    get(): IntegerListChromosome {
        let codons = new List<number>();
        for (let i = 0; i < this._length; i++) {
            codons.add(Randomness.getInstance().nextInt(this._min, this._max));
        }
        return new IntegerListChromosome(codons, this._mutationOp, this._crossoverOp);
    }

    setMutationOperator(mutationOp: Mutation<IntegerListChromosome>): void {
        this._mutationOp = mutationOp;
    }

    setCrossoverOperator(crossoverOp: Crossover<IntegerListChromosome>): void {
        this._crossoverOp = crossoverOp;
    }
}
