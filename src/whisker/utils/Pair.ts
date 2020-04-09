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
 * along with Whisker.
 * If not, see http://www.gnu.org/licenses/.
 * 
 */

/**
 * An immutable container class to store two elements of the same type.
 * 
 * @param <T> The type of the elements in the pair
 * @author Sophia Geserer
 */
export class Pair<T> {

    /**
     * The first element of the pair.
     */
    private _first: T;

    /**
     * The second element of the pair.
     */
    private _second: T;

    /**
     * Creates a new pair from the specified elements.
     * @param first element one
     * @param second element two
     */
    constructor(first: T, second: T) {
        this._first = first;
        this._second = second;
    }

    /**
     * Returns the first element of this pair.
     * @returns the first element
     */
    getFirst(): T {
        return this._first;
    }

    /**
     * Returns the first element of this pair.
     * @returns the second element
     */
    getSecond(): T {
        return this._second;
    }

    /**
     * Static method that creates a new pair containing the specified elements.
     * @param first the first element
     * @param second the second element
     * @param <U> the type of the elements
     * @returns a pair containing ths specified elements.
     */
    static of<U>(first: U, second: U): Pair<U> {
        return null;
    }

}
