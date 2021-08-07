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

import {Randomness} from "./Randomness";
import isEqual from 'lodash.isequal';

/**
 * A class to store a list of elements of the same type.
 *
 * @param <T> The type of the list elements
 * @author Sophia Geserer
 */
export class List<T> implements Iterable<T> {

    /**
     * The list of the elements.
     */
    private _items: T[];

    /**
     * Creates an empty list.
     */
    constructor(items = []) {
        this._items = items;
    }

    /**
     * Returns the number of elements in this list.
     * @returns the number of elements in this list
     */
    size(): number {
        return this._items.length;
    }

    /**
     * Returns {@code true} if this list contains no elements.
     * @returns {@code true} if this list contains no elements
     */
    isEmpty(): boolean {
        return this.size() === 0;
    }

    /**
     * Appends the specified element to the end of this list.
     * @param element element to be added to the list
     */
    add(element: T): void {
        this._items.push(element);
    }

    /**
     * Inserts the specified element at the specified position/
     * @param element element to be added to the list
     * @param position position where to insert the element
     */
    insert(element: T, position: number): void {
        this._items.splice(position, 0, element);
    }

    /**
     * Replaces the oldElement with the newElement.
     * @param oldElement the element to replace.
     * @param newElement the element, oldElement gets replaced with.
     * @return Returns true if the operation was successful and false otherwise.
     */
    replace(oldElement: T, newElement: T): boolean {
        const index = this._items.findIndex(element => element === oldElement);
        if (index === -1)
            return false;
        this.replaceAt(newElement, index);
        return true;
    }

    /**
     * Replaces the element at the given position with the specified element.
     * @param newElement the new element to replaceAt the old element with.
     * @param position the position at which the old element should be replaced with the new element.
     * @return Returns true if the operation was successful and false otherwise.
     */
    replaceAt(newElement: T, position: number): boolean {
        if (position < 0 || position > this.size() - 1) {
            return false;
        }
        this._items[position] = newElement;
        return true;
    }

    /**
     * Appends the specified element to the end of this list.
     * @param elements element to be added to the list
     */
    addAll(elements: T[]): void {
        this._items = this._items.concat(elements) // TODO: Nicer way to do this?
    }

    /**
     * Appends the specified element to the end of this list.
     * @param other element to be added to the list
     */
    addList(other: List<T>): void {
        this._items = this._items.concat(other._items) // TODO: Nicer way to do this?
    }

    /**
     * Creates a List containing elements of the given range with the specified step size.
     * @param start starting value inclusive
     * @param stop stopping value exclusive
     * @param step stepSize
     * @returns List<number> containing elements from start to stop with specified step size.
     */
    static range(start: number, stop: number, step = 1): List<number> {
        const items = Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step);
        return new List(items);
    }

    /**
     * Returns the element at the specified position in this list.
     * @param index index of the element to return
     * @returns the element at the specified position in the list
     */
    get(index: number): T {
        return this._items[index];
    }

    /**
     * Returns all elements the list currently holds.
     * @return all elements in an array
     */
    getElements(): T[] {
        return this._items;
    }

    /**
     * Filters the elements of a List given a predicate function
     * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the list.
     */
    filter(predicate: (value: T, index: number, array: T[]) => boolean): List<T> {
        return new List<T>(this._items.filter(predicate));
    }

    /**
     * Returns the index of the first element in the array where predicate is true, and -1 otherwise.
     * @param predicate the predicate is called for each element in the list until an element return true is found.
     * @return number representing the index of the element passing the predicate function,
     * or -1 if no element passing the predicate function was found.
     */
    findIndex(predicate: (value: T, index: number, obj: T[]) => unknown): number {
        return this._items.findIndex(predicate);
    }

    /**
     * Returns the index of the first element int the list which is equal (===) to the given targetElement.
     * @param targetElement the element which should be found in the list
     * @return number representing the index of the found element, or -1 if the searched element wasn't found.
     */
    findElement(targetElement: T): number {
        return this.findIndex(element => element === targetElement);
    }

    /**
     * Remove all elements in the list
     */
    clear(): void {
        this._items = [];
    }

    /**
     * Create a (shallow) copy
     */
    clone(): List<T> {
        const copiedItems = [...this._items];
        return new List<T>(copiedItems);
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this._items[Symbol.iterator]();
    }

    /**
     * Removes the specified element from the list.
     *
     * @param element The element to be removed from the list.
     */
    remove(element: T): void {
        const index = this._items.indexOf(element, 0);
        if (index > -1) {
            this._items.splice(index, 1);
        }
    }

    /**
     * Removes the element at the given position from the list.
     *
     * @param position the position of the element to remove
     */
    removeAt(position: number): void {
        this._items.splice(position, 1);
    }

    /**
     * Determines if the list contains the specified element.
     *
     * @param element The element to search for.
     * @returns {@code true} if the list contains the element.
     */
    contains(element: T): boolean {
        return this._items.includes(element);
    }

    /**
     * Creates a subList of the specified range.
     *
     * @param from The low endpoint (inclusive) of the subList.
     * @param to The high endpoint (exclusive) of the subList.
     * @returns a subList of the specified range within this list.
     */
    subList(from: number, to: number): List<T> {
        return new List<T>(this._items.slice(from, to));
    }

    /**
     * Returns a list consisting of the distinct elements of this list.
     *
     * @returns a list consisting of the distinct elements.
     */
    distinct(): List<T> {
        const distinctItems = this._items.filter((o, i, arr) =>
            arr.findIndex(t => t === o) === i);
        return new List<T>(distinctItems);
    }

    /**
     * Returns a list consisting of the distinct elements of this list using object comparison
     *
     * @returns a list consisting of the distinct elements.
     */
    distinctObjects(): List<T> {
        const distinctItems = this._items.filter((o, i, arr) =>
            arr.findIndex(t => isEqual(t, o)) === i);
        return new List<T>(distinctItems);
    }

    /**
     * Randomly permutes this list using a default source of randomness.
     */
    shuffle(): void {
        let currentIndex = this._items.length;
        let temporaryValue;
        let randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Randomness.getInstance().nextInt(0, currentIndex);
            currentIndex -= 1;
            temporaryValue = this._items[currentIndex];
            this._items[currentIndex] = this._items[randomIndex];
            this._items[randomIndex] = temporaryValue;
        }
    }

    /**
     * Sorts this list according to the order induced by the specified comparator.
     *
     * @param comparator The comparator used to compare list elements.
     */
    sort(comparator: (a: T, b: T) => number): void {
        this._items.sort(comparator)
    }

    /**
     * Reverses the order of the list.
     */
    reverse(): void {
        this._items.reverse();
    }

    /**
     * Applies the given function to each member of the list
     * @param callbackfn the function that should be applied to each member of the list
     */
    map<U>(callbackfn: (value: T, index: number, array: T[]) => U): List<U> {
        return new List<U>(this._items.map(callbackfn));
    }

    /**
     * Returns the list in the following string format: "element1, element2, ..."
     */
    public toString = (): string => {
        return this._items.toString();
    }
}
