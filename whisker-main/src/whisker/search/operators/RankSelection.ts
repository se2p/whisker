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
 * along with Whisker. ßIf not, see http://www.gnu.org/licenses/.
 *
 */

import {Chromosome} from "../Chromosome";
import {Selection} from "../Selection";
import {Randomness} from "../../utils/Randomness";
import {FitnessFunction} from "../FitnessFunction";
import {IllegalArgumentException} from "../../core/exceptions/IllegalArgumentException";

/**
 * The rank selection operator.
 *
 * @param <C> The chromosome type.
 * @author Adina Deiner
 */
export class RankSelection<C extends Chromosome> implements Selection<C> {

    /**
     * Rank-biased selection of a chromosome in the given population. If also given a fitness function, the population
     * is sorted in-place according to it. Otherwise, it is assumed the population is already sorted, from the worst
     * fitness to the best. The optional bias parameter can be used to adjust selective pressure.
     *
     * @param population the population from which to select
     * @param fitnessFunction the fitness function to sort the population with
     * @param bias the rank bias to adjust selective pressure
     */
    async apply(population: Array<C>, fitnessFunction?: FitnessFunction<C>, bias?: number): Promise<C> {
        if (!fitnessFunction) {
            const index = this._getIndex(population.length, bias);
            return population[index];
        }

        const fitnessValues = await Promise.all(population.map((c) => c.getFitness(fitnessFunction)));
        const entries = [...fitnessValues.entries()].map(([idx, fitness]) => [fitness, population[idx]] as const);
        entries.sort((([f1], [f2]) => fitnessFunction.compare(f1, f2)));

        const groupedByFitness = new Map<number, Array<C>>();
        for (const [f, c] of entries) {
            if (!groupedByFitness.has(f)) {
                groupedByFitness.set(f, []);
            }
            groupedByFitness.get(f).push(c);
        }

        const index = this._getIndex(groupedByFitness.size, bias);
        const fitness = [...groupedByFitness.keys()][index];
        const chromosomes = groupedByFitness.get(fitness);
        return Randomness.getInstance().pick(chromosomes);
    }

    /**
     * Approximates the index of the selected individual in O(1) by transforming an equally distributed random variable
     * `r`, as described by Whitley in the GENITOR algorithm (1989). For rank biases between 1 and 2, this produces
     * results almost identical to the text-book implementation of rank selection. If no bias is given, the bias is
     * computed such that the probability of selecting a chromosome is directly proportionate to its rank. While good
     * chromosomes are always favored over bad ones, a rank bias close to 1 increases the selection chance of bad
     * individuals, and a bias close to 2 increases the chance for good individuals.
     *
     * @param ranks the number of ranks
     * @param bias rank selection bias, between 1 and 2
     * @private
     */
    private _getIndex(ranks: number, bias?: number): number {
        if (ranks === 1) {
            return 0;
        }

        if (!bias) {
            bias = 2.0 * ranks / (ranks + 1.0);
        } else if (!(1 < bias && bias <= 2)) {
            throw new IllegalArgumentException(`Invalid rank bias ${bias}, expected 1 < bias <= 2`);
        }

        // Approximate the index `i`.
        const r = Randomness.getInstance().nextDouble();
        const d = (bias - Math.sqrt((bias * bias) - (4.0 * (bias - 1.0) * r))) / 2.0 / (bias - 1.0);
        const i = Math.floor(ranks * d);

        // Whitley's formula assumes the best individual is assigned the lowest rank. But for us, it's the opposite.
        return ranks - 1 - i;
    }
}
