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
     * Probability of removing an integer from the IntegerList
     */
    private readonly _removeProb: number;

    /**
     * Probability of changing some integers in the IntegerList by adding gaussian noise.
     */
    private readonly _changeProb: number;

    /**
     * Power of gaussian noise which is added to integer value in the change mutation
     */
    private readonly _gaussianMutationPower: number

    /**
     * Probability of inserting a new integer to the IntegerList
     */
    private readonly _insertProb: number;

    /**
     * Probability of repeatedly adding a new integer to the IntegerList
     */
    private readonly _alpha: number;

    /**
     * Random number generator.
     */
    private readonly _random: Randomness


    constructor(min: number, max: number, length: number, removeProb: number, changeProb: number,
                gaussianMutationPower: number, insertProb: number, alpha: number) {
        this._min = min;
        this._max = max;
        this._length = length;
        this._removeProb = removeProb;
        this._changeProb = changeProb;
        this._gaussianMutationPower = gaussianMutationPower;
        this._insertProb = insertProb;
        this._alpha = alpha;
        this._random = Randomness.getInstance();
    }

    /**
     * Applies mutation to the IntegerList by either removing, changing or adding integers to the IntegerList.
     * @param chromosome the chromosome which will be mutated
     */
    apply(chromosome: IntegerListChromosome): IntegerListChromosome {
        let newCodons = new List<number>();
        newCodons.addList(chromosome.getGenes()); // TODO: Immutable list would be nicer

        if (this._random.nextDouble() < this._removeProb && newCodons.size() > 1) {
            newCodons = this.remove(newCodons);
        }

        if (this._random.nextDouble() < this._changeProb) {
            newCodons = this.change(newCodons);
        }

        if (this._random.nextDouble() < this._insertProb) {
            newCodons = this.insert(newCodons);
        }

        return chromosome.cloneWith(newCodons);
    }

    /**
     * Changes integers from the IntegerList by adding gaussian noise.
     * @param oldCodons the IntegerList to mutate
     */
    private change(oldCodons: List<number>): List<number> {
        const mutationProbability = 1.0 / oldCodons.size();

        const newCodons = new List<number>();
        for (const codon of oldCodons) {
            if (this._random.nextDouble() < mutationProbability) {
                newCodons.add(this.getRandomCodonGaussian(codon));
            } else {
                newCodons.add(codon);
            }
        }
        return newCodons;
    }

    /**
     * Get a random number sampled from the gaussian distribution with the mean being the integer Value and the
     * standard deviation being the gaussianMutationPower.
     * @param value the integer value to add gaussian noise to.
     */
    private getRandomCodonGaussian(value: number): number {
        const randomGaussian = this._random.nextGaussianInt(value, this._gaussianMutationPower);
        // Wrap the sampled number into the range [this._min, this._max]
        return randomGaussian - (this._max + 1) * Math.floor(randomGaussian / (this._max + 1));
    }

    /**
     * Removes integers from the IntegerList
     * @param oldCodons the IntegerList to mutate
     */
    private remove(oldCodons: List<number>): List<number> {
        const mutationProbability = 1.0 / oldCodons.size();

        const newCodons = new List<number>();
        for (const codon of oldCodons) {
            if (this._random.nextDouble() >= mutationProbability) {
                newCodons.add(codon);
            }
        }

        if (newCodons.isEmpty()) {
            newCodons.addList(oldCodons);
        }

        return newCodons;
    }

    /**
     *
     * Adds integers to the IntegerList
     * @param oldCodons the IntegerList to mutate
     */
    private insert(oldCodons: List<number>): List<number> {

        const newCodons = new List<number>();
        newCodons.addList(oldCodons);

        let count = 0;

        while (this._random.nextDouble() <= Math.pow(this._alpha, count) && newCodons.size() < this._length) {
            count++;
            const position = this._random.nextInt(0, newCodons.size());
            newCodons.insert(this._random.nextInt(this._min, this._max), position);
        }

        return newCodons;
    }

}
