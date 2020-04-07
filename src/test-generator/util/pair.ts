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
    private first: T;

    /**
     * The second element of the pair.
     */
    private second: T;

    /**
     * Creates a new pair from the specified elements.
     * @param first element one
     * @param second element two
     */
    constructor(first: T, second: T) {
        this.first = first;
        this.second = second;
    }

    /**
     * Returns the first element of this pair.
     * @returns the first element
     */
    getFirst(): T {
        return this.first;
    }

    /**
     * Returns the first element of this pair.
     * @returns the second element
     */
    getSecond(): T {
        return this.second;
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
