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

import {BitstringChromosome} from './BitstringChromosome';
import {Mutation} from '../search/Mutation';
import {Randomness} from '../utils/Randomness';


export class BitflipMutation implements Mutation<BitstringChromosome> {

    apply (chromosome: BitstringChromosome): BitstringChromosome {
        const oldBits = chromosome.getGenes(); // TODO: Immutable list?
        const newBits: boolean[] = [];
        const mutationProbability = 1.0 / oldBits.length;

        for (const bit of oldBits) {
            if (Randomness.getInstance().nextDouble() < mutationProbability) {
                newBits.push(!bit);
            } else {
                newBits.push(bit);
            }
        }

        return chromosome.cloneWith(newBits);
    }
}
