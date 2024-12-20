import {fc, it} from "@fast-check/jest";
import {ComparisonOp, comparisonOps, newComparison} from "../../../../src/whisker/model/checks/Comparison";

const number = () => fc.double({noNaN: true});
const xy = () => fc.tuple(number(), number());

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

    it.prop([number(), fc.boolean()])(`has y as 2nd operand`, (value, negated) => {
        const c = newComparison({operator, value, negated});
        expect(c.operand2).toStrictEqual(value);
    });

    it.prop([number()])("implements toString() correctly", (value) => {
        const c = newComparison({operator, value});
        expect(c.toString()).toStrictEqual(`x ${operator} ${value}`);
    });

    describe.each([
        ["x < y", resLt, xy().filter(([x, y]) => x < y)],
        ["x > y", resGt, xy().filter(([x, y]) => x > y)],
        ["x == y", resEq, number().map((x) => [x, x])],
    ])("when %s", (_, expected, arbitrary) => {
        it.prop([arbitrary])(`is ${expected}`, ([x, value]) => {
            const c = newComparison({operator, value});
            expect(c.apply(x)).toBe(expected);
        });

        it.prop([arbitrary])(`is ${!expected} if negated`, ([x, value]) => {
            const c = newComparison({operator, value, negated: true});
            expect(c.apply(x)).toBe(!expected);
        });
    });

    it.prop([xy()])("is idempotent regarding double negation", ([x, value]) => {
        const c = newComparison({operator, value});
        const expected = c.apply(x);
        expect(c.negate().negate().apply(x)).toBe(expected);
    });

    it.prop([xy()])("has the same result when negated directly or retroactively", ([x, value]) => {
        const d = newComparison({operator, value, negated: true}); // directly negated
        const c = newComparison({operator, value}).negate(); // retroactively negated
        expect(c.apply(x)).toBe(d.apply(x));
    });

    it.prop([number()])("never contradicts itself", (value) => {
        const c = newComparison({operator, value});
        expect(c.contradicts(c)).toBe(false);
    });

    it.prop([number()])("always contradicts its negation", (value) => {
        const c = newComparison({operator, value});
        const d = newComparison({operator, value, negated: true});
        expect(c.contradicts(c.negate())).toBe(true);
        expect(c.contradicts(d)).toBe(true);
    });
});

describe.each([
    ["==", "==", xy().filter(([y, b]) => y != b), true, "if y != b"],
    ["==", "!=", xy().filter(([y, b]) => y != b), false, "if y != b"],
    ["==", "!=", number().map((y) => [y, y]), true, "if y == b"],
    ["==", ">", xy().filter(([y, b]) => y > b), false, "if y > b"],
    ["==", ">", xy().filter(([y, b]) => y <= b), true, "if y <= b"],
    ["==", ">=", xy().filter(([y, b]) => y >= b), false, "if y >= b"],
    ["==", ">=", xy().filter(([y, b]) => y < b), true, "if y < b"],
    ["==", "<", xy().filter(([y, b]) => y < b), false, "if y < b"],
    ["==", "<", xy().filter(([y, b]) => y >= b), true, "if y >= b"],
    ["==", "<=", xy().filter(([y, b]) => y <= b), false, "if y <= b"],
    ["==", "<=", xy().filter(([y, b]) => y > b), true, "if y > b"],

    ["!=", ">", xy(), false, "always"],
    ["!=", ">=", xy(), false, "always"],
    ["!=", "<", xy(), false, "always"],
    ["!=", "<=", xy(), false, "always"],

    [">", ">=", xy(), false, "always"],
    [">", "<", xy().filter(([y, b]) => y >= b), true, "if y >= b"],
    [">", "<", xy().filter(([y, b]) => y < b), false, "if y < b"],
    [">", "<=", xy().filter(([y, b]) => y >= b), true, "if y >= b"],
    [">", "<=", xy().filter(([y, b]) => y < b), false, "if y < b"],

    [">=", "<", xy().filter(([y, b]) => y < b), false, "if y < b"],
    [">=", "<", xy().filter(([y, b]) => y >= b), true, "if y >= b"],
    [">=", "<=", xy().filter(([y, b]) => y <= b), false, "if y <= b"],
    [">=", "<=", xy().filter(([y, b]) => y > b), true, "if y > b"],

    ["<", "<=", xy(), false, "always"],
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

// TODO: string comparisons?
