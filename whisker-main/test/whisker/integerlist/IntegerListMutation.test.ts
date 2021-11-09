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

import {IntegerListChromosome} from "../../../src/whisker/integerlist/IntegerListChromosome";
import {IntegerListMutation} from "../../../src/whisker/integerlist/IntegerListMutation";
import {SinglePointCrossover} from "../../../src/whisker/search/operators/SinglePointCrossover";

describe('IntegerListMutation', () => {

    test('Check number is replaced', () => {
        const originalNumbers = [0]; // This is smaller than the range specified for the mutation
        const chromosome = new IntegerListChromosome(originalNumbers,
            new IntegerListMutation(0, 10), new SinglePointCrossover<IntegerListChromosome>());

        const mutation = new IntegerListMutation(10, 20);
        const offspring = mutation.apply(chromosome);
        const mutatedNumbers = offspring.getGenes();

        expect(mutatedNumbers.length).toBe(originalNumbers.length);
        expect(mutatedNumbers[0]).toBeGreaterThanOrEqual(10);
    });

});
