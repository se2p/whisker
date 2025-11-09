import {fc, it} from "@fast-check/jest";
import {CONST_FAIL, CONST_PASS, EPSILON, newComparison,} from "../../../../src/whisker/model/checks/Comparison";
import {ComparisonOp, comparisonOps} from "../../../../src/whisker/model/checks/CheckTypes";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";

const number = fc.double({noNaN: true});
const xy = fc.tuple(number, number);

describe.each([
    ["==", "!=", false, true, false],
    [">=", "<", false, true, true],
    [">", "<=", false, false, true],
    ["<=", ">", true, true, false],
    ["<", ">=", true, false, false],
    ["!=", "==", true, false, true],
])('The "x %s y" comparison', (operator: ComparisonOp, nop, resLt, resEq, resGt) => {
    it(`uses "${operator}" as operator`, () => {
        const c = newComparison({operator, value: 0});
        expect(c.operator).toStrictEqual(operator);
    });

    it(`uses "${nop}" as operator when negated`, () => {
        const c = newComparison({operator, value: 0}).negate();
        expect(c.operator).toStrictEqual(nop);

        const d = newComparison({operator, value: 0, negated: true});
        expect(d.operator).toStrictEqual(nop);
    });

    it.prop([number, fc.boolean()])(`has y as 2nd operand`, (value, negated) => {
        const c = newComparison({operator, value, negated});
        expect(c.operand2).toStrictEqual(value);
    });

    it.prop([number])("implements toString() correctly", (value) => {
        const c = newComparison({operator, value});
        expect(c.toString()).toStrictEqual(`x ${operator} ${value}`);
    });

    describe.each([
        ["x < y", resLt, xy.filter(([x, y]) => x < y && y - x > EPSILON)],
        ["x > y", resGt, xy.filter(([x, y]) => x > y && x - y > EPSILON)],
        ["x == y", resEq, number.map((x) => [x, x])],
    ])("when %s", (_, expected, arbitrary) => {
        it.prop([arbitrary])(`is ${expected}`, ([x, value]) => {
            const c = newComparison({operator, value});
            expect(c.apply(x).passed).toBe(expected);
        });

        it.prop([arbitrary])(`is ${!expected} if negated`, ([x, value]) => {
            const c = newComparison({operator, value, negated: true});
            expect(c.apply(x).passed).toBe(!expected);
        });
    });

    it.prop([xy])("is idempotent regarding double negation", ([x, value]) => {
        const c = newComparison({operator, value});
        const expected = c.apply(x).passed;
        expect(c.negate().negate().apply(x).passed).toBe(expected);
    });

    it.prop([xy])("has the same result when negated directly or retroactively", ([x, value]) => {
        const d = newComparison({operator, value, negated: true}); // directly negated
        const c = newComparison({operator, value}).negate(); // retroactively negated
        expect(c.apply(x).passed).toBe(d.apply(x).passed);
    });

    it.prop([number])("never contradicts itself", (value) => {
        const c = newComparison({operator, value});
        expect(c.contradicts(c)).toBe(false);
    });

    it.prop([number])("always contradicts its negation", (value) => {
        const c = newComparison({operator, value});
        const d = newComparison({operator, value, negated: true});
        expect(c.contradicts(c.negate())).toBe(true);
        expect(c.contradicts(d)).toBe(true);
    });
});

describe.each([
    ["==", "==", xy.filter(([y, b]) => y != b && Math.abs(y - b) > EPSILON), true, "if y != b"],
    ["==", "!=", xy.filter(([y, b]) => y != b && Math.abs(y - b) > EPSILON), false, "if y != b"],
    ["==", "!=", number.map((y) => [y, y]), true, "if y == b"],
    ["==", ">", xy.filter(([y, b]) => y > b && Math.abs(y - b) > EPSILON), false, "if y > b"],
    ["==", ">", xy.filter(([y, b]) => y <= b), true, "if y <= b"],
    ["==", ">=", xy.filter(([y, b]) => y >= b), false, "if y >= b"],
    ["==", ">=", xy.filter(([y, b]) => y < b && Math.abs(y - b) > EPSILON), true, "if y < b"],
    ["==", "<", xy.filter(([y, b]) => y < b && Math.abs(y - b) > EPSILON), false, "if y < b"],
    ["==", "<", xy.filter(([y, b]) => y >= b), true, "if y >= b"],
    ["==", "<=", xy.filter(([y, b]) => y <= b), false, "if y <= b"],
    ["==", "<=", xy.filter(([y, b]) => y > b && Math.abs(y - b) > EPSILON), true, "if y > b"],

    ["!=", ">", xy, false, "always"],
    ["!=", ">=", xy, false, "always"],
    ["!=", "<", xy, false, "always"],
    ["!=", "<=", xy, false, "always"],

    [">", ">=", xy, false, "always"],
    [">", "<", xy.filter(([y, b]) => y >= b), true, "if y >= b"],
    [">", "<", xy.filter(([y, b]) => y < b && Math.abs(y - b) > EPSILON), false, "if y < b"],
    [">", "<=", xy.filter(([y, b]) => y >= b), true, "if y >= b"],
    [">", "<=", xy.filter(([y, b]) => y < b && Math.abs(y - b) > EPSILON), false, "if y < b"],

    [">=", "<", xy.filter(([y, b]) => y < b && Math.abs(y - b) > EPSILON), false, "if y < b"],
    [">=", "<", xy.filter(([y, b]) => y >= b), true, "if y >= b"],
    [">=", "<=", xy.filter(([y, b]) => y <= b), false, "if y <= b"],
    [">=", "<=", xy.filter(([y, b]) => y > b && Math.abs(y - b) > EPSILON), true, "if y > b"],

    ["<", "<=", xy, false, "always"],
])('The contradiction of "x %s y" and "a %s b"',
    (op1: ComparisonOp, op2: ComparisonOp, arbitrary, expected, condition) => {
        it.prop([arbitrary])(`${condition} is ${expected}`, ([y, b]) => {
            const c = newComparison({operator: op1, value: y});
            const d = newComparison({operator: op2, value: b});
            expect(c.contradicts(d)).toBe(expected);
        });

        it.prop([arbitrary])("is symmetric", ([y, b]) => {
            const c = newComparison({operator: op1, value: y});
            const d = newComparison({operator: op2, value: b});
            expect(c.contradicts(d)).toBe(d.contradicts(c));
        });
    });

describe("The schema validation for comparison operators", () => {
    it.each(comparisonOps)('succeeds for "%s" and returns it unchanged', (op) => {
        expect(ComparisonOp.parse(op)).toBe(op);
    });

    it('canonicalizes "=" to "=="', () => {
        expect(ComparisonOp.parse("=")).toStrictEqual("==");
    });

    const invalidOperators = fc.string().filter((s) => !comparisonOps.includes(s as ComparisonOp) && s !== "=");
    it.prop([invalidOperators])("fails for invalid operators", (s) => {
        expect(() => ComparisonOp.parse(s)).toThrowError();
    });
});

const pos = fc.integer({min: 1});
const neg = fc.integer({max: -1});
const num = fc.oneof(pos, neg);
const bounds = fc.tuple(num, pos).map(([min, x]) => [min, min + x]);

describe("A comparison with an interval [min, max]", () => {
    describe.each(["==", "<=", ">="])('using operator "%s"', (op: ComparisonOp) => {
        const values = bounds
            .chain(([min, max]) => fc.tuple(
                fc.integer({min, max}),
                fc.integer({min, max}),
                fc.constant(min),
                fc.constant(max),
            )).chain(([x, y, min, max]) => fc.tuple(
                fc.oneof(
                    {arbitrary: fc.constant(x), weight: 1}, // 33% -> x == y
                    {arbitrary: fc.constant(y), weight: 2}, // 66% -> x != y (33% -> x < y, 33% -> y > x)
                ),
                fc.constant(y),
                fc.constant(min),
                fc.constant(max),
            ));

        it.prop([values])("has the same result as a regular comparison", ([x, y, min, max]) => {
            const regular = newComparison({operator: op, value: y});
            const interval = newComparison({operator: op, value: y}, {min, max});
            expect(interval.apply(x)).toStrictEqual(regular.apply(x).enhance({min, max}));
        });
    });

    describe('using operator ">"', () => {
        const operator = ">";

        it.prop([bounds])("is true for x == y == max", ([min, max]) => {
            const comp = newComparison({operator, value: max}, {min, max});
            expect(comp.apply(max)).toStrictEqual(pass());
        });

        it.prop([bounds])("is false for x == min and y == max", ([min, max]) => {
            const comp = newComparison({operator, value: max}, {min, max});
            expect(comp.apply(min)).toStrictEqual(fail(expect.any(Object)));
        });

        const values = fc.tuple(num, pos, pos, pos)
            .map(([min, x, y, z]) => [min, min + x, min + x + y, min + x + y + z]);

        it.prop([values])("has the same result as the regular comparison otherwise", ([min, x, y, max]) => {
            const regular = newComparison({operator, value: y});
            const interval = newComparison({operator, value: y}, {min, max});
            expect(interval.apply(x)).toStrictEqual(regular.apply(x).enhance({min, max}));
        });
    });

    describe('using operator "<"', () => {
        const operator = "<";

        it.prop([bounds])("is true for x == y == min", ([min, max]) => {
            const comp = newComparison({operator, value: min}, {min, max});
            expect(comp.apply(min)).toStrictEqual(pass());
        });

        it.prop([bounds])("is false for x == max and y == min", ([min, max]) => {
            const comp = newComparison({operator, value: min}, {min, max});
            expect(comp.apply(max)).toStrictEqual(fail(expect.any(Object)));
        });

        const values = fc.tuple(num, pos, pos, pos)
            .map(([min, x, y, z]) => [min, min + x, min + x + y, min + x + y + z]);

        it.prop([values])("has the same result as the regular comparison otherwise", ([min, x, y, max]) => {
            const regular = newComparison({operator, value: y});
            const interval = newComparison({operator, value: y}, {min, max});
            expect(interval.apply(x)).toStrictEqual(regular.apply(x));
        });
    });

    describe('using operator "!="', () => {
        const operator = "!=";

        it.prop([bounds])("is true for x == y == min", ([min, max]) => {
            const comp = newComparison({operator, value: min}, {min, max});
            expect(comp.apply(min)).toStrictEqual(pass());
        });

        it.prop([bounds])("is true for x == y == max", ([min, max]) => {
            const comp = newComparison({operator, value: max}, {min, max});
            expect(comp.apply(max)).toStrictEqual(pass());
        });

        const values = bounds
            .filter(([min, max]) => max - min > 1) // To avoid min > max later
            .chain(([min, max]) => fc.tuple(
                fc.integer({min: min + 1, max: max - 1}),
                fc.integer({min: min + 1, max: max - 1}),
                fc.constant(min),
                fc.constant(max),
            ));

        it.prop([values])("has the same result as the regular comparison otherwise", ([x, y, min, max]) => {
            const regular = newComparison({operator, value: y});
            const interval = newComparison({operator, value: y}, {min, max});
            expect(interval.apply(x)).toStrictEqual(regular.apply(x).enhance({min, max}));
        });
    });
});

describe("The CONST_PASS comparison", () => {
    it.prop([fc.double()])("always passes", (i) => {
        expect(CONST_PASS.apply(i)).toStrictEqual(pass());
    });

    it("returns CONST_FAIL when negated", () => {
        expect(CONST_PASS.negate()).toBe(CONST_FAIL);
    });
});

describe("The CONST_FAIL comparison", () => {
    it.prop([fc.double()])("always fails", (i) => {
        expect(CONST_FAIL.apply(i)).toStrictEqual(fail({message: "CONST_FAIL"}));
    });

    it("returns CONST_PASS when negated", () => {
        expect(CONST_FAIL.negate()).toBe(CONST_PASS);
    });
});
