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
import {BitstringChromosome} from './BitstringChromosome';
import {Randomness} from "../utils/Randomness";
import {Crossover} from "../search/Crossover";
import {Mutation} from "../search/Mutation";
import {SinglePointCrossover} from "../search/operators/SinglePointCrossover";
import {BitflipMutation} from "./BitflipMutation";

export class BitstringChromosomeGenerator implements ChromosomeGenerator<BitstringChromosome> {

    private readonly _length: number;

    private _mutationOp: Mutation<BitstringChromosome>;

    private _crossoverOp: Crossover<BitstringChromosome>;

    constructor(properties: SearchAlgorithmProperties<BitstringChromosome>) {
        this._length = properties.getChromosomeLength();
        this._mutationOp = new BitflipMutation();
        this._crossoverOp = new SinglePointCrossover<BitstringChromosome>();
    }

    get(): BitstringChromosome {
        let bits = new List<Boolean>();
        for(let i = 0; i < this._length; i++) {
            bits.add(Randomness.getInstance().nextDouble() > 0.5);
        }
        return new BitstringChromosome(bits, this._mutationOp, this._crossoverOp);
    }

    setMutationOperator(mutationOp: Mutation<BitstringChromosome>): void {
        this._mutationOp = mutationOp;
    }

    setCrossoverOperator(crossoverOp: Crossover<BitstringChromosome>): void {
        this._crossoverOp = crossoverOp;
    }
}
