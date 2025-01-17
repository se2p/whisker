/**
 * Constructs a type with the properties of `T`, but with the given keys `K` being optional.
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
