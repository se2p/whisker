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
import {Randomness} from '../utils/Randomness';
import {IntegerListChromosome} from './IntegerListChromosome';


export class IntegerListMutation implements Mutation<IntegerListChromosome> {

    private readonly _min: number;

    private readonly _max: number;

    constructor(min: number, max: number) {
        this._min = min;
        this._max = max;
    }

    apply (chromosome: IntegerListChromosome): IntegerListChromosome {
        const oldCodons = chromosome.getGenes(); // TODO: Immutable list?
        const newCodons: number[] = [];
        const mutationProbability = 1.0 / oldCodons.length;

        for (const codon of oldCodons) {
            if (Randomness.getInstance().nextDouble() < mutationProbability) {
                newCodons.push(Randomness.getInstance().nextInt(this._min, this._max));
                // TODO: Gaussian noise might be a better solution
            } else {
                newCodons.push(codon);
            }
        }

        return chromosome.cloneWith(newCodons);
    }
}
