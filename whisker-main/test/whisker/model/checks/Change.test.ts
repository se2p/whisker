import {fc, it} from "@fast-check/jest";
import {
    ChangeOp,
    changeOps,
    ChangingCheck,
    newChange,
    newQuantifiedChange,
    NumberOrChangeOp
} from "../../../../src/whisker/model/checks/Change";
import Arrays from "../../../../src/whisker/utils/Arrays";
import {Pair} from "../../../../src/whisker/utils/Pair";

// Generators for 1-tuples, 2-tuples, and 3-tuples of numbers.
const number = fc.double({noNaN: true});
const n2 = fc.tuple(number, number);
const n3 = fc.tuple(number, number, number);

// Generators for pairs [x, y] of numbers where x === y, x !== y, x > y, etc.
const eq = number.map((x) => [x, x] as [number, number]);
const ne = n2.filter(([x, y]) => x !== y);
const gt = n2.filter(([x, y]) => x > y);
const lt = n2.filter(([x, y]) => x < y);
const ge = n2.filter(([x, y]) => x >= y);
const le = n2.filter(([x, y]) => x <= y);

// Generators for numbers x where x === 0, x !== 0, x >= 0, etc.
const eqz = fc.constant(0);
const nez = number.filter((n) => n !== 0);
const gez = fc.double({noNaN: true, min: 0});
const gtz = gez.filter((n) => n !== 0);
const lez = fc.double({noNaN: true, max: 0});
const ltz = lez.filter((n) => n !== 0);

// Generates a number or one of the 6 operators, each with probability 1/7.
const numOp = fc.oneof(number, ...changeOps.map((op) => fc.constant(op)));

describe("A change", () => {
    const change = fc.tuple(numOp, fc.boolean()).map(([change, negated]) => newChange({change, negated}));

    it.prop([change])("never contradicts itself", (c) => {
        expect(c.contradicts(c)).toBe(false);
    });

    it.prop([change])("always contradicts its negation", (c) => {
        expect(c.contradicts(c.negate())).toBe(true);
    });

    it.prop([numOp, number, number])(
        "returns the same result regardless if negated immediately or retroactively", (change, x, y) => {
            const c = newChange({change, negated: true}); // immediate negation
            const d = newChange({change}).negate(); // retroactive negation
            expect(c.apply(x, y)).toBe(d.apply(x, y));
        });

    it.prop([change, change])("has a symmetric contradicts() method", (c1, c2) => {
        expect(c1.contradicts(c2)).toBe(c2.contradicts(c1));
    });

    it.prop([change, number, number])("is idempotent regarding double negation", (change, x, y) => {
        const expected = change.apply(x, y);
        expect(change.negate().negate().apply(x, y)).toBe(expected);
    });

    describe("by a number", () => {
        it.prop([ne])("always contradicts a change by a different number", ([x, y]) => {
            const c1 = newChange({change: x});
            const c2 = newChange({change: y});
            expect(c1.contradicts(c2)).toBe(true);
        });

        it.prop([ne])("does not contradict a negated change by a different number", ([x, y]) => {
            const c1 = newChange({change: x});
            const c2 = newChange({change: y}).negate();
            expect(c1.contradicts(c2)).toBe(false);
        });

        it.prop([ne])("does not contradict a change by a different number if both are negated", ([x, y]) => {
            const c1 = newChange({change: x}).negate();
            const c2 = newChange({change: y}).negate();
            expect(c1.contradicts(c2)).toBe(false);
        });

        // Note: It seems we cannot reliably detect if a very small number (b = -4.450147717014403e-308) changed by a
        // very small amount (c = -5e-324). The filter below avoids test outcomes with false negatives caused by the
        // quirks of floating-point arithmetics.
        it.prop([n2.map(([c, b]) => [c, b, b + c]).filter(([c, b, a]) => a - b === c)])(
            "returns true for the correct delta", ([change, before, after]) => {
                const c = newChange({change});
                expect(c.apply(after, before)).toBe(true);
            });

        it.prop([n3.filter(([c, b, a]) => a - b !== c)])(
            "returns false for incorrect deltas", ([change, before, after]) => {
                const c = newChange({change});
                expect(c.apply(after, before)).toBe(false);
            });

        it.prop([fc.oneof(eq, ne)])("has a symmetric apply() method if the delta is 0", ([before, after]) => {
            const c = newChange({change: 0});
            expect(c.apply(before, after)).toBe(c.apply(after, before));
        });
    });

    describe.each([
        ["a positive number", gtz, ["=", "-", "-="], "+"],
        ["a negative number", ltz, ["=", "+", "+="], "-"],
        ["zero", eqz, ["+", "-", "!="], "="],
    ])('by %s', (_, n, contraOps, compatOp: ChangeOp) => {
        describe.each(contraOps)('contradicts', (op: ChangeOp) => {
            it.prop([n])(`the "${op}" change`, (n) => {
                const c1 = newChange({change: n});
                const c2 = newChange({change: op});
                expect(c1.contradicts(c2)).toBe(true);
            });
        });

        it.prop([n])(`does not contradict the "${compatOp}" change`, (n) => {
            const c1 = newChange({change: n});
            const c2 = newChange({change: compatOp});
            expect(c1.contradicts(c2)).toBe(false);
        });
    });

    describe.each([
        ["+", ["=", "-", "-="], gt, le, gtz, lez],
        ["-", ["=", "+", "+="], lt, ge, ltz, gez],
        ["=", ["+", "-", "!="], eq, ne, eqz, nez],
        ["+=", ["-"], ge, lt, gez, ltz],
        ["-=", ["+"], le, gt, lez, gtz],
        ["!=", ["="], ne, eq, nez, eqz],
    ])('given by "%s"', (op: ChangeOp, contraOps: ChangeOp[], passing, failing, compat, contra) => {
        it.each(contraOps)('contradicts the "%s" change', (op2) => {
            const c1 = newChange({change: op});
            const c2 = newChange({change: op2});
            expect(c1.contradicts(c2)).toBe(true);
        });

        it.each(contraOps)('when negated does not contradict the "%s" change', (op2) => {
            const c1 = newChange({change: op, negated: true});
            const c2 = newChange({change: op2});
            expect(c1.contradicts(c2)).toBe(false);
        });

        it.each(contraOps)('does not contradict the negated "%s" change', (op2) => {
            const c1 = newChange({change: op});
            const c2 = newChange({change: op2, negated: true});
            expect(c1.contradicts(c2)).toBe(false);
        });

        const compatibleOps = changeOps.filter((op) => !contraOps.includes(op));
        it.each(compatibleOps)('does not contradict the "%s" change', (op2) => {
            const c1 = newChange({change: op});
            const c2 = newChange({change: op2});
            expect(c1.contradicts(c2)).toBe(false);
        });

        it.prop([contra])("it contradicts changes with incompatible deltas", (change) => {
            const c1 = newChange({change: op});
            const c2 = newChange({change});
            expect(c1.contradicts(c2)).toBe(true);
        });

        it.prop([compat])("it does not contradicts changes with compatible deltas", (change) => {
            const c1 = newChange({change: op});
            const c2 = newChange({change});
            expect(c1.contradicts(c2)).toBe(false);
        });

        it.prop([passing])("is true for the correct delta", ([x, y]) => {
            const change = newChange({change: op});
            expect(change.apply(x, y)).toBe(true);
        });

        it.prop([failing])("is false for incorrect deltas", ([x, y]) => {
            const change = newChange({change: op});
            expect(change.apply(x, y)).toBe(false);
        });

        if (op === "=" || op === "!=") {
            it.prop([fc.oneof(eq, ne)])("has a symmetric apply() method", ([x, y]) => {
                const change = newChange({change: op});
                expect(change.apply(x, y)).toBe(change.apply(y, x));
            });
        }
    });
});

function shuffle(a) {
    a = [...a];
    Arrays.shuffle(a);
    return a;
}

function changingCheck(negated: boolean | null = null): fc.Arbitrary<ChangingCheck> {
    return fc.record({
        change: numOp,
        negated: negated === null ? fc.boolean() : fc.constantFrom(negated),
    });
}

const quantified = changingCheck().map((json) => [newQuantifiedChange(json), newChange(json)] as const);
const existential = changingCheck(false).map((json) => [newQuantifiedChange(json), newChange(json)] as const);
const universal = changingCheck(true).map((json) => [newQuantifiedChange(json), newChange(json)] as const);

describe("A quantified change", () => {
    it.prop([universal, number, number])("has the same result as the underlying change for singleton arrays",
        ([q, c], x, y) => {
            expect(q.apply([[x, y]])).toBe(c.apply(x, y));
        });

    it.prop([quantified, fc.array(n2, {minLength: 2}).map((a) => [a, shuffle(a)])])(
        "has the same result regardless of the order of elements", ([q], [a1, a2]) => {
            expect(q.apply(a1)).toBe(q.apply(a2));
        });

    it.prop([quantified])("never contradicts itself", ([q]) => {
        expect(q.contradicts(q)).toBe(false);
    });

    it.prop([changingCheck()])("always contradicts its negation", (json) => {
        const q = newQuantifiedChange(json);
        const p = newQuantifiedChange({...json, negated: !json.negated});
        expect(q.contradicts(p)).toBe(true);
    });

    it.prop([quantified, quantified])("has a symmetric contradicts() method", ([q1], [q2]) => {
        expect(q1.contradicts(q2)).toBe(q2.contradicts(q1));
    });
});

describe("An existentially quantified change", () => {
    it.prop([existential])("is always false for empty arrays", ([q]) => {
        expect(q.apply([])).toBe(false);
    });

    it.each([...changeOps, -1, 0, 1])('is true if at least one element satisfies the change ("%s")',
        (change: NumberOrChangeOp) => {
            const array: Pair<number>[] = [[1, 1], [2, 1], [1, 2]];
            const q = newQuantifiedChange({change, negated: false});
            expect(q.apply(array)).toBe(true);
        });

    it.each([
        ["+", [[1, 2], [0, 0]]],
        ["-", [[1, 1], [2, 1]]],
        ["+=", [[1, 2], [0, 1]]],
        ["-=", [[2, 1], [1, 0]]],
        ["=", [[4, 3], [1, 2]]],
        ["!=", [[1, 1], [0, 0]]],
        [5, [[1, 2], [4, 0]]],
        [0, [[1, 2], [3, 4]]],
        [-2, [[3, 2], [0, 3]]],
    ] as [NumberOrChangeOp, [number, number][]][])(
        'is false if no element satisfies the change ("%s")', (change, array) => {
            const q = newQuantifiedChange({change, negated: false});
            expect(q.apply(array)).toBe(false);
        });

    it.prop([existential, existential])("never contradicts other existential changes", ([q1], [q2]) => {
        expect(q1.contradicts(q2)).toBe(false);
    });

    it.prop([existential, universal])(
        "contradicts a universally quantified change if the underlying changes contradict",
        ([q1, c1], [q2, c2]) => {
            expect(q1.contradicts(q2)).toBe(c1.contradicts(c2));
        });
});

describe("A universally quantified change", () => {
    it.prop([universal])("is always true for empty arrays", ([q]) => {
        expect(q.apply([])).toBe(true);
    });

    it.each([
        ["-=", [[2, 1], [1, 0]]],
        ["+=", [[0, 1], [1, 2]]],
        ["-", [[2, 1], [0, 0]]],
        ["+", [[1, 1], [-1, 0]]],
        ["!=", [[4, 4], [1, 1]]],
        ["=", [[2, 1], [1, 0]]],
        [0, [[7, 2], [5, 0]]],
        [1, [[1, 1], [4, 4]]],
        [-3, [[0, 2], [1, 3]]],
    ] as [NumberOrChangeOp, [number, number][]][])(
        'is true if all elements satisfy the change ("%s")', (change, array) => {
            const q = newQuantifiedChange({change, negated: true});
            expect(q.apply(array)).toBe(true);
        });

    it.each([...changeOps, -1, 0, 1])(
        'is false if at least one element does not satisfy the change ("%s")', (change: NumberOrChangeOp) => {
            const array: Pair<number>[] = [[1, 1], [2, 1], [1, 2]];
            const q = newQuantifiedChange({change, negated: true});
            expect(q.apply(array)).toBe(false);
        });

    it.prop([universal, quantified])(
        "contradicts another quantified change if the underlying changes contradict",
        ([q1, c1], [q2, c2]) => {
            expect(q1.contradicts(q2)).toBe(c1.contradicts(c2));
        });
});

const numberLike = fc.oneof(number, number.map((n) => `${n}`));
const notNumberLike = fc.string().filter((s) =>
    s.trim().length > 0 && Number.isNaN(Number(s)) && !changeOps.includes(s as ChangeOp));
const blank = fc.stringMatching(/^\s+$/);

describe("The schema validation for Change", () => {
    it.each(changeOps)('succeeds for the "%s" operator', (op) => {
        expect(NumberOrChangeOp.parse(op)).toBe(op);
    });

    it.each([
        ["++", "+"],
        ["--", "-"],
        ["==", "="],
    ])('converts "%s" to "%s"', (op1, op2) => {
        expect(NumberOrChangeOp.parse(op1)).toBe(op2);
    });

    it.prop([numberLike])("succeeds for numbers and number-like strings", (n) => {
        expect(NumberOrChangeOp.parse(n)).toBe(Number(n));
    });

    it("fails for the empty string", () => {
        expect(() => NumberOrChangeOp.parse("")).toThrow();
    });

    it.prop([blank])("fails for blank strings", (s) => {
        expect(() => NumberOrChangeOp.parse(s)).toThrow();
    });

    it.prop([notNumberLike])("fails for strings that are not number-like", (s) => {
        expect(() => NumberOrChangeOp.parse(s)).toThrow();
    });
});
