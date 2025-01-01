import {fc, it} from "@fast-check/jest";
import {Existential, Universal} from "../../../../src/whisker/model/checks/Quantification";

/**
 * Randomly generated 1-dimensional array of arbitrary length, containing arbitrary elements.
 */
const arr = fc.array(fc.anything());

/**
 * A randomly generated 2-dimensional array of length >= 1. All inner arrays are randomly generated, too. They all have
 * the same length (between 1 and 10), and contain random numbers.
 */
const arr2 = fc.integer({min: 1, max: 10}) // Choose length of the inner arrays.
    .chain((length) => fc.array( // Outer array.
        fc.array(fc.double(), {minLength: length, maxLength: length}), // All inner arrays have the same length.
        {minLength: 1}) // Outer array has at least one element.
    );

/**
 * A pair of (1) a randomly generated 2-dimensional array, and (2) a random permutation thereof (the order of the inner
 * arrays is shuffled, but not the elements of the inner arrays.)
 */
const perm2 = arr2.chain((a) => fc.tuple(
    fc.constant(a), // (1)
    fc.shuffledSubarray(a, {minLength: a.length}) // (2)
));

/**
 * A pair of (1) a randomly generated 2-dimensional array, and (2) a random subset (length >= 1) of its indexes.
 */
const arr2idx = arr2.chain((a) => fc.tuple(
    fc.constant(a), // (1)
    fc.shuffledSubarray([...a.keys()], {minLength: 1})) // (2)
);

/**
 * Factory function for Quantifiable mocks.
 * @param apply Optional mock implementation for `apply()`.
 * @param contradicts Optional mock implementation for `contradicts()`.
 */
function newQuantifiable({apply = null, contradicts = null} = {}) {
    const mock = {
        apply: jest.fn(),
        contradicts: jest.fn(),
    };

    if (apply !== null) {
        mock.apply.mockImplementation(apply);
    }

    if (contradicts !== null) {
        mock.contradicts.mockImplementation(contradicts);
    }

    return mock;
}

/*
 * Generators for random predicates, existential quantifiers, and universal quantifiers.
 */
const pred = fc.func(fc.boolean());
const exist = fc.tuple(pred, pred).map(([apply, contradicts]) => new Existential(newQuantifiable({apply, contradicts})));
const univ = fc.tuple(pred, pred).map(([apply, contradicts]) => new Universal(newQuantifiable({apply, contradicts})));
const quant = fc.oneof(exist, univ);

describe("META: The arr2 generator", () => {
    it.prop([arr2])("creates arrays of at least length 1", (arr) => {
        expect(arr.length).toBeGreaterThanOrEqual(1);
    });

    it.prop([arr2])("contains nested arrays, each of the same length", (arr) => {
        expect(arr.every((a) => a.length === arr[0].length)).toBe(true);
    });

    it.prop([arr2])("contains nested arrays of at least length 1", (arr) => {
        expect(arr.every((a) => a.length > 0)).toBe(true);
    });
});

describe("Quantification", () => {
    test.each([Existential, Universal])("wrapped() returns the wrapped object (for %p)", (Q) => {
        const w = newQuantifiable();
        const q = new Q(w);
        expect(q.wrapped).toBe(w);
    });

    describe("applySingle()", () => {
        it.prop([quant, arr])("calls the wrapped predicate, forwarding the arguments", (q, a) => {
            q.applySingle(...a);
            expect(q.wrapped.apply).toHaveBeenCalledWith(...a);
        });

        it.prop([quant, arr])("has the same result as the wrapped predicate", (q, a) => {
            const expected = q.wrapped.apply(...a);
            const actual = q.applySingle(...a);
            expect(actual).toBe(expected);
        });
    });

    describe("apply()", () => {
        it.prop([quant, arr])("has the same result as the wrapped predicate for singleton arrays", (q, a) => {
            expect(q.apply([a])).toBe(q.wrapped.apply(...a));
        });

        it.prop([quant, arr2])("calls the underlying predicate at least once", (q, a) => {
            q.apply(a);
            expect(q.wrapped.apply).toHaveBeenCalled();
        });

        it.prop([quant, arr2])("forwards the arguments to the underlying predicate", (q, a) => {
            q.apply(a);
            for (let i = 0; i < q.wrapped.apply.mock.calls.length; i++) {
                expect(q.wrapped.apply).toHaveBeenNthCalledWith(i + 1, ...a[i]);
            }
        });

        it.prop([quant, perm2])("has the same result regardless of the order of elements", (q, [a1, a2]) => {
            expect(q.apply(a1)).toBe(q.apply(a2));
        });
    });
});

describe("Existential", () => {
    describe("apply()", () => {
        it.prop([exist])("is always false for empty arrays", (e) => {
            expect(e.apply([])).toBe(false);
        });

        it.prop([arr2idx])("is true if at least one element satisfies the predicate", ([a, i]) => {
            const w = newQuantifiable();
            // The indexes determine which apply() calls return true.
            w.apply.mockImplementation(() => i.includes(w.apply.mock.calls.length - 1));
            const e = new Existential(w);
            expect(e.apply(a)).toBe(true);
        });

        it.prop([arr2])("is false if no element satisfies the predicate", (a) => {
            const e = new Existential(newQuantifiable({apply: () => false}));
            expect(e.apply(a)).toBe(false);
        });
    });

    describe("contradicts()", () => {
        it.prop([exist, exist])("is always false given an Existential", (e1, e2) => {
            expect(e1.contradicts(e2)).toBe(false);
        });

        it.prop([exist, univ])("depends on the contradiction of wrapped predicates for a Universal", (e, u) => {
            expect(e.contradicts(u)).toBe(e.wrapped.contradicts(u.wrapped));
        });
    });
});

describe("Universal", () => {
    describe("apply()", () => {
        it.prop([univ])("is always true for empty arrays", (u) => {
            expect(u.apply([])).toBe(true);
        });

        it.prop([arr2])("is true if all elements satisfy the condition", (a) => {
            const u = new Universal(newQuantifiable({apply: () => true}));
            expect(u.apply(a)).toBe(true);
        });

        it.prop([arr2idx])("is false if at least one element does not satisfy the condition", ([a, i]) => {
            const w = newQuantifiable();
            // The indexes determine which apply() calls return false.
            w.apply.mockImplementation(() => !i.includes(w.apply.mock.calls.length - 1));
            const u = new Universal(w);
            expect(u.apply(a)).toBe(false);
        });
    });

    it.prop([univ, quant])(
        "contradicts another quantification if the underlying predicates contradict", (u, q) => {
            expect(u.contradicts(q)).toBe(u.wrapped.contradicts(q.wrapped));
        });
});
