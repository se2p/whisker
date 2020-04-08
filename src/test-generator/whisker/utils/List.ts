/**
 * A class to store a list of elements of the same type.
 * 
 * @param <T> The type of the list elements
 * @author Sophia Geserer
 */
export class List<T> {

    /**
     * The list of the elements.
     */
    private _items: T[];

    /**
     * Creates an empty list.
     */
    constructor() {
        this._items = [];
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
     * Returns the element at the specified position in this list.
     * @param index index of the element to return
     * @returns the element at the specified position in the list
     */
    get(index: number): T {
        return this._items[index];
    }
}
