import isEqual from 'lodash.isequal';
import {Randomness} from "./Randomness";

/**
 * Provides various utility methods for manipulating arrays.
 *
 * @author Sophia Geserer, Patric Feldmeier, Sebastian Schweikl
 */
export default class Arrays {

    /**
     * Adds all the elements of the second array to the first array. Modifies the first array in-place. Returns the
     * new length of the first array.
     *
     * @param dst the destination array to which the elements are added
     * @param src the source array from which the elements are taken
     * @return the new length of the destination array
     */
    static addAll<T>(dst: T[], src: Readonly<T[]>): number {
        return dst.push(...src)
    }

    /**
     * Returns a new array consisting only of the distinct elements of the given array. Equality semantics are those
     * of strict equality comparison (`===`). In particular, two objects `o` and `p` are equal if and only if `o` and
     * `p` are aliases, and not if they are structurally equivalent. Example:
     * ```
     * const o = { a: 1 };
     * const p = o;
     * const q = { a: 1 };
     * distinct([o, p, q]); // returns [o, q]
     * ```
     *
     * @returns T[] consisting of the distinct elements.
     */
    static distinct<T>(elements: Readonly<Iterable<T>>): T[] {
        const array = Array.isArray(elements) ? elements : [...elements];
        return array.filter((o, i, arr) => arr.findIndex(t => t === o) === i);
    }

    /**
     * Returns a new array consisting only of the distinct elements of the given array. Equality semantics are those
     * of strict equality comparison (`===`) for primitive types, and structural equality for object types. In
     * particular, two objects `o` and `p` are equal if and only if both have the same key-value pairs. Example:
     * ```
     * const o = { a: 1 };
     * const p = o;
     * const q = { a: 1 };
     * distinct([o, p, q]); // returns [o]
     * ```
     *
     * @returns T[] consisting of the distinct elements.
     */
    static distinctObjects<T>(elements: Readonly<Iterable<T>>): T[] {
        const array = Array.isArray(elements) ? elements : [...elements];
        return array.filter((o, i, arr) => arr.findIndex(t => isEqual(t, o)) === i);
    }

    /**
     * Removes the first occurrence of the specified element from the given array, using the equality semantics of
     * `===`. The array is modified in-place.
     *
     * @param array from which to remove an element
     * @param element the element to be removed
     */
    static remove<T>(array: T[], element: T): void {
        const index = array.indexOf(element, 0);
        if (index > -1) {
            array.splice(index, 1);
        }
    }

    /**
     * Removes all elements in the given array.
     *
     * @param array the array to clear
     */
    static clear<T>(array: T[]): void {
        array.length = 0;
    }

    /**
     * Creates a shallow copy of the given array.
     *
     * @param array to copy
     * @return copy of the array
     */
    static clone<T>(array: Readonly<T[]>): T[] {
        return [...array];
    }

    /**
     * Returns the index of the first element in the array which is equal (`===`) to the given target element.
     *
     * @param array to search
     * @param targetElement the element which should be found in the array
     * @return number representing the index of the found element, or -1 if the searched element wasn't found.
     */
    static findElement<T>(array: T[], targetElement: T): number {
        return array.findIndex(element => element === targetElement);
    }

    /**
     * Replaces the oldElement with the newElement.
     *
     * @param array in which to replace
     * @param oldElement the element to replace.
     * @param newElement the element, oldElement gets replaced with.
     * @return Returns true if the operation was successful and false otherwise.
     */
    static replace<T>(array: T[], oldElement: T, newElement: T): boolean {
        const index = array.findIndex(element => element === oldElement);
        if (index === -1)
            return false;
        this.replaceAt(array, newElement, index);
        return true;
    }

    /**
     * Replaces the element at the given position with the specified element.
     *
     * @param array
     * @param newElement the new element to replaceAt the old element with.
     * @param position the position at which the old element should be replaced with the new element.
     * @return Returns true if the operation was successful and false otherwise.
     */
    static replaceAt<T>(array: T[], newElement: T, position: number): boolean {
        if (position < 0 || position > array.length - 1) {
            return false;
        }
        array[position] = newElement;
        return true;
    }

    /**
     * Removes the element at the given position from the given array.
     *
     * @param array from which an element should be removed.
     * @param position the position of the element to remove
     */
    static removeAt<T>(array: T[], position: number): void {
        array.splice(position, 1);
    }

    /**
     * Inserts the specified element at the specified position.
     *
     * @param array to which an element should be added.
     * @param element element to be added to the given array.
     * @param position position where to insert the element
     */
    static insert<T>(array: T[], element: T, position: number): void {
        array.splice(position, 0, element);
    }

    /**
     * Returns {@code true} if the given array contains no elements.
     * @returns {@code true} if the given array contains no elements
     */
    static isEmpty<T>(array: T[]): boolean {
        return array.length === 0;
    }

    /**
     * Randomly permutes the given array using a default source of randomness.
     */
    static shuffle<T>(array: T[]): void {
        let currentIndex = array.length;
        let temporaryValue;
        let randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Randomness.getInstance().nextInt(0, currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
    }

    /**
     * Splits an existing array into equal sized sub-arrays. The size of the last chunk may be smaller than the
     * specified chunkSize iff array.length % chunkSize !== 0. In case chunkSize <= 0, we simply wrap an array
     * around the given array.
     * @param array the array that should be split into chunks.
     * @param chunkSize the size of the sub-arrays.
     * @returns T[][] a 2-dimensional array containing sub-arrays of size chunkSize created from the given array.
     */
    static chunk<T>(array: T[], chunkSize: number): T[][] {
        if (chunkSize <= 0) {
            return [array];
        }
        const chunkArray: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunkArray.push(array.slice(i, i + chunkSize));
        }
        return chunkArray;
    }

    static sort(array: number[]): void {
        array.sort((a, b) => a - b);
    }

    /**
     * Creates an Array containing elements within the given range with the specified step size.
     * @param start starting value inclusive.
     * @param stop stopping value exclusive.
     * @param step stepSize.
     * @returns Array<number> containing elements from start to stop with specified step size.
     */
    static range(start: number, stop: number, step = 1): number[] {
        return Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step);
    }

    /**
     * Create a random array of numbers in the range [minValue, maxValue] with a specified length.
     * @param minValue lower bound inclusive.
     * @param maxValue upper bound exclusive.
     * @param length size of created array.
     * @returns Array<number> with the specified value range and length.
     */
    static getRandomArray(minValue: number, maxValue: number, length: number): number[] {
        return Array.from({length: length},
            () => Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue);
    }
}
