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
import {Preconditions} from "../../utils/Preconditions";

/**
 * The tournament selection operator.
 *
 * @param <C> The chromosome type.
 */
export class TournamentSelection<C extends Chromosome> implements Selection<C> {

    private readonly _tournamentSize;

    constructor(tournamentSize: number) {
        this._tournamentSize = tournamentSize;
    }

    /**
     * Selects a chromosome from the given population and returns the result.
     *
     * @param population the population of chromosomes from which to select, sorted in ascending order.
     * @param fitnessFunction the fitness function on which the selection is based
     * @returns the selected chromosome.
     */
    async apply(population: C[], fitnessFunction: FitnessFunction<C>): Promise<C> {
        Preconditions.checkNotUndefined(fitnessFunction);
        let iteration = 0;
        let winner = Randomness.getInstance().pick(population);
        let bestFitness = await winner.getFitness(fitnessFunction);
        while (iteration < this._tournamentSize) {
            const candidate = Randomness.getInstance().pick(population);
            const candidateFitness = await candidate.getFitness(fitnessFunction);

            if (fitnessFunction.compare(candidateFitness, bestFitness) > 0 ||
                (fitnessFunction.compare(candidateFitness, bestFitness) == 0 && candidate.getLength() < winner.getLength())) {
                bestFitness = candidateFitness;
                winner = candidate;
            }
            iteration++;
        }
        return winner;
    }
}
