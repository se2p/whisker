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

import {Randomness} from "../../../src/whisker/utils/Randomness";

describe("Randomness", () => {

    test("Create an integer from a range", () => {

        const random = Randomness.getInstance();
        const num = random.nextInt(0, 10);

        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(10);
    });

    test("Create a float in [0,1]", () => {
        const random = Randomness.getInstance();
        const num = random.nextDouble();

        expect(num).toBeGreaterThanOrEqual(0.0);
        expect(num).toBeLessThanOrEqual(1.0);
    });

    test("Create a float from a range", () => {
        const random = Randomness.getInstance();
        const min = 2.3;
        const max = 10.1;
        const num = random.nextDoubleMinMax(min, max);

        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
    });

    test("Create a random boolean", () => {
        const random = Randomness.getInstance();
        const bool = random.randomBoolean();

        if (bool) {
            expect(bool).toBeTruthy();
        } else {
            expect(bool).toBeFalsy();
        }
    });

    test("Pick a random element from a collection", () => {
        const random = Randomness.getInstance();
        const list: number[] = [1, 2, 3];
        const num = random.pick(list);

        expect(list).toContain(num);
    });
});
