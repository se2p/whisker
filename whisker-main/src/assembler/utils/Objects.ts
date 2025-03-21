export type EmptyObject = Record<string, never>;

// Based on this StackOverflow: https://stackoverflow.com/a/60142095
export type Entry<T> = {
    [K in keyof T]: [K, T[K]]
}[keyof T];
