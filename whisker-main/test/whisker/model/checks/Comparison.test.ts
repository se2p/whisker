import {fc, it} from "@fast-check/jest";
import {
    ComparingCheck,
    ComparisonOp,
    comparisonOps,
    newComparison,
    newQuantifiedComparison
} from "../../../../src/whisker/model/checks/Comparison";
import Arrays from "../../../../src/whisker/utils/Arrays";

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
        ["x < y", resLt, xy.filter(([x, y]) => x < y)],
        ["x > y", resGt, xy.filter(([x, y]) => x > y)],
        ["x == y", resEq, number.map((x) => [x, x])],
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

    it.prop([xy])("is idempotent regarding double negation", ([x, value]) => {
        const c = newComparison({operator, value});
        const expected = c.apply(x);
        expect(c.negate().negate().apply(x)).toBe(expected);
    });

    it.prop([xy])("has the same result when negated directly or retroactively", ([x, value]) => {
        const d = newComparison({operator, value, negated: true}); // directly negated
        const c = newComparison({operator, value}).negate(); // retroactively negated
        expect(c.apply(x)).toBe(d.apply(x));
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
    ["==", "==", xy.filter(([y, b]) => y != b), true, "if y != b"],
    ["==", "!=", xy.filter(([y, b]) => y != b), false, "if y != b"],
    ["==", "!=", number.map((y) => [y, y]), true, "if y == b"],
    ["==", ">", xy.filter(([y, b]) => y > b), false, "if y > b"],
    ["==", ">", xy.filter(([y, b]) => y <= b), true, "if y <= b"],
    ["==", ">=", xy.filter(([y, b]) => y >= b), false, "if y >= b"],
    ["==", ">=", xy.filter(([y, b]) => y < b), true, "if y < b"],
    ["==", "<", xy.filter(([y, b]) => y < b), false, "if y < b"],
    ["==", "<", xy.filter(([y, b]) => y >= b), true, "if y >= b"],
    ["==", "<=", xy.filter(([y, b]) => y <= b), false, "if y <= b"],
    ["==", "<=", xy.filter(([y, b]) => y > b), true, "if y > b"],

    ["!=", ">", xy, false, "always"],
    ["!=", ">=", xy, false, "always"],
    ["!=", "<", xy, false, "always"],
    ["!=", "<=", xy, false, "always"],

    [">", ">=", xy, false, "always"],
    [">", "<", xy.filter(([y, b]) => y >= b), true, "if y >= b"],
    [">", "<", xy.filter(([y, b]) => y < b), false, "if y < b"],
    [">", "<=", xy.filter(([y, b]) => y >= b), true, "if y >= b"],
    [">", "<=", xy.filter(([y, b]) => y < b), false, "if y < b"],

    [">=", "<", xy.filter(([y, b]) => y < b), false, "if y < b"],
    [">=", "<", xy.filter(([y, b]) => y >= b), true, "if y >= b"],
    [">=", "<=", xy.filter(([y, b]) => y <= b), false, "if y <= b"],
    [">=", "<=", xy.filter(([y, b]) => y > b), true, "if y > b"],

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

function shuffle(a) {
    a = [...a];
    Arrays.shuffle(a);
    return a;
}

function comparingCheck(negated: boolean | null = null): fc.Arbitrary<ComparingCheck> {
    return fc.record({
        operator: fc.constantFrom(...comparisonOps),
        value: number,
        negated: negated === null ? fc.boolean() : fc.constantFrom(negated),
    });
}

const quantified = comparingCheck().map((json) => [newQuantifiedComparison(json), newComparison(json)] as const);
const existential = comparingCheck(false).map((json) => [newQuantifiedComparison(json), newComparison(json)] as const);
const universal = comparingCheck(true).map((json) => [newQuantifiedComparison(json), newComparison(json)] as const);

describe("A quantified comparison", () => {
    it.prop([universal, number])("has the same result as the underlying comparison for singleton arrays",
        ([q, c], n) => {
            expect(q.apply([n])).toBe(c.apply(n));
        });

    it.prop([quantified, fc.array(number, {minLength: 2}).map((a) => [a, shuffle(a)])])(
        "has the same result regardless of the order of elements", ([q], [a1, a2]) => {
            expect(q.apply(a1)).toBe(q.apply(a2));
        });

    it.prop([quantified])("never contradicts itself", ([q]) => {
        expect(q.contradicts(q)).toBe(false);
    });

    it.prop([comparingCheck()])("always contradicts its negation", (json) => {
        const q = newQuantifiedComparison(json);
        const p = newQuantifiedComparison({...json, negated: !json.negated});
        expect(q.contradicts(p)).toBe(true);
    });

    it.prop([quantified, quantified])("has a symmetric contradicts() method", ([q1], [q2]) => {
        expect(q1.contradicts(q2)).toBe(q2.contradicts(q1));
    });
});

describe("An existentially quantified comparison", () => {
    it.prop([existential])("is always false for empty arrays", ([q]) => {
        expect(q.apply([])).toBe(false);
    });

    it.each([
        ["<=", 3, [1, 2, 3, 4, 5]],
        ["<", 2, [0, 1, 2, 3, 4]],
        [">=", 1, [0, 1, 2, 3, 4]],
        [">", 1, [0, 1, 2, 3, 4]],
        ["!=", 4, [3, 4, 4, 4, 4]],
        ["==", 5, [0, 1, 2, 3, 5]],
    ])('is true if at least one element satisfies the comparison ("%s")', (operator: ComparisonOp, value, array) => {
        const q = newQuantifiedComparison({operator, value, negated: false});
        expect(q.apply(array)).toBe(true);
    });

    it.each([
        ["<=", 0, [1, 2, 3, 4, 5]],
        ["<", 0, [0, 1, 2, 3, 4]],
        [">=", 5, [0, 1, 2, 3, 4]],
        [">", 4, [0, 1, 2, 3, 4]],
        ["!=", 4, [4, 4, 4, 4, 4]],
        ["==", 4, [0, 1, 2, 3, 5]],
    ])('is false if no element satisfies the comparison ("%s")', (operator: ComparisonOp, value, array) => {
        const q = newQuantifiedComparison({operator, value, negated: false});
        expect(q.apply(array)).toBe(false);
    });

    it.prop([existential, existential])("never contradicts other existential comparisons", ([q1], [q2]) => {
        expect(q1.contradicts(q2)).toBe(false);
    });

    it.prop([existential, universal])(
        "contradicts a universally quantified comparison if the underlying comparisons contradict",
        ([q1, c1], [q2, c2]) => {
            expect(q1.contradicts(q2)).toBe(c1.contradicts(c2));
        });
});

describe("A universally quantified comparison", () => {
    it.prop([universal])("is always true for empty arrays", ([q]) => {
        expect(q.apply([])).toBe(true);
    });

    it.each([
        ["<=", 0, [1, 2, 3, 4, 5]],
        ["<", 0, [0, 1, 2, 3, 4]],
        [">=", 5, [0, 1, 2, 3, 4]],
        [">", 4, [0, 1, 2, 3, 4]],
        ["!=", 4, [4, 4, 4, 4, 4]],
        ["==", 4, [0, 1, 2, 3, 5]],
    ])('is true if all elements satisfy the comparison ("%s")', (operator: ComparisonOp, value, array) => {
        const q = newQuantifiedComparison({operator, value, negated: true});
        expect(q.apply(array)).toBe(true);
    });

    it.each([
        ["<=", 0, [1, 2, 3, 4, 0]],
        ["<", 0, [0, 1, -1, 3, 4]],
        [">=", 5, [0, 1, 2, 3, 5]],
        [">", 4, [0, 1, 2, 3, 5]],
        ["!=", 4, [4, 4, 3, 4, 4]],
        ["==", 4, [0, 4, 2, 3, 5]],
    ])('is false if at least one element does not satisfy the comparison ("%s")',
        (operator: ComparisonOp, value, array) => {
            const q = newQuantifiedComparison({operator, value, negated: true});
            expect(q.apply(array)).toBe(false);
        });

    it.prop([universal, quantified])(
        "contradicts another quantified comparison if the underlying comparisons contradict",
        ([q1, c1], [q2, c2]) => {
            expect(q1.contradicts(q2)).toBe(c1.contradicts(c2));
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
