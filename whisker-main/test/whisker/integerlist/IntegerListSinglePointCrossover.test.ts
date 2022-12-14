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

import {SinglePointCrossover} from "../../../src/whisker/search/operators/SinglePointCrossover";
import {IntegerListChromosome} from "../../../src/whisker/integerlist/IntegerListChromosome";
import {IntegerListMutation} from "../../../src/whisker/integerlist/IntegerListMutation";

describe('IntegerListSinglePointCrossover', () => {

    test('False to true', () => {
        const parent1Ints = [1, 2];
        const parent1 = new IntegerListChromosome(parent1Ints,
            new IntegerListMutation(0, 10), new SinglePointCrossover<IntegerListChromosome>());

        const parent2Ints = [3, 4];
        const parent2 = new IntegerListChromosome(parent2Ints,
            new IntegerListMutation(0, 10), new SinglePointCrossover<IntegerListChromosome>());

        const crossover = new SinglePointCrossover<IntegerListChromosome>();
        const offspring = crossover.applyAtPosition(parent1, parent2, 1);
        const [child1Ints, child2Ints] = offspring.map((p) => p.getGenes());

        expect(child1Ints.length).toBe(parent1Ints.length);
        expect(child2Ints.length).toBe(parent1Ints.length);
        expect(child1Ints[0] + child1Ints[1]).toBe(5); // 1+4 or 2+3
        expect(child2Ints[0] + child2Ints[1]).toBe(5); // 1+4 or 2+3
    });

});
