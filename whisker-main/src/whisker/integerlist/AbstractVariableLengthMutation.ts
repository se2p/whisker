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
import Arrays from "../utils/Arrays";


export abstract class AbstractVariableLengthMutation<T extends IntegerListChromosome> implements Mutation<T> {

    /**
     * Random number generator.
     */
    private readonly _random: Randomness;

    /**
     *
     * @param _min Lower bound for integer values
     * @param _max Upper bound for integer values
     * @param _length Upper bound for IntegerList size.
     * @param _gaussianMutationPower
     */
    protected constructor(
        private readonly _min: number,
        private readonly _max: number,
        private readonly _length: number,
        private readonly _gaussianMutationPower: number
    ) {
        this._random = Randomness.getInstance();
    }

    /**
     * Defines the probability of mutating the codon at position idx of the codon list.
     * @param idx codon position for which a mutation probability should be determined.
     * @param numberOfCodons the total number of mutation candidates.
     * @returns number defining the mutation probability of the codon at position idx.
     */
    protected abstract _getMutationProbability(idx: number, numberOfCodons: number): number;

    abstract apply(chromosome: T): T;

    /**
     * Returns a mutated deep copy of the given chromosome.
     * If a index inside the list mutates it executes one of the following mutations with equal probability:
     *  - add a new codon to the list at the index
     *  - replace the current codon at the index using gaussian noise
     *  - remove the current codon at the index
     * @param chromosome The original chromosome, that mutates.
     * @param maxPosition The location up to which to mutate
     * @return A mutated deep copy of the given chromosome.
     */
    applyUpTo(chromosome: T, maxPosition: number): T {
        const newCodons: number[] = [];
        newCodons.push(...chromosome.getGenes()); // TODO: Immutable list would be nicer
        let index = 0;
        while (index < maxPosition) {
            if (this._random.nextDouble() < this._getMutationProbability(index, maxPosition)) {
                index = this._mutateAtIndex(newCodons, index);
            }
            index++;
        }
        return chromosome.cloneWith(newCodons) as T;
    }

    /**
     * Execute one of the allowed mutations, with equally distributed probability.
     * Since this modifies the size of the list, the adjusted index, after a mutation is returned.
     *
     * @param codons The list of codons that is being mutated.
     * @param index  The index where to mutate inside the list.
     * @return The modified index after the mutation.
     */
    private _mutateAtIndex(codons: number[], index: number) {
        const mutation = this._random.nextInt(0, 3);
        switch (mutation) {
            case 0:
                if (codons.length < this._length) {
                    Arrays.insert(codons, this._random.nextInt(this._min, this._max), index);
                    index++;
                }
                break;
            case 1:
                codons[index] = this._getRandomCodonGaussian(codons[index]);
                break;
            case 2:
                if (codons.length > 1) {
                    Arrays.removeAt(codons, index);
                    index--;
                }
                break;
        }
        return index;
    }

    /**
     * Get a random number sampled from the gaussian distribution with the mean being the integer Value and the
     * standard deviation being the gaussianMutationPower.
     * @param value the integer value to add gaussian noise to.
     */
    private _getRandomCodonGaussian(value: number): number {
        const randomGaussian = this._random.nextGaussianInt(value, this._gaussianMutationPower);
        // Wrap the sampled number into the range [this._min, this._max]
        return randomGaussian - (this._max + 1) * Math.floor(randomGaussian / (this._max + 1));
    }
}
