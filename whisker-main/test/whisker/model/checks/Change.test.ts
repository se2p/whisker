import {fc, it} from "@fast-check/jest";
import {
    ChangingCheck,
    newChange,
    newQuantifiedChange
} from "../../../../src/whisker/model/checks/Change";
import {Existential, Universal} from "../../../../src/whisker/model/checks/Quantification";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import {ChangeOp, changeOps, NumberOrChangeOp} from "../../../../src/whisker/model/checks/CheckTypes";

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
            expect(c.apply(x, y)).toStrictEqual(d.apply(x, y));
        });

    it.prop([change, change])("has a symmetric contradicts() method", (c1, c2) => {
        expect(c1.contradicts(c2)).toBe(c2.contradicts(c1));
    });

    it.prop([change, number, number])("is idempotent regarding double negation", (change, x, y) => {
        const expected = change.apply(x, y);
        expect(change.negate().negate().apply(x, y)).toStrictEqual(expected);
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
                expect(c.apply(after, before)).toStrictEqual(pass());
            });

        it.prop([n3.filter(([c, b, a]) => a - b !== c)])(
            "returns false for incorrect deltas", ([change, before, after]) => {
                const c = newChange({change});
                expect(c.apply(after, before)).toStrictEqual(fail(expect.any(Object)));
            });

        it.prop([fc.oneof(eq, ne)])("has a symmetric apply() method if the delta is 0", ([before, after]) => {
            const c = newChange({change: 0});
            expect(c.apply(before, after).passed).toStrictEqual(c.apply(after, before).passed);
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

        it.prop([compat])("it does not contradict changes with compatible deltas", (change) => {
            const c1 = newChange({change: op});
            const c2 = newChange({change});
            expect(c1.contradicts(c2)).toBe(false);
        });

        it.prop([passing])("is true for the correct delta", ([x, y]) => {
            const change = newChange({change: op});
            expect(change.apply(x, y)).toStrictEqual(pass());
        });

        it.prop([failing])("is false for incorrect deltas", ([x, y]) => {
            const change = newChange({change: op});
            expect(change.apply(x, y)).toStrictEqual(fail(expect.any(Object)));
        });

        if (op === "=" || op === "!=") {
            it.prop([fc.oneof(eq, ne)])("has a symmetric apply() method", ([x, y]) => {
                const change = newChange({change: op});
                expect(change.apply(x, y).passed).toStrictEqual(change.apply(y, x).passed);
            });
        }
    });
});

function changingCheck(negated: boolean): fc.Arbitrary<ChangingCheck> {
    return fc.record({
        change: numOp,
        negated: fc.constantFrom(negated),
    });
}

describe("newQuantifiedChange", () => {
    it.prop([changingCheck(false)])("returns an Existential when not negated", (c) => {
        const q = newQuantifiedChange(c);
        expect(q).toBeInstanceOf(Existential);
        expect(q.wrapped).toStrictEqual(newChange(c));
    });

    it.prop([changingCheck(true)])("returns a Universal when negated", (c) => {
        const q = newQuantifiedChange(c);
        expect(q).toBeInstanceOf(Universal);
        expect(q.wrapped).toStrictEqual(newChange({...c, negated: true}));
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
