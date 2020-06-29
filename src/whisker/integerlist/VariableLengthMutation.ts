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

import {Mutation} from '../search/Mutation';
import {List} from '../utils/List';
import {Randomness} from '../utils/Randomness';
import {IntegerListChromosome} from './IntegerListChromosome';


export class VariableLengthMutation implements Mutation<IntegerListChromosome> {

    private readonly _min: number;

    private readonly _max: number;

    private readonly _length: number;

    private readonly _alpha: number;

    constructor(min: number, max: number, length: number, alpha: number) {
        this._min = min;
        this._max = max;
        this._length = length;
        this._alpha = alpha;
    }

    apply (chromosome: IntegerListChromosome): IntegerListChromosome {
        let newCodons = new List<number>();
        newCodons.addList(chromosome.getGenes()); // TODO: Immutable list would be nicer

        // TODO: Should be a parameter (or even three different ones)
        const mutationProbability = 1.0 / 3.0;

        if (Randomness.getInstance().nextDouble() < mutationProbability && newCodons.size() > 1) {
            newCodons = this.remove(newCodons);
        }

        if (Randomness.getInstance().nextDouble() < mutationProbability) {
            newCodons = this.change(newCodons);
        }

        if (Randomness.getInstance().nextDouble() < mutationProbability) {
            newCodons = this.insert(newCodons);
        }

        return chromosome.cloneWith(newCodons);
    }

    private getRandomCodon(): number {
        return Randomness.getInstance().nextInt(this._min, this._max);
    }

    private change(oldCodons: List<number>): List<number> {
        const mutationProbability = 1.0 / oldCodons.size();

        const newCodons = new List<number>();
        for (const codon of oldCodons) {
            if (Randomness.getInstance().nextDouble() < mutationProbability) {
                newCodons.add(this.getRandomCodon());
            } else {
                newCodons.add(codon);
            }
        }
        return newCodons;
    }

    private remove(oldCodons: List<number>): List<number> {
        const mutationProbability = 1.0 / oldCodons.size();

        const newCodons = new List<number>();
        for (const codon of oldCodons) {
            if (Randomness.getInstance().nextDouble() >= mutationProbability) {
                newCodons.add(codon);
            }
        }

        if (newCodons.isEmpty()) {
            newCodons.addList(oldCodons);
        }

        return newCodons;
    }

    private insert(oldCodons: List<number>): List<number> {

        const newCodons = new List<number>();
        newCodons.addList(oldCodons);

        let count = 0;

        while(Randomness.getInstance().nextDouble() <= Math.pow(this._alpha, count) && newCodons.size() < this._length) {
            count++;
            const position = Randomness.getInstance().nextInt(0, newCodons.size());
            newCodons.insert(this.getRandomCodon(), position);
        }

        return newCodons;
    }

}
