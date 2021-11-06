import isEqual from 'lodash.isequal';
import {Randomness} from "./Randomness";

export default class Arrays {

    /**
     * Returns a list consisting of the distinct elements of this list.
     *
     * @returns a list consisting of the distinct elements.
     */
    static distinct<T>(elements: Readonly<Iterable<T>>): T[] {
        const array = Array.isArray(elements) ? elements : [...elements];
        return array.filter((o, i, arr) => arr.findIndex(t => t === o) === i);
    }

    /**
     * Returns a list consisting of the distinct elements of this list using object comparison
     *
     * @returns a list consisting of the distinct elements.
     */
    static distinctObjects<T>(elements: Readonly<Iterable<T>>): T[] {
        const array = Array.isArray(elements) ? elements : [...elements];
        return array.filter((o, i, arr) => arr.findIndex(t => isEqual(t, o)) === i);
    }

    /**
     * Removes the specified element from the list.
     *
     * @param array
     * @param element The element to be removed from the list.
     */
    static remove<T>(array: T[], element: T): void {
        const index = array.indexOf(element, 0);
        if (index > -1) {
            array.splice(index, 1);
        }
    }

    /**
     * Remove all elements in the list
     */
    static clear<T>(array: T[]): void {
        array.length = 0;
    }

    /**
     * Create a (shallow) copy
     */
    static clone<T>(array: Readonly<T[]>): T[] {
        return [...array];
    }

    /**
     * Returns the index of the first element int the list which is equal (===) to the given targetElement.
     *
     * @param array
     * @param targetElement the element which should be found in the list
     * @return number representing the index of the found element, or -1 if the searched element wasn't found.
     */
    static findElement<T>(array: T[], targetElement: T): number {
        return array.findIndex(element => element === targetElement);
    }

    /**
     * Replaces the oldElement with the newElement.
     * @param array
     * @param oldElement the element to replace.
     * @param newElement the element, oldElement gets replaced with.
     * @return Returns true if the operation was successful and false otherwise.
     */
    static replace<T>(array: T[], oldElement: T, newElement: T): boolean {
        const index = array.findIndex(element => element === oldElement);
        if(index === -1)
            return false;
        this.replaceAt(array, newElement, index);
        return true;
    }

    /**
     * Replaces the element at the given position with the specified element.
     * @param array
     * @param newElement the new element to replaceAt the old element with.
     * @param position the position at which the old element should be replaced with the new element.
     * @return Returns true if the operation was successful and false otherwise.
     */
    static replaceAt<T>(array: T[], newElement: T, position: number): boolean {
        if(position < 0 || position > array.length - 1){
            return false;
        }
        array[position] = newElement;
        return true;
    }

    /**
     * Removes the element at the given position from the list.
     *
     * @param array
     * @param position the position of the element to remove
     */
    static removeAt<T>(array: T[], position: number): void {
        array.splice(position, 1);
    }

    /**
     * Inserts the specified element at the specified position.
     *
     * @param array
     * @param element element to be added to the list
     * @param position position where to insert the element
     */
    static insert<T>(array: T[], element: T, position: number): void {
        array.splice(position, 0, element);
    }

    /**
     * Returns {@code true} if this list contains no elements.
     * @returns {@code true} if this list contains no elements
     */
    static isEmpty<T>(array: T[]): boolean {
        return array.length === 0;
    }

    /**
     * Randomly permutes this list using a default source of randomness.
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

    static sort(array: number[]): void {
        array.sort((a, b) => a - b);
    }
}
