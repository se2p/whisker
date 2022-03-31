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

    test("Set initial seed as number type", () =>{
        const seed = 5;
        Randomness.setInitialSeeds(seed);
        expect(Randomness.getInitialRNGSeed()).toBe(seed);
    });

    test("Set initial seed as string type", () =>{
        const seed = "5";
        Randomness.setInitialSeeds(seed);
        expect(Randomness.getInitialRNGSeed()).toBe(5);
        expect(Randomness.getInstance()).toBeInstanceOf(Randomness);
    });

    test("Set initial seed as string", () =>{
        const seed = "whisker";
        Randomness.setInitialSeeds(seed);
        expect(Randomness.getInitialRNGSeed()).toBeGreaterThan(0);
        expect(Randomness.getInstance()).toBeInstanceOf(Randomness);
    });

    test("Set initial seed as empty string", () =>{
        const seed = "";
        Randomness.setInitialSeeds(seed);
        expect(Date.now() - Randomness.getInitialRNGSeed()).toBeLessThan(1000);
        expect(Randomness.getInstance()).toBeInstanceOf(Randomness);
    });

    test("Same Seed same result", () =>{
        const seed = 5;
        Randomness.setInitialSeeds(seed);
        expect(Randomness.getInitialRNGSeed()).toBe(seed);
    });

    test("Create an integer from a range", () => {

        const random = Randomness.getInstance();
        const num = random.nextInt(0, 10);

        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(10);
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

    test("Pick a random element from an array", () => {
        const random = Randomness.getInstance();
        const list = [1,2,3];
        const num = random.pick(list);

        expect(list).toContain(num);
    });

    test("Different seed, different sequence", () => {

        const random = Randomness.getInstance();
        Randomness.setInitialSeeds(0);
        const sequence1 = [];
        for (let i = 0; i < 100; i++) {
            sequence1.push(random.nextInt(0, 100));
        }
        Randomness.setInitialSeeds(42);
        const sequence2 = [];
        for (let i = 0; i < 100; i++) {
            sequence2.push(random.nextInt(0, 100));
        }
        expect(sequence1).not.toEqual(sequence2);
    });

    test("Pick number from GaussianDistribution", () =>{
        const random = Randomness.getInstance();
        const sampledValues = [];
        for (let i = 0; i < 10000; i++) {
            sampledValues.push(random.nextGaussian(100,2));
        }
        const average = sampledValues.reduce((a, b) => a + b) / sampledValues.length;
        expect(average).toBeGreaterThan(99);
        expect(average).toBeLessThan(101);
    });

    test("Pick integer from GaussianDistribution", () =>{
        const random = Randomness.getInstance();
        const sampledValues = [];
        for (let i = 0; i < 10000; i++) {
            sampledValues.push(random.nextGaussianInt(100,2));
        }
        const average = sampledValues.reduce((a, b) => a + b) / sampledValues.length;
        expect(average).toBeGreaterThan(99);
        expect(average).toBeLessThan(101);
    });
});
