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

import {FitnessFunction} from '../search/FitnessFunction';
import {BitstringChromosome} from './BitstringChromosome';
import {Preconditions} from "../utils/Preconditions";


export class OneMaxFitnessFunction implements FitnessFunction<BitstringChromosome> {

    protected _size: number;

    constructor(size: number) {
        this._size = size;
    }

    getFitness (chromosome: BitstringChromosome): number {
        const bits = chromosome.getGenes();
        Preconditions.checkListSize(bits, this._size);

        let numOnes = 0;

        // This whole loop could probably be summarised in a single line
        // if we used an Array and some map/apply construct
        for (const bit of bits) { // TODO: could be done using map/apply?
            if (bit) {
                numOnes++;
            }
        }

        return numOnes;
    }

    compare (value1: number, value2: number): number {
        // Larger fitness values are better
        return value2 - value1;
    }

    isOptimal(fitnessValue: number): boolean {
        return fitnessValue == this._size;
    }
}
