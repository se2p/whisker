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
import {SingleBitFitnessFunction} from "../../../src/whisker/bitstring/SingleBitFitnessFunction";
import {BitflipMutation} from "../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../src/whisker/search/operators/SinglePointCrossover";

describe('SingleBitFitnessFunction', () => {

    test('All false', async() => {
        const bits = [false, false];
        const chromosome = new BitstringChromosome(bits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());

        const fitnessFunctionPosition0 = new SingleBitFitnessFunction(2, 0);
        const fitnessFunctionPosition1 = new SingleBitFitnessFunction(2, 1);

        expect(await fitnessFunctionPosition0.getFitness(chromosome)).toBe(1);
        expect(await fitnessFunctionPosition1.getFitness(chromosome)).toBe(1);
    });

    test('All true', async () => {
        const bits = [true, true];
        const chromosome = new BitstringChromosome(bits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());

        const fitnessFunctionPosition0 = new SingleBitFitnessFunction(2, 0);
        const fitnessFunctionPosition1 = new SingleBitFitnessFunction(2, 1);

        expect(await fitnessFunctionPosition0.getFitness(chromosome)).toBe(1);
        expect(await fitnessFunctionPosition1.getFitness(chromosome)).toBe(1);
    });

    test('Mixed', async () => {
        const bits = [true, false];
        const chromosome = new BitstringChromosome(bits,
            new BitflipMutation(), new SinglePointCrossover<BitstringChromosome>());

        const fitnessFunctionPosition0 = new SingleBitFitnessFunction(2, 0);
        const fitnessFunctionPosition1 = new SingleBitFitnessFunction(2, 1);

        expect(await fitnessFunctionPosition0.getFitness(chromosome)).toBe(2);
        expect(await fitnessFunctionPosition1.getFitness(chromosome)).toBe(0);
    });

    test('Check optimality', async () => {
        const fitnessFunction = new SingleBitFitnessFunction(2, 0);

        expect(await fitnessFunction.isOptimal(0)).toBeFalsy();
        expect(await fitnessFunction.isOptimal(2)).toBeTruthy();
    });

    test('Check comparison', () => {
        const fitnessFunction = new SingleBitFitnessFunction(2, 0);

        expect(fitnessFunction.compare(0, 2)).toBeLessThan(0);
        expect(fitnessFunction.compare(2, 0)).toBeGreaterThan(0);
        expect(fitnessFunction.compare(1, 1)).toBe(0);
    });
});
