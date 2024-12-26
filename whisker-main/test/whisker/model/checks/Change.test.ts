import {fc, it} from "@fast-check/jest";
import {ChangeOp, changeOps, newChange, NumberOrChangeOp} from "../../../../src/whisker/model/checks/Change";

const number = fc.double({noNaN: true});
const numberLike = fc.oneof(number, number.map((n) => `${n}`));
const notNumberLike = fc.string().filter((s) =>
    s.trim().length > 0 && Number.isNaN(Number(s)) && !changeOps.includes(s as ChangeOp));
const posNumberZero = fc.double({noNaN: true, min: 0});
const posNumber = posNumberZero.filter((n) => n !== 0);
const negNumberZero = fc.double({noNaN: true, max: 0});
const negNumber = negNumberZero.filter((n) => n !== 0);
const blankString = fc.stringMatching(/^\s+$/);
const nn = fc.tuple(number, number);
const xy = nn.filter(([x, y]) => x !== y);
const numOp = fc.oneof(number, fc.constantFrom(...changeOps));

// todo: create arbitrary for changes, like for comparisons

describe("The exact change by a number", () => {
    it.prop([number])("has the number as offset", (n) => {
        const c = newChange({change: n});
        expect(c['offset']).toBe(n); // FIXME: offset property
    });

    it.prop([number])(`has "=" as operator`, (n) => {
        const c = newChange({change: n});
        expect(c.operator).toBe("=");
    });

    it.prop([number])("never contradicts itself", (n) => {
        const c = newChange({change: n});
        expect(c.contradicts(c)).toBe(false);
    });

    it.prop([xy])("always contradicts a change by a different number", ([x, y]) => {
        const c1 = newChange({change: x});
        const c2 = newChange({change: y});
        expect(c1.contradicts(c2)).toBe(true);
    });

    it.prop([number])("always contradicts its negation", (n) => {
        const c1 = newChange({change: n});
        const c2 = newChange({change: n, negated: true});
        expect(c1.contradicts(c2)).toBe(true);
    });

    it.prop([xy])("does not contradict a negated change with a different number", ([x, y]) => {
        const c1 = newChange({change: x});
        const c2 = newChange({change: y, negated: true});
        expect(c1.contradicts(c2)).toBe(false);
    });

    it.prop([number, number])("never contradicts another change if both are negated", (x, y) => {
        const c1 = newChange({change: x, negated: true});
        const c2 = newChange({change: y, negated: true});
        expect(c1.contradicts(c2)).toBe(false);
    });

    const asdf = nn.map(([offset, before]) => [offset, before, before + offset]);
    const asdf2 = fc.tuple(number, number, number).filter(([offset, before, after]) =>
        offset + before !== after);

    it.prop([asdf])("it is true if the offset", ([offset, before, after]) => {
        const c = newChange({change: offset});
        expect(c.apply(after, before)).toBe(true);
    });

    it.prop([asdf2])("it is false if not the offset", ([offset, before, after]) => {
        const c = newChange({change: offset});
        expect(c.apply(after, before)).toBe(false);
    });

    it.prop([asdf])("it is false if negated", ([offset, before, after]) => {
        const c = newChange({change: offset, negated: true});
        expect(c.apply(after, before)).toBe(false);
    });

    it.prop([asdf2])("it is true if negated", ([offset, before, after]) => {
        const c = newChange({change: offset, negated: true});
        expect(c.apply(after, before)).toBe(true);
    });
});

it.prop([numOp, fc.boolean(), numOp, fc.boolean()])("Contradiction is symmetric", (x, b, y, c) => {
    const c1 = newChange({change: x, negated: b});
    const c2 = newChange({change: y, negated: c});
    expect(c1.contradicts(c2)).toBe(c2.contradicts(c1));
});

describe.each([
    ["+", ["=", "-", "-="], nn.filter(([x, y]) => x > y)],
    ["-", ["=", "+", "+="], nn.filter(([x, y]) => x < y)],
    ["=", ["+", "-", "!="], number.map((n) => [n, n])],
    ["+=", ["-"], nn.filter(([x, y]) => x >= y)],
    ["-=", ["+"], nn.filter(([x, y]) => x <= y)],
    ["!=", ["="], xy],
])('The "%s" change', (op1: ChangeOp, contradicting: ChangeOp[], ns) => {
    it('has "%s" as operator', () => {
        const c = newChange({change: op1});
        expect(c.operator).toBe(op1);
    });

    it.prop([ns])("is true for", ([x, y]) => {
        const change = newChange({change: op1});
        expect(change.apply(x, y)).toBe(true);
    });

    it.each(contradicting)('contradicts the "%s" change', (op2) => {
        const c1 = newChange({change: op1});
        const c2 = newChange({change: op2});
        expect(c1.contradicts(c2)).toBe(true);
    });

    it.each(contradicting)('when negated does not contradict the "%s" change', (op2) => {
        const c1 = newChange({change: op1, negated: true});
        const c2 = newChange({change: op2});
        expect(c1.contradicts(c2)).toBe(false);
    });

    it.each(contradicting)('does not contradict the negated "%s" change', (op2) => {
        const c1 = newChange({change: op1});
        const c2 = newChange({change: op2, negated: true});
        expect(c1.contradicts(c2)).toBe(false);
    });

    const compatible = changeOps.filter((op) => !contradicting.includes(op));

    it.each(compatible)('does not contradict the "%s" change', (op2) => {
        const c1 = newChange({change: op1});
        const c2 = newChange({change: op2});
        expect(c1.contradicts(c2)).toBe(false);
    });
});

describe.each([
    ["a positive number", posNumber, ["=", "-", "-="], "+"],
    ["a negative number", negNumber, ["=", "+", "+="], "-"],
    ["zero", fc.constantFrom(0, -0, +0), ["+", "-", "!="], "="],
])('The exact change by %s', (_, n, ops) => {
    describe.each(ops)('contradicts', (op: ChangeOp) => {
        it.prop([n])(`the "${op}" change`, (n) => {
            const c1 = newChange({change: n});
            const c2 = newChange({change: op});
            expect(c1.contradicts(c2)).toBe(true);
        });
    });

    describe.each(ops)('is contradicted by', (op: ChangeOp) => {
        it.prop([n])(`the "${op}" change`, (n) => {
            const c1 = newChange({change: op});
            const c2 = newChange({change: n});
            expect(c1.contradicts(c2)).toBe(true);
        });
    });
});

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

    it.prop([blankString])("fails for blank strings", (s) => {
        expect(() => NumberOrChangeOp.parse(s)).toThrow();
    });

    it.prop([notNumberLike])("fails for strings that are not number-like", (s) => {
        expect(() => NumberOrChangeOp.parse(s)).toThrow();
    });
});

/*

describe('testChange()', () => {
    describe('exception for invalid input', () => {
        const invalidInputs: [string, string, string][] = [
            ["0", "string", "-"],
            ["string", "0", "-"],
            ["string", "0", "+"],
            ["0", "string", "+"],
            ["0", "1", "anything"],
            ["0", "1", null],
            [null, "1", "+"],
            ["0", null, "-"],
        ];
        it.each(invalidInputs)('throw exception for: %s, %s, %s',
            (oldValue, newValue, change) => {
                expect(() => {
                    ModelUtil.testChange(oldValue, newValue, change);
                }).toThrow();
            });
    });

    describe('correct return values', () => {
        const params: [string, string, string, boolean][] = [
            ["0", "-1", "-", true],
            ["-1", "0", "-", false],
            ["1", "1", "-", false],

            ["0", "-1", "+5", false],
            ["-1", "0", "+", true],
            ["1", "1", "+", false],

            ["0", "-1", "=", false],
            ["-1", "0", "=", false],
            ["1", "1", "=", true],

            ["0", "-1", "+=", false],
            ["0", "-1", "-=", true],
        ];
        it.each(params)('testChange(%s, %s, %s) == %s',
            (oldValue, newValue, change, expected) => {
                expect(ModelUtil.testChange(oldValue, newValue, change)).toBe(expected);
            });
    });
});

 */
