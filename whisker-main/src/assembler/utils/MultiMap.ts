// A MultiMap implementation for JavaScript inspired by Google Guava's MultiMap
// https://guava.dev/releases/23.0/api/docs/com/google/common/collect/Multimap.html

import {Pair} from "../../whisker/utils/Pair";

export class MultiMap<K, V> implements Iterable<Pair<K, V>> {
    private readonly _map: Map<K, Set<V>>;

    constructor(entries?: Iterable<Pair<K, V>>) {
        this._map = new Map();

        if (entries) {
            for (const [key, value] of entries) {
                this.set(key, value);
            }
        }
    }

    get(key: K): Set<V> {
        return new Set(this._map.get(key));
    }

    has(key: K, value?: V): boolean {
        const hasKey = this._map.has(key);

        if (!value) {
            return hasKey;
        }

        return hasKey && this._map.get(key).has(value);
    }

    set(key: K, value: V): this {
        if (this._map.has(key)) {
            this._map.get(key).add(value);
        } else {
            this._map.set(key, new Set([value]));
        }

        return this;
    }

    setAll(key: K, values: Iterable<V>): this {
        for (const value of values) {
            this.set(key, value);
        }

        return this;
    }

    get size(): number {
        return [...this._map.values()].reduce((size, set) => size + set.size, 0);
    }

    [Symbol.iterator](): IterableIterator<Pair<K, V>> {
        return (function* () {
            for (const key of this._map.keys()) {
                for (const value of this._map.get(key)) {
                    yield [key, value];
                }
            }
        }).bind(this)();
    }

    clear(): void {
        this._map.clear();
    }

    delete(key: K, value?: V): boolean {
        if (!value) {
            return this._map.delete(key);
        }

        const wasPresent = this._map.has(key) && this._map.get(key).delete(value);

        if (wasPresent && this._map.get(key).size === 0) {
            this._map.delete(key);
        }

        return wasPresent;
    }

    entries(): IterableIterator<Pair<K, V>> {
        return this[Symbol.iterator]();
    }

    forEach(action: (key: K, value: V) => void): void {
        for (const [key, value] of this) {
            action(key, value);
        }
    }

    keys(): IterableIterator<K> {
        return this._map.keys();
    }

    values(): IterableIterator<V> {
        return (function* () {
            for (const values of this._map.values()) {
                for (const value of values) {
                    yield value;
                }
            }
        }).bind(this)();
    }
}
