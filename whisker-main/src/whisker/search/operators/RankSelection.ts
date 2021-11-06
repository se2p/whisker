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

/**
 * The rank selection operator.
 *
 * @param <C> The chromosome type.
 * @author Adina Deiner
 */
export class RankSelection<C extends Chromosome> implements Selection<C> {

    /**
     * Selects a chromosome from the given population and returns the result.
     *
     * @param sortedPopulation The population of chromosomes from which to select, sorted in ascending order.
     * @returns the selected chromosome.
     */
    apply(sortedPopulation: C[]): C {
        const upperSelectionBorders = new Map<C, number>();
        const N = sortedPopulation.length;
        const c = (2 * N) / (N + 1);
        let probabilitySum = 0;
        for (let i = 1; i <= N; i++) {
            const probability = (1 / N) * (2 - c + 2 * (c - 1) * (i - 1) / (N - 1));
            probabilitySum += probability;
            const chromosome = sortedPopulation[i - 1];
            upperSelectionBorders.set(chromosome, probabilitySum);
        }
        let selected = sortedPopulation[N - 1];
        const random = Randomness.getInstance().nextDouble();
        for (const chromosome of sortedPopulation) {
            const upperBorder = upperSelectionBorders.get(chromosome);
            if (random < upperBorder) {
                selected = chromosome;
                break;
            }
        }
        return selected;
    }
}
