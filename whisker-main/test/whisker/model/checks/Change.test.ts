import {fc, it, test} from "@fast-check/jest";
import {newChange} from "../../../../src/whisker/model/checks/Change";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import {ChangeOp, changeOps, NumberOrChangeOp} from "../../../../src/whisker/model/checks/CheckTypes";
import {EPSILON} from "../../../../src/whisker/model/checks/Comparison";

// Generators for 1-tuples, 2-tuples, and 3-tuples of numbers.
const number = fc.double({noNaN: true}).filter(x => Math.abs(x) > EPSILON);
const n2 = fc.tuple(number, number);
const n3 = fc.tuple(number, number, number);

// Generators for pairs [x, y] of numbers where x === y, x !== y, x > y, etc.
const eq = number.map((x) => [x, x] as [number, number]);
const ne = n2.filter(([x, y]) => x !== y && Math.abs(x - y) > EPSILON);
const gt = n2.filter(([x, y]) => x > y);
const lt = n2.filter(([x, y]) => x < y);
const ge = n2.filter(([x, y]) => x >= y);
const le = n2.filter(([x, y]) => x <= y);

// Generators for numbers x where x === 0, x !== 0, x >= 0, etc.
const eqz = fc.constant(0);
const nez = number.filter((n) => n !== 0 && Math.abs(n) > EPSILON);
const gez = number.filter((n) => n === 0 || n > EPSILON);
const gtz = gez.filter((n) => n !== 0);
const lez = number.filter((n) => n === 0 || n < -EPSILON);
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

        it.prop([n3.filter(([c, b, a]) => Math.abs((a - b) - c) > EPSILON)])(
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
        ["a positive number", gtz, ["==", "-", "-="], "+"],
        ["a negative number", ltz, ["==", "+", "+="], "-"],
        ["zero", eqz, ["+", "-", "!="], "=="],
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
        ["+", ["==", "-", "-="], gt, le, gtz, lez],
        ["-", ["==", "+", "+="], lt, ge, ltz, gez],
        ["==", ["+", "-", "!="], eq, ne, eqz, nez],
        ["+=", ["-"], ge, lt, gez, ltz],
        ["-=", ["+"], le, gt, lez, gtz],
        ["!=", ["=="], ne, eq, nez, eqz],
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

        if (op === "==" || op === "!=") {
            it.prop([fc.oneof(eq, ne)])("has a symmetric apply() method", ([x, y]) => {
                const change = newChange({change: op});
                expect(change.apply(x, y).passed).toStrictEqual(change.apply(y, x).passed);
            });
        }
    });
});

const numberLike = fc.oneof(number, number.map((n) => `${n}`));
const notNumberLike = fc.string().filter((s) =>
    s.trim().length > 0 && Number.isNaN(Number(s)) && !changeOps.includes(s as ChangeOp) && s != "=");
const blank = fc.stringMatching(/^\s+$/);

describe("The schema validation for Change", () => {
    it.each(changeOps)('succeeds for the "%s" operator', (op) => {
        expect(NumberOrChangeOp.parse(op)).toBe(op);
    });

    test('converts "=" to "=="', () => {
        expect(NumberOrChangeOp.parse("=")).toBe("==");
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

const MIN = 1 << 31;
const MAX = ~MIN;

// Random generator for interval bounds such that min < max
const bounds = fc.integer({min: MIN, max: MAX - 1}).chain((min) => fc.tuple(
    fc.constant(min),
    fc.integer({min: min + 1, max: MAX}),
));

describe("A clamped change with bounds [min, max]", () => {
    describe('using operator "+"', () => {
        const op = "+";

        // Rationale: If it was already max before, it can only be at most max afterward, and the check should pass.
        it.prop([bounds])('is true if before == after == max', ([min, max]) => {
            const change = newChange({change: op}, {min, max, kind: "clamped"});
            expect(change.apply(max, max)).toStrictEqual(pass());
        });

        // Values that don't reach the max bound.
        const values = bounds.chain(([min, max]) => fc.record({
            after: fc.integer({min, max: max - 1}),
            before: fc.integer({min, max: max - 1}),
            min: fc.constant(min),
            max: fc.constant(max),
        }));

        it.prop([values])('has the same result as a regular change otherwise', ({after, before, min, max}) => {
            const regular = newChange({change: op});
            const clamped = newChange({change: op}, {min, max, kind: "clamped"});
            const expected = regular.apply(after, before).enhance({min, max, kind: "clamped"});
            expect(clamped.apply(after, before)).toStrictEqual(expected);
        });
    });

    describe('using operator "-"', () => {
        const op = "-";

        // Rationale: If it was already min before, it can only be at least min afterward, and the check should pass.
        it.prop([bounds])('is true if before == after == min', ([min, max]) => {
            const change = newChange({change: op}, {min, max, kind: "clamped"});
            expect(change.apply(min, min)).toStrictEqual(pass());
        });

        // Values that don't reach the min bound.
        const values = bounds.chain(([min, max]) => fc.record({
            after: fc.integer({min: min + 1, max}),
            before: fc.integer({min: min + 1, max}),
            min: fc.constant(min),
            max: fc.constant(max),
        }));

        it.prop([values])('has the same result as a regular change otherwise', ({after, before, min, max}) => {
            const regular = newChange({change: op});
            const clamped = newChange({change: op}, {min, max, kind: "clamped"});
            const expected = regular.apply(after, before).enhance({min, max, kind: "clamped"});
            expect(clamped.apply(after, before)).toStrictEqual(expected);
        });
    });

    describe('using operator "!="', () => {
        const op = "!=";

        // Rationale: If value was already max before, it can only be max afterward. The value could have tried to
        // increase, but stayed the same due to clamping. The check should pass.
        it.prop([bounds])('is true if before == after == max', ([min, max]) => {
            const change = newChange({change: op}, {min, max, kind: "clamped"});
            expect(change.apply(max, max)).toStrictEqual(pass());
        });

        // Rationale: If value was already min before, it can only be min afterward. The value could have tried to
        // decrease, but stayed the same due to clamping. The check should pass.
        it.prop([bounds])('is true if before == after == min', ([min, max]) => {
            const change = newChange({change: op}, {min, max, kind: "clamped"});
            expect(change.apply(min, min)).toStrictEqual(pass());
        });

        // Values that reach neither min nor max bound.
        const values = bounds
            .filter(([min, max]) => max - min > 1) // To avoid min > max later
            .chain(([min, max]) => fc.record({
                after: fc.integer({min: min + 1, max: max - 1}),
                before: fc.integer({min: min + 1, max: max - 1}),
                min: fc.constant(min),
                max: fc.constant(max),
            })).chain(({after, before, min, max}) => fc.record({
                after: fc.oneof(  // Ensure pass() and fail() are equally likely
                    fc.constant(after),
                    fc.constant(before)
                ),
                before: fc.constant(before),
                min: fc.constant(min),
                max: fc.constant(max),
            }));

        it.prop([values])('has the same result as a regular change otherwise', ({after, before, min, max}) => {
            const regular = newChange({change: op});
            const clamped = newChange({change: op}, {min, max, kind: "clamped"});
            const expected = regular.apply(after, before).enhance({min, max, kind: "clamped"});
            expect(clamped.apply(after, before)).toStrictEqual(expected);
        });
    });

    // These operators all include "=", whose semantics are not affected by clamping.
    describe.each(["==", "+=", "-="])('using operator "%s"', (op: ChangeOp) => {
        const values = bounds.chain(([min, max]) => fc.record({
            after: fc.integer({min, max}),
            before: fc.integer({min, max}),
            min: fc.constant(min),
            max: fc.constant(max),
        }));

        it.prop([values])('always has the same result as a regular change', ({after, before, min, max}) => {
            const regular = newChange({change: op});
            const clamped = newChange({change: op}, {min, max, kind: "clamped"});
            const expected = regular.apply(after, before).enhance({min, max, kind: "clamped"});
            expect(clamped.apply(after, before)).toStrictEqual(expected);
        });
    });

    describe("by a positive number", () => {
        const values = bounds.chain(([min, max]) => fc.record({
            before: fc.integer({min, max}),
            after: fc.integer({min, max}),
            min: fc.constant(min),
            max: fc.constant(max),
        }));

        const reachMax = values.chain(({before, min, max}) => fc.record({
            before: fc.constant(before),
            change: fc.integer({min: max - before, max: Number.MAX_SAFE_INTEGER}), // Make it reach or exceed max
            min: fc.constant(min),
            max: fc.constant(max),
        }));

        it.prop([reachMax])("is true if it reaches max", ({before, change, min, max}) => {
            const c = newChange({change}, {min, max, kind: "clamped"});
            expect(c.apply(max, before)).toStrictEqual(pass());
        });

        const within = values
            .filter(({before, max}) => max - before > 1) // Ensure change by at least 1 later
            .chain(({before, after, min, max}) => fc.record({
                before: fc.constant(before),
                after: fc.constant(after),
                change: fc.integer({min: 1, max: max - before}), // Make sure it stays within bounds
                min: fc.constant(min),
                max: fc.constant(max),
            }));

        it.prop([within])("has the same result as a regular change otherwise", ({after, before, change, min, max}) => {
            const clamped = newChange({change}, {min, max, kind: "clamped"});
            const regular = newChange({change});
            const expected = regular.apply(after, before).enhance({min, max, kind: "clamped"});
            expect(clamped.apply(after, before)).toStrictEqual(expected);
        });
    });

    describe("by a negative number", () => {
        const values = bounds.chain(([min, max]) => fc.record({
            before: fc.integer({min, max}),
            after: fc.integer({min, max}),
            min: fc.constant(min),
            max: fc.constant(max),
        }));

        const reachMin = values.chain(({before, min, max}) => fc.record({
            before: fc.constant(before),
            change: fc.integer({min: Number.MIN_SAFE_INTEGER, max: min - before}), // Make it reach or drop below min
            min: fc.constant(min),
            max: fc.constant(max),
        }));

        it.prop([reachMin])("is true if it reaches min", ({before, change, min, max}) => {
            const c = newChange({change}, {min, max, kind: "clamped"});
            expect(c.apply(min, before)).toStrictEqual(pass());
        });

        const within = values
            .filter(({before, min}) => before - min > 1) // Ensure change by at least 1 later
            .chain(({before, after, min, max}) => fc.record({
                before: fc.constant(before),
                after: fc.constant(after),
                change: fc.integer({min: min - before, max: -1}), // Make sure it stays within bounds
                min: fc.constant(min),
                max: fc.constant(max),
            }));

        it.prop([within])("has the same result as a regular change otherwise", ({after, before, change, min, max}) => {
            const clamped = newChange({change}, {min, max, kind: "clamped"});
            const regular = newChange({change});
            const expected = regular.apply(after, before).enhance({min, max, kind: "clamped"});
            expect(clamped.apply(after, before)).toStrictEqual(expected);
        });
    });

    describe("by 0", () => {
        const num = fc.integer();
        const pos = fc.integer({min: 1});

        const values = fc.tuple(num, pos, pos, pos)
            .map(([min, x, y, z]) => ({
                min,
                x: min + x,
                y: min + x + y,
                max: min + x + y + z
            })).chain(({min, x, y, max}) => fc.record({
                min: fc.constant(min),
                x: fc.oneof( // Ensure pass() and fail() equally likely
                    fc.constant(x),
                    fc.constant(y),
                ),
                y: fc.constant(y),
                max: fc.constant(max),
            }));

        it.prop([values])("has the same result as a regular change", ({min, x, y, max}) => {
            const clamped = newChange({change: 0}, {min, max, kind: "clamped"});
            const regular = newChange({change: 0});
            const expected = regular.apply(x, y).enhance({min, max, kind: "clamped"});
            expect(clamped.apply(x, y)).toStrictEqual(expected);
        });
    });
});

describe("A cyclic change with bounds [min, max]", () => {
    describe.each(["+=", "-="])('using operator "%s"', (op: ChangeOp) => {
        // Choose bounds first, then choose two arbitrary values within bounds.
        const values = bounds.chain(([min, max]) => fc.record({
            after: fc.integer({min, max}),
            before: fc.integer({min, max}),
            min: fc.constant(min),
            max: fc.constant(max),
        }));

        it.prop([values])("always passes", ({after, before, min, max}) => {
            const change = newChange({change: op}, {min, max, kind: "cyclic"});
            expect(change.apply(after, before)).toStrictEqual(pass());
        });
    });

    // Choose bounds first, then choose two arbitrary values (after, before) within bounds, then decide with
    // equal probability if (1) after === before, or (2) after !== before.
    const values = bounds.chain(([min, max]) => fc.record({
        after: fc.integer({min, max}),
        before: fc.integer({min, max}),
        min: fc.constant(min),
        max: fc.constant(max),
    })).chain(({after, before, min, max}) => fc.record({
        after: fc.oneof( // Ensure pass() and fail() equally likely
            fc.constant(before),
            fc.constant(after),
        ),
        before: fc.integer({min, max}),
        min: fc.constant(min),
        max: fc.constant(max),
    }));

    const atLeastOneNotOnBound = values.filter(({after, before, min, max}) =>
        (before != min && before != max) || (after != min && after != max));

    describe.each(["+", "-"])('using operator "%s"', (op: ChangeOp) => {
        it.prop([values])('is equivalent to "!="', ({after, before, min, max}) => {
            const change = newChange({change: op}, {min, max, kind: "cyclic"});
            const unequal = newChange({change: "!="}, {min, max, kind: "cyclic"});
            expect(change.apply(after, before)).toStrictEqual(unequal.apply(after, before));
        });
    });

    describe.each(["==", '!='])('using operator "%s"', (op: ChangeOp) => {
        it.prop([atLeastOneNotOnBound])('is equivalent to the regular change', ({after, before, min, max}) => {
            const cyclic = newChange({change: op}, {min, max, kind: "cyclic"});
            const regular = newChange({change: op});
            const expected = regular.apply(after, before).enhance({min, max, kind: "cyclic"});
            expect(cyclic.apply(after, before)).toStrictEqual(expected);
        });
    });

    describe("by a positive number", () => {
        // Choose bounds first, then choose after and before such that after < before
        const passing = bounds.chain(([min, max]) => fc.record({
            after: fc.integer({min, max: max - 1}), // To allow after < before later
            min: fc.constant(min),
            max: fc.constant(max),
        })).chain(({after, min, max}) => fc.record({
            after: fc.constant(after),
            before: fc.integer({min: after + 1, max}),
            min: fc.constant(min),
            max: fc.constant(max),
        }));

        it.prop([passing])("passes for after < before if wrapping around correctly", ({after, before, min, max}) => {
            const change = (max - before) + (after - min);
            const c = newChange({change}, {min, max, kind: "cyclic"});
            expect(c.apply(after, before)).toStrictEqual(pass());
        });

        const failing = passing
            .filter(({min, max}) => max - min > 1) // Ensure it's possible to have min < v < max
            .chain(({after, before, min, max}) => fc.record({
                after: fc.constant(after),
                before: fc.constant(before),
                min: fc.constant(min),
                max: fc.constant(max),
                change: fc.integer({
                    min: 1,
                    max: max - min
                }).filter((c) => c % (max - min) !== (max - before) + (after - min)),
            }));

        it.prop([failing])("fails otherwise", ({after, before, min, max, change}) => {
            const c = newChange({change}, {min, max, kind: "cyclic"});
            expect(c.apply(after, before)).toStrictEqual(fail(expect.any(Object)));
        });
    });

    describe("by a negative number", () => {
        // Choose bounds first, then choose after and before such that after > before
        const passing = bounds.chain(([min, max]) => fc.record({
            after: fc.integer({min: min + 1, max}), // To allow after > before later
            min: fc.constant(min),
            max: fc.constant(max),
        })).chain(({after, min, max}) => fc.record({
            after: fc.constant(after),
            before: fc.integer({min, max: after - 1}),
            min: fc.constant(min),
            max: fc.constant(max),
        }));

        it.prop([passing])("passes for after > before if wrapping around correctly", ({after, before, min, max}) => {
            const change = -((max - after) + (before - min));
            const c = newChange({change}, {min, max, kind: "cyclic"});
            expect(c.apply(after, before)).toStrictEqual(pass());
        });

        const failing = passing
            .filter(({min, max}) => max - min > 1) // Ensure it's possible to have min < v < max
            .chain(({after, before, min, max}) => fc.record({
                after: fc.constant(after),
                before: fc.constant(before),
                min: fc.constant(min),
                max: fc.constant(max),
                change: fc.integer(({
                    min: min - max,
                    max: 0
                })).filter((c) => c % (max - min) !== -((max - after) + (before - min))),
            }));

        it.prop([failing])("fails otherwise", ({after, before, min, max, change}) => {
            const c = newChange({change}, {min, max, kind: "cyclic"});
            expect(c.apply(after, before)).toStrictEqual(fail(expect.any(Object)));
        });
    });

    describe("by 0", () => {
        it.prop([atLeastOneNotOnBound])("has the same result as the regular change", ({after, before, min, max}) => {
            const cyclic = newChange({change: 0}, {min, max, kind: "cyclic"});
            const regular = newChange({change: 0});
            const expected = regular.apply(after, before).enhance({min, max, kind: "cyclic"});
            expect(cyclic.apply(after, before)).toStrictEqual(expected);
        });
    });
});

describe.each(["cyclic", "clamped"] as const)("A %s change throws a RangeError", (kind) => {
    const invalid = fc.integer().chain((min) => fc.tuple(
        fc.constant(min),
        fc.integer({min: Number.MIN_SAFE_INTEGER, max: min - 1}),
    ));

    test.prop([invalid, numOp])("if given invalid interval bounds", ([min, max], change) => {
        expect(() => newChange({change}, {min, max, kind})).toThrow(RangeError);
    });
});
