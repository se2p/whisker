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


export abstract class AbstractVariableLengthMutation<T extends IntegerListChromosome> implements Mutation<T> {

    /**
     * Lower bound for integer values
     */
    private readonly _min: number;

    /**
     * Upper bound for integer values
     */
    private readonly _max: number;

    /**
     * Upper bound for IntegerList size.
     */
    private readonly _length: number;

    /**
     * Power of gaussian noise which is added to integer value in the change mutation
     */
    private readonly _gaussianMutationPower: number

    /**
     * Random number generator.
     */
    private readonly _random: Randomness


    protected constructor(min: number, max: number, length: number, gaussianMutationPower: number) {
        this._min = min;
        this._max = max;
        this._length = length;
        this._gaussianMutationPower = gaussianMutationPower;
        this._random = Randomness.getInstance();
    }

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
        const newCodons = new List<number>();
        newCodons.addList(chromosome.getGenes()); // TODO: Immutable list would be nicer
        let index = 0;
        while (index < maxPosition) {
            if (this._random.nextDouble() < this._getMutationProbability(index, maxPosition)) {
                index = this._mutateAtIndex(newCodons, index);
            }
            index++;
        }
        return chromosome.cloneWith(newCodons) as T;
    }

    protected abstract _getMutationProbability(idx: number, numberOfCodons: number): number;

    /**
     * Execute one of the allowed mutations, with equally distributed probability.
     * Since this modifies the size of the list, the adjusted index, after a mutation is returned.
     *
     * @param codons The list of codons that is being mutated.
     * @param index  The index where to mutate inside the list.
     * @return The modified index after the mutation.
     */
    private _mutateAtIndex(codons: List<number>, index: number) {
        const mutation = this._random.nextInt(0, 3)
        switch (mutation) {
            case 0:
                if (codons.size() < this._length) {
                    codons.insert(this._random.nextInt(this._min, this._max), index);
                    index++;
                }
                break;
            case 1:
                codons.replaceAt(this._getRandomCodonGaussian(codons.get(index)), index);
                break;
            case 2:
                if (codons.size() > 1) {
                    codons.removeAt(index);
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
