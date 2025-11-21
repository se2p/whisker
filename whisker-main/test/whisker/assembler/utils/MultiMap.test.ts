import {MultiMap} from "../../../../src/assembler/utils/MultiMap";
import {expect} from "@jest/globals";

describe("Constructing a new map", () => {
    test("without arguments creates an empty map", () => {
        const map = new MultiMap();
        expect(map.size).toEqual(0);
        const entries = [...map.entries()];
        expect(entries).toStrictEqual([]);
    });

    test("with an empty iterable creates an empty map", () => {
        const map = new MultiMap([]);
        expect(map.size).toEqual(0);
        const entries = [...map.entries()];
        expect(entries).toStrictEqual([]);
    });

    test("with a non-empty iterable inserts all items", () => {
        const entries = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 5],
        ] as [number, number][];
        const map = new MultiMap(entries);
        expect(map.size).toEqual(entries.length);
        expect([...map.entries()]).toStrictEqual(entries);
    });

    test("with an iterable containing duplicates eliminates them", () => {
        const entry = [1, 2];
        const duplicates = [entry, entry, entry] as [number, number][];
        const map = new MultiMap(duplicates);
        expect(map.size).toEqual(1);
        expect([...map.entries()]).toEqual([entry]);
    });

    test("with a map itself acts as copy-constructor", () => {
        const map = new MultiMap([[1, 2], [3, 4], [1, 3], [1, 4], [4, 7]]);
        const copy = new MultiMap(map);
        expect(map).toStrictEqual(copy);
        expect(map).not.toBe(copy);
    });
});

describe("Getting", () => {
    test("a non-existent key returns empty set", () => {
        const empty = new MultiMap().get("nix");
        expect(empty).toStrictEqual(new Set());
    });

    test("an existing key returns the associated set", () => {
        const map = new MultiMap([[1, "one"], [1, "one"], [1, "eins"]]);
        const values = map.get(1);
        expect(values).toStrictEqual(new Set(["one", "eins"]));
    });

    test("the values of a key returns a defensive copy of the set", () => {
        const map = new MultiMap([[1, 2], [3, 4]]);
        const before = new MultiMap(map);

        const set = map.get(1);
        set.add(42);

        expect(map).toStrictEqual(before);
    });
});

describe("Checking a key for existence", () => {
    test("always returns false for the empty map", () => {
        const empty = new MultiMap();
        expect(empty.has("an arbitrary key")).toBeFalsy();
    });

    test("return false when the key is not present", () => {
        const map = new MultiMap([["key", "value"]]);
        expect(map.has("value")).toBeFalsy();
    });

    test("return true when the key is present", () => {
        const map = new MultiMap([["key", "value"]]);
        expect(map.has("key")).toBeTruthy();
    });
});

describe("Checking a key-value pair for existence", () => {
    test("always returns false for the empty map", () => {
        const empty = new MultiMap();
        expect(empty.has("an arbitrary key", "with a value")).toBeFalsy();
    });

    test("return false when the key is not present", () => {
        const map = new MultiMap([["key", "value"]]);
        expect(map.has("value", "key")).toBeFalsy();
    });

    test("return false when the value for the key is not present", () => {
        const map = new MultiMap([["key", "value"]]);
        expect(map.has("key", "key")).toBeFalsy();
    });

    test("return true when the key-value pair is present", () => {
        const map = new MultiMap([["key", "value"]]);
        expect(map.has("key", "value")).toBeTruthy();
    });
});

describe("Adding a key-value pair", () => {
    test("creates a new multi-mapping if it doesn't exist yet", () => {
        const map = new MultiMap();
        map.set("answer", 42);
        expect(map.get("answer")).toEqual(new Set([42]));
    });

    test("updates the multi-mapping if one already exists", () => {
        const map = new MultiMap([["answer", 42]]);
        map.set("answer", 23);
        expect(map.get("answer")).toEqual(new Set([42, 23]));
    });

    test("doesn't introduce duplicates", () => {
        const entry = [1, 2] as const;
        const map = new MultiMap([entry]);
        map.set(...entry);
        expect(map.size).toStrictEqual(1);
    });
});

describe("Adding multiple values for a single key", () => {
    test("doesn't change the map if the values are empty", () => {
        const entries = [[1, 2], [2, 4], [4, 8]] as const;
        const map = new MultiMap(entries);
        map.setAll(1, []);
        expect([...map.entries()]).toStrictEqual(entries);
    });

    test("creates a new mapping when the key doesn't exist yet", () => {
        const entries = [[1, 2], [1, 3], [1, 4]] as const;
        const map = new MultiMap();
        map.setAll(1, [2, 3, 4]);
        expect([...map.entries()]).toStrictEqual(entries);
    });

    test("updates the mapping if the key exists", () => {
        const map = new MultiMap([[1, 2], [1, 3]]);
        map.setAll(1, [4, 4, 5]);
        expect([...map.entries()]).toStrictEqual([[1, 2], [1, 3], [1, 4], [1, 5]]);
    });
});

describe("The size property", () => {
    test("is 0 for the empty map", () => {
        expect(new MultiMap().size).toStrictEqual(0);
    });

    test("tells the number of key-value mappings", () => {
        const mappings = [
            [1, 2],
            [3, 4],
            [1, 3],
            [1, 4],
            [4, 7],
        ] as const;
        const size = mappings.length;
        const map = new MultiMap(mappings);
        expect(map.size).toEqual(size);
    });
});

describe("The iterator", () => {
    test("is empty for the empty map", () => {
        const map = new MultiMap();
        expect([...map]).toStrictEqual([]);
    });

    test("returns all key-value pairs in the map", () => {
        const mappings = [
            [1, 2],
            [3, 4],
            [1, 3],
            [1, 4],
            [4, 7],
        ] as const;
        const map = new MultiMap(mappings);
        expect(new Set(map)).toStrictEqual(new Set(mappings));
    });
});

describe("Clearing", () => {
    test("the empty map is idempotent", () => {
        const map = new MultiMap();
        map.clear();
        expect(map).toStrictEqual(new MultiMap());
    });

    test("a non-empty map removes all entries", () => {
        const mappings = [
            [1, 2],
            [3, 4],
            [1, 3],
            [1, 4],
            [4, 7],
        ] as const;
        const map = new MultiMap(mappings);
        map.clear();
        expect(map).toStrictEqual(new MultiMap());
    });
});

describe("Deleting", () => {
    test("a key that doesn't exist doesn't change anything", () => {
        const map = new MultiMap<string | number, number>([[1, 2], [3, 4], [1, 3], [1, 4], [4, 7]]);
        const copy = new MultiMap(map);
        map.delete("this key does not exist");
        expect(map).toStrictEqual(copy);
    });

    test("a key that exists removes all values associated", () => {
        const map = new MultiMap();

        const even = [0, 2, 4, 6, 8];
        const odd = [1, 3, 5, 7, 9];

        map.setAll("even", even);
        map.setAll("prime", [2, 3, 5, 7, 11, 13, 17, 19]);
        map.setAll("odd", odd);

        const expected = new MultiMap();
        expected.setAll("even", even);
        expected.setAll("odd", odd);

        map.delete("prime");

        expect(map).toStrictEqual(expected);
    });

    test("a key-value pair that doesn't exist doesn't change anything", () => {
        const map = new MultiMap([[1, 2], [3, 4]]);
        const copy = new MultiMap(map);
        map.delete(3, 5);
        expect(map).toStrictEqual(copy);
    });

    test("a key-value pair that exists removes it", () => {
        const map = new MultiMap([[1, 2], [3, 4]]);
        const expected = new MultiMap([[1, 2]]);
        map.delete(3, 4);
        expect(map).toStrictEqual(expected);
    });

    test("the last value associated with a key also deletes the key", () => {
        const map = new MultiMap([[1, 2]]);
        map.delete(1, 2);
        expect(map.has(1)).toBeFalsy();
        expect([...map.keys()]).not.toContain(1);
    });
});

describe("The entries", () => {
    test("of the empty map are empty", () => {
        expect([...new MultiMap().entries()]).toStrictEqual([]);
    });

    test("of the non-empty map return all key-value pairs", () => {
        const entries = [[1, 2], [3, 4]] as const;
        const map = new MultiMap(entries);
        expect([...map.entries()]).toEqual(entries);
    });
});

describe("The forEach function", () => {
    test("executes the given action for each key-value pair in the map", () => {
        const map = new MultiMap([[1, 2], [3, 4], [1, 3], [1, 4], [4, 7]]);
        const empty = new MultiMap();
        map.forEach((key, value) => empty.set(key, value));
        expect(empty).toStrictEqual(map);
    });

    test("does not execute the callback when the map is empty", () => {
        const empty = new MultiMap();
        let executed = false;
        empty.forEach(() => {
            executed = true;
        });
        expect(executed).toBeFalsy();
    });
});

describe("The keys", () => {
    test("of the empty map are empty", () => {
        const empty = new MultiMap();
        expect([...empty.keys()]).toStrictEqual([]);
    });

    test("of the non-empty map are properly returned", () => {
        const keys = new Set([1, 2, 3, 4]);
        const map = new MultiMap();
        keys.forEach((key) => map.set(key, "value"));
        expect(new Set(map.keys())).toStrictEqual(keys);
    });

    test("do not contain duplicates", () => {
        const map = new MultiMap([[1, 2], [1, 3]]);
        expect([...map.keys()]).toStrictEqual([1]);
    });
});

describe("The values", () => {
    test("of the empty map are empty", () => {
        const map = new MultiMap();
        expect([...map.values()]).toStrictEqual([]);
    });

    test("of the non-empty map are taken from all key-value pairs", () => {
        const map = new MultiMap([[1, 2], [3, 4]]);
        expect([...map.values()]).toStrictEqual([2, 4]);
    });

    test("can contain duplicates across different keys", () => {
        const map = new MultiMap([[1, 2], [2, 2]]);
        expect([...map.values()]).toStrictEqual([2, 2]);
    });
});

test("Adding and deleting the same key-value pair reverts to the original state", () => {
    const map = new MultiMap();
    const original = new MultiMap(map);
    map.set(1, 2).delete(1, 2);
    expect(map).toStrictEqual(original);
});

