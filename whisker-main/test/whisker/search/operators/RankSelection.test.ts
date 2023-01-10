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

import {RankSelection} from "../../../../src/whisker/search/operators/RankSelection";
import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {Chromosome} from "../../../../src/whisker/search/Chromosome";
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";

describe('RankSelection', () => {

    test('Distribution of the selection', async () => {
        const selection = new RankSelection();
        const population = [];
        const populationSize = 5;
        const selectionCount = new Map<Chromosome, number>();
        for (let i = 0; i < populationSize; i++) {
            const chromosome = new BitstringChromosome([], new BitflipMutation(), new SinglePointCrossover());
            population.push(chromosome);
            selectionCount.set(chromosome, 0);
        }
        for (let i = 0; i < 1000; i++) {
            const selected = await selection.apply(population);
            selectionCount.set(selected, selectionCount.get(selected) + 1);
        }
        for (let i = 0; i < populationSize - 1; i++) {
            expect(selectionCount.get(population[i])).toBeLessThanOrEqual(selectionCount.get(population[i + 1]));
        }
    });
});
