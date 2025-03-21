export type EmptyObject = Record<string, never>;

// Based on this StackOverflow: https://stackoverflow.com/a/60142095
export type Entry<T> = {
    [K in keyof T]: [K, T[K]]
}[keyof T];

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
