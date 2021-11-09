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
import {BitflipMutation} from "../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../src/whisker/search/operators/SinglePointCrossover";

describe('BitflipMutation', () => {

    test('False to true', () => {
        const originalBits = [false];
        const chromosome = new BitstringChromosome(originalBits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());

        const mutation = new BitflipMutation();
        const offspring = mutation.apply(chromosome);
        const mutatedBits = offspring.getGenes();

        expect(mutatedBits.length).toBe(originalBits.length);
        expect(mutatedBits[0]).toBe(true);
    });

    test('True to false', () => {
        const originalBits = [true];
        const chromosome = new BitstringChromosome(originalBits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());

        const mutation = new BitflipMutation();
        const offspring = mutation.apply(chromosome);
        const mutatedBits = offspring.getGenes();

        expect(mutatedBits.length).toBe(originalBits.length);
        expect(mutatedBits[0]).toBe(false);
    });
});
