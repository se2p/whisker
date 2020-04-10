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

import {BitstringChromosome} from '../../../src/whisker/bitstrings/BitstringChromosome';
import {List} from '../../../src/whisker/utils/List';
import {BitstringSinglePointCrossover} from "../../../src/whisker/bitstrings/BitstringSinglePointCrossover";

describe('BitstringSinglePointCrossover', () => {

    test('False to true', () => {
        const parent1Bits = new List<Boolean>();
        parent1Bits.add(false);
        parent1Bits.add(false);
        const parent1 = new BitstringChromosome(parent1Bits);

        const parent2Bits = new List<Boolean>();
        parent2Bits.add(true);
        parent2Bits.add(true);
        const parent2 = new BitstringChromosome(parent2Bits);

        const crossover = new BitstringSinglePointCrossover();
        const offspring = crossover.applyAtPosition(parent1, parent2, 1);
        const child1Bits = offspring.getFirst().getBits();
        const child2Bits = offspring.getSecond().getBits();

        expect(child1Bits.size()).toBe(parent1Bits.size());
        expect(child2Bits.size()).toBe(parent1Bits.size());
        expect(child1Bits.get(0)).toBe(!child1Bits.get(1));
        expect(child2Bits.get(0)).toBe(!child2Bits.get(1));
    });

});
