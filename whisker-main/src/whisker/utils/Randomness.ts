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

import seed from 'seed-random';


/**
 * Seeded singleton random number generator
 *
 * Based on https://gist.github.com/lsenta/15d7f6fcfc2987176b54
 */
export class Randomness {

    /**
     * Holds the Randomness instance created by the private constructor
     */
    private static _instance: Randomness;

    /**
     * Initial seed for the random number generator
     */
    private static _initialRNGSeed: number;

    /**
     * Current random number generator seed
     */
    private _RNGSeed: number;

    /**
     * Seed for the Scratch-VM. Initial value set to 0 to ensure that tests, generated using Whisker's TestGenerator,
     * will produce the same results if no seed is set.
     */
    private static _scratchSeed = 0;

    /**
     * Private constructor to prevent construction with new
     */
    private constructor() {
        if (Randomness._initialRNGSeed) {
            this._RNGSeed = Randomness._initialRNGSeed;
        } else {
            this._RNGSeed = Date.now();
        }
    }

    /**
     * Instance accessor
     */
    public static getInstance(): Randomness {
        if (!Randomness._instance) {
            Randomness._instance = new Randomness();
        }

        return Randomness._instance;
    }

    /**
     * Sets the seed for the RNG and the Scratch-VM
     * @param seed the seed to which the RNG and the Scratch-VM should be set to.
     */
    public static setInitialSeeds(seed: (number | string)): void {
        Randomness.setInitialRNGSeed(seed);
        // Only set the seed if one has been specified
        if (seed !== "") {
            Randomness.setScratchSeed(seed);
        }
    }

    /**
     * Set the initial random number generator seed.
     * @param seed the random number generator seed
     */
    public static setInitialRNGSeed(seed: (number | string)): void {
        const convertedSeed = this.convertSeed(seed);
        console.log(`Seeding the RNG to ${convertedSeed}`);
        Randomness._initialRNGSeed = convertedSeed;
    }

    /**
     * Set the seed for the Scratch-VM.
     * @param seed the Scratch-VM seed
     * @param silence determines whether we want to log the modified seed.
     */
    public static setScratchSeed(seed: (number | string), silence = false): void {
        const convertedSeed = this.convertSeed(seed);
        if (!silence) {
            console.log(`Seeding the Scratch-VM to ${convertedSeed}`);
        }
        Randomness._scratchSeed = convertedSeed;
    }

    /**
     * Converts a string to a number. If the seed is already of type number, the number is simply returned.
     * @param seed the seed which should be transformed into a number type.
     * @returns number representing the seed
     */
    private static convertSeed(seed: (number | string)): number {
        // No need to convert if we already have a number
        if (typeof seed === "number") {
            return seed;
        } else if (seed !== "") {
            // If the string represents a number but has typeof string parse it into a number
            let parsedSeed = parseInt(seed, 10);
            // If the seed does not represent a number ( e.g "whisker") sum up the UTF-16 code units
            if (isNaN(parsedSeed)) {
                parsedSeed = [...seed].map(char => char.charCodeAt(0)).reduce((current, previous) => previous + current);
            }
            return parsedSeed;
        } else {
            return Date.now();
        }
    }

    /**
     * Returns the initial random number generator seed.
     * @returns number representing the random number generator seed.
     */
    public static getInitialRNGSeed(): number {
        return Randomness._initialRNGSeed;
    }

    /**
     * Helper function to return a number between min and max.
     * @param min lower bound inclusive
     * @param max upper bound exclusive
     * @return number between min and max
     */
    private next(min: number, max: number): number {
        max = max || 0;
        min = min || 0;

        this._RNGSeed = (this._RNGSeed * 9301 + 49297) % 233280;
        const rnd = this._RNGSeed / 233280;

        return min + rnd * (max - min);
    }

    /**
     * Pick a random integer from a range
     * @param min Lower bound of range inclusive
     * @param max Upper bound of range exclusive
     */
    public nextInt(min: number, max: number): number {
        return Math.floor(this.next(min, max));
    }

    /**
     * Pick a random floating point number between 0..1
     */
    public nextDouble(): number {
        return this.next(0, 1);
    }

    /**
     * Pick a random floating point number from a range.
     * @param min Lower bound of range
     * @param max Upper bound of range
     */
    public nextDoubleMinMax(min: number, max: number): number {
        return this.next(min, max);
    }

    /**
     * Pick a random boolean.
     */
    public randomBoolean(): boolean {
        return this.next(0, 1) >= 0.5;
    }

    /**
     * Pick a random item from an array
     *
     * @param array from which to pick an item
     */
    public pick<T>(array: T[]): T {
        return array[this.nextInt(0, array.length)];
    }

    /**
     * Generate a random number sampled from a gaussian distribution using the Marsaglia polar method.
     * @param mean the mean of the gaussian distribution
     * @param std the std of the gaussian distribution
     */
    public nextGaussian(mean: number, std: number): number {
        let x, y, s;
        do {
            x = this.nextDouble() * 2 - 1;
            y = this.nextDouble() * 2 - 1;
            s = x * x + y * y;
        } while (s >= 1 || s == 0);
        s = Math.sqrt(-2.0 * Math.log(s) / s);
        return mean + std * x * s;
    }

    /**
     * Generate a random integer sampled from a gaussian distribution using the Marsaglia polar method.
     * @param mean the mean of the gaussian distribution
     * @param std the std of the gaussian distribution
     */
    public nextGaussianInt(mean: number, std: number): number {
        return Math.round(this.nextGaussian(mean, std));
    }

    /**
     * Sets a seed for the Scratch-VM to enable reproduction of scratch project execution.
     */
    public static seedScratch(): void {
        seed(Randomness._scratchSeed, {global: true});
    }

    static get scratchSeed(): number {
        return this._scratchSeed;
    }
}
