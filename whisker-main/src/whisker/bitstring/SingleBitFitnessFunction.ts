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
 * A fitness function for achieving a bitstring consisting of exactly one set bit at a
 * defined position. Every correct bit value adds 1 to the fitness value, so the optimal fitness
 * is the length of the bitstring.
 *
 * @author Adina Deiner
 */
export class SingleBitFitnessFunction implements FitnessFunction<BitstringChromosome> {

    private readonly _size: number;
    private readonly _bitPosition: number;

    constructor(size: number, bitPosition: number) {
        Preconditions.checkArgument(bitPosition < size);
        this._size = size;
        this._bitPosition = bitPosition;
    }

    async getFitness(chromosome: BitstringChromosome): Promise<number> {
        const bits = chromosome.getGenes();
        Preconditions.checkListSize(bits, this._size);
        let fitness = 0;
        for (let i = 0; i < bits.length; i++) {
            if ((i === this._bitPosition && bits[i])
                || (i !== this._bitPosition && !bits[i])) {
                fitness++;
            }
        }
        return fitness;
    }

    getApproachLevel(chromosome: BitstringChromosome): number {
        return -1;
    }

    getBranchDistance(chromosome: BitstringChromosome): number {
        return -1;
    }


    getCFGDistance(chromosome: BitstringChromosome, hasUnexecutedCdgPredecessor: boolean): number {
        return -1;
    }

    getCDGDepth(): number {
        return 0;
    }

    compare(value1: number, value2: number): number {
        // Larger fitness values are better
        // -> Sort by increasing fitness value
        return value1 - value2;
    }

    async isOptimal(fitnessValue: number): Promise<boolean> {
        return fitnessValue === this._size;
    }

    async isCovered(chromosome: BitstringChromosome): Promise<boolean> {
        return this.isOptimal(await this.getFitness(chromosome));
    }
}
