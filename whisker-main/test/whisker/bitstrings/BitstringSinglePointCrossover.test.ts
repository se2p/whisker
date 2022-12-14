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

import {BitstringChromosome} from '../../../src/whisker/bitstring/BitstringChromosome';
import {SinglePointCrossover} from "../../../src/whisker/search/operators/SinglePointCrossover";
import {BitflipMutation} from "../../../src/whisker/bitstring/BitflipMutation";

describe('BitstringSinglePointCrossover', () => {

    test('False to true', () => {
        const parent1Bits = [false, false];
        const parent1 = new BitstringChromosome(parent1Bits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());

        const parent2Bits = [true, true];
        const parent2 = new BitstringChromosome(parent2Bits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());

        const crossover = new SinglePointCrossover<BitstringChromosome>();
        const [child1Bits, child2Bits] = crossover.applyAtPosition(parent1, parent2, 1).map((p) => p.getGenes());

        expect(child1Bits.length).toBe(parent1Bits.length);
        expect(child2Bits.length).toBe(parent1Bits.length);
        expect(child1Bits[0]).toBe(!child1Bits[1]);
        expect(child2Bits[0]).toBe(!child2Bits[1]);
    });

});
