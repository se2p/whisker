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

/**
 * Seeded singleton random number generator
 *
 * Based on https://gist.github.com/lsenta/15d7f6fcfc2987176b54
 */
export class Randomness {

    private static instance: Randomness;

    private static initialSeed: number;

    private seed: number;

    /**
     * Private constructor to prevent construction with new
     *
     * @param seed -- seed to initialize with
     */
    private constructor() {
        if(Randomness.initialSeed) {
            this.seed = Randomness.initialSeed;
        } else {
            this.seed = Date.now();
        }
        console.log("Using random seed ",this.seed)
    }

    /**
     * Instance accessor
     */
    public static getInstance(): Randomness {
        if (!Randomness.instance) {
            Randomness.instance = new Randomness();
        }

        return Randomness.instance;
    }

    /**
     * Set the initial seed.
     * Does nothing if random number generator has already been initialized.
     *
     * @param seed the initial seed
     */
    public static setInitialSeed(seed:number) {
        Randomness.initialSeed = seed;
    }

    private next(min:number, max:number):number {
        max = max || 0;
        min = min || 0;

        this.seed = (this.seed * 9301 + 49297) % 233280;
        const rnd = this.seed / 233280;

        return min + rnd * (max - min);
    }

    /**
     * Pick a random integer from a range
     * @param min Lower bound of range
     * @param max Upper bound of range
     */
    public nextInt(min:number, max:number): number {
        return Math.floor(this.next(min, max));
    }

    /**
     * Pick a random floating point number between 0..1
     */
    public nextDouble(): number {
        return this.next(0, 1);
    }

    /**
     * Pick a random item from a collection
     *
     * @param collection from which to pick an item
     */
    public pick(collection:any[]): any {
        return collection[this.nextInt(0, collection.length)];
    }
}
