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

import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointRelativeCrossover} from "../../../../src/whisker/search/operators/SinglePointRelativeCrossover";

describe('SinglePointRelativeCrossover', () => {

    test('Select best for maximizing fitness function', () => {
        const bits1 = [true, true];
        const parent1 = new BitstringChromosome(bits1,
            new BitflipMutation(), new SinglePointRelativeCrossover<BitstringChromosome>(1));

        const bits2 = [false, false, false, false];
        const parent2 = new BitstringChromosome(bits2,
            new BitflipMutation(), new SinglePointRelativeCrossover<BitstringChromosome>(1));


        const xover = new SinglePointRelativeCrossover(1);
        const [offspring1, offspring2] = xover.apply(parent1, parent2);

        let numTrue = 0;
        let numFalse = 0;

        for (const bit of offspring1.getGenes()) {
            if (bit === true) {
                numTrue++;
            } else {
                numFalse++;
            }
        }

        // Must have true and false
        expect(numTrue).toBeGreaterThan(0);
        expect(numFalse).toBeGreaterThan(0);

        for (const bit of offspring2.getGenes()) {
            if (bit === true) {
                numTrue++;
            } else {
                numFalse++;
            }
        }

        // Total number of true/false has not changed
        expect(numTrue).toBe(parent1.getLength());
        expect(numFalse).toBe(parent2.getLength());

        // No offspring is longer than the longest parent
        expect(offspring1.getLength()).toBeLessThanOrEqual(Math.max(parent1.getLength(), parent2.getLength()));
        expect(offspring2.getLength()).toBeLessThanOrEqual(Math.max(parent1.getLength(), parent2.getLength()));
    });

});
