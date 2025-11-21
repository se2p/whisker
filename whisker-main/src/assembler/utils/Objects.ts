export type EmptyObject = Record<string, never>;

// Based on this StackOverflow: https://stackoverflow.com/a/60142095
export type Entry<T> = {
    [K in keyof T]: [K, T[K]]
}[keyof T];

/**
 * Creates a deep copy of the given object. Note: the copy is only lossless if the object is plain JSON data.
 *
 * @param object the object to copy
 * @param replacer an optional replacer function passed to JSON.stringify
 */
export function deepCopy<T>(object: T, replacer = null): T {
    return JSON.parse(JSON.stringify(object, replacer)) as T;
}

export function empty<T>(): Record<string, T> {
    return Object.create(null);
}

/**
 * Like `Object.freeze` but also freezes nested objects in `o` recursively.
 *
 * @param o the object to deep-freeze
 * @return the object that was passed to the function
 */
// Credit goes to https://stackoverflow.com/a/34776962
export function deepFreeze<T>(o: T): T {
    Object.freeze(o);
    if (o === undefined) {
        return o;
    }

    Object.getOwnPropertyNames(o).forEach(function (prop: string) {
        if (o[prop] !== null
            && (typeof o[prop] === "object" || typeof o[prop] === "function")
            && !Object.isFrozen(o[prop])) {
            deepFreeze(o[prop]);
        }
    });

    return o;
}

/**
 * Similar to `Array.prototype.map` but for objects in general.
 *
 * @param o the object to map
 * @param f the mapping function
 */
export function mapObject<T, U>(
    o: Readonly<Record<string, T>>,
    f: (elem: T, key: string) => U
): Record<string, U> {
    const result = empty<U>();
    for (const [key, value] of Object.entries(o)) {
        result[key] = f(value, key);
    }
    return result;
}
