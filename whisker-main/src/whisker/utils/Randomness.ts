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

import {List} from "./List";
import seed from 'seed-random';


/**
 * Seeded singleton random number generator
 *
 * Based on https://gist.github.com/lsenta/15d7f6fcfc2987176b54
 */
export class Randomness {

    private static _instance: Randomness;

    private static _initialSeed: number;

    private _seed: number;

    /**
     * Private constructor to prevent construction with new
     */
    private constructor() {
        if (Randomness._initialSeed) {
            this._seed = Randomness._initialSeed;
        } else {
            this._seed = Date.now();
        }
        console.log(`Using random seed ${this._seed}`);
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
     * Set the initial seed.
     * Does nothing if random number generator has already been initialized.
     *
     * @param seed the initial seed
     */
    public static setInitialSeed(seed: (number | string)): void {
        if (typeof seed === "string") {
            // If the string represents a number but has typeof string parse it into a number
            let parsedSeed = parseInt(seed, 10);
            // If the seed does not represent a number ( e.g "whisker") sum up the UTF-16 code units
            if (isNaN(parsedSeed)) {
                parsedSeed = [...seed].map(char => char.charCodeAt(0)).reduce((current, previous) => previous + current)
            }
            seed = parsedSeed;
        }
        Randomness._initialSeed = seed;
    }

    public static getInitialSeed(): number {
        return Randomness._initialSeed;
    }

    private next(min: number, max: number): number {
        max = max || 0;
        min = min || 0;

        this._seed = (this._seed * 9301 + 49297) % 233280;
        const rnd = this._seed / 233280;

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
     * Pick a random item from a collection
     *
     * @param collection from which to pick an item
     */
    public pick(collection: any[]): any {
        return collection[this.nextInt(0, collection.length)];
    }

    /**
     * Pick a random item from a List
     *
     * @param list from which to pick an item
     */
    public pickRandomElementFromList<C>(list: List<C>): C {
        return list.get(this.nextInt(0, list.size()));
    }

    /**
     * Generate a random number sampled from a gaussian distribution using the Marsaglia polar method.
     * @param mean the mean of the gaussian distribution
     * @param std the std of the gaussian distribution
     */
    public nextGaussian(mean: number, std: number): number {
        let x, y, s;
        do {
            x = Math.random() * 2 - 1;
            y = Math.random() * 2 - 1;
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
        return Math.round(this.nextGaussian(mean, std))
    }

    /**
     * Sets a seed for the Scratch-VM to enable reproduction of scratch project execution.
     */
    public static seedScratch(): void {
        seed(Randomness._initialSeed, {global: true});
    }

}
