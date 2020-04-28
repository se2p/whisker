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
import {Preconditions} from '../utils/Preconditions';

/**
 * A fitness function using only one bit at a defined position of a BitstringChromosome
 * for the calculation of the fitness value.
 *
 * @author Adina Deiner
 */
export class SingleBitFitnessFunction implements FitnessFunction<BitstringChromosome> {

    private _size: number;
    private _bitPosition: number;

    constructor(size: number, bitPosition: number) {
        Preconditions.checkArgument(bitPosition < size);
        this._size = size;
        this._bitPosition = bitPosition;
    }

    getFitness(chromosome: BitstringChromosome): number {
        const bits = chromosome.getGenes();
        Preconditions.checkListSize(bits, this._size);
        return bits.get(this._bitPosition) ? 1 : 0;
    }

    compare(value1: number, value2: number): number {
        // Larger fitness values are better
        return value1 - value2;
    }

    isOptimal(fitnessValue: number): boolean {
        return fitnessValue === 1;
    }
}
