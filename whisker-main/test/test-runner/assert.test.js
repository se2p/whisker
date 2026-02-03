const t = require("../../src/test-runner/assert");

describe.each([
    ["all", "assertion", t.assert, t.AssertionError],
    ["any", "assertion", t.assert, t.AssertionError],
    ["all", "assumption", t.assume, t.AssumptionError],
    ["any", "assumption", t.assume, t.AssumptionError]
])('The "%s" %s', (allAny, kind, assertAssume, AssertAssumeError) => {
    beforeEach(() => {
        assertAssume.onPassedAssertion = null;
        assertAssume.onExecutedAssertion = null;
        assertAssume.onPassedAssumption = null;
        assertAssume.onExecutedAssumption = null;
    });

    it(`only notifies about executed inner ${kind}s`, () => {
        const executed = [];
        assertAssume.onExecutedAssertion = (line) => executed.push(line);
        assertAssume.onExecutedAssumption = (line) => executed.push(line);
        assertAssume.line = 1;
        assertAssume[allAny](() => {
            assertAssume.line = 2;
            assertAssume.isTrue(true);
            assertAssume.line = 3;
            assertAssume.isTrue(true);
        });
        expect(executed).toStrictEqual([2, 3]);
    });

    it(`only notifies about passed inner ${kind}s`, () => {
        const passed = [];
        assertAssume.onPassedAssertion = (line) => passed.push(line);
        assertAssume.onPassedAssumption = (line) => passed.push(line);
        assertAssume.line = 1;
        assertAssume[allAny](() => {
            assertAssume.line = 2;
            assertAssume.isTrue(true);
            assertAssume.line = 3;
            assertAssume.isTrue(true);
        });
        expect(passed).toStrictEqual([2, 3]);
    });

    it("does not notify about its own execution", () => {
        let executed = false;
        assertAssume.onPassedAssertion = () => executed = true;
        assertAssume.onPassedAssumption = () => executed = true;
        assertAssume[allAny](() => { /* do nothing */ });
        expect(executed).toBeFalsy();
    });

    it("does not notify about its own status", () => {
        let passed = false;
        assertAssume.onPassedAssertion = () => passed = true;
        assertAssume.onPassedAssumption = () => passed = true;
        assertAssume[allAny](() => { /* do nothing */ });
        expect(passed).toBeFalsy();
    });

    it(`executes all failing nested ${kind}s`, () => {
        const lines = new Set();
        assertAssume.onExecutedAssertion = (line) => lines.add(line);
        assertAssume.onExecutedAssumption = (line) => lines.add(line);
        expect(() => assertAssume[allAny](
            () => {
                assertAssume.line = 1;
                assertAssume.fail();
            },
            () => {
                assertAssume.line = 2;
                assertAssume.fail();
            },
            () => {
                assertAssume.line = 3;
                assertAssume.fail();
            }
        )).toThrow(AssertAssumeError);
        expect(lines).toStrictEqual(new Set([1, 2, 3]));
    });

    it(`passes if all nested ${kind}s pass`, () => {
        expect(() => assertAssume[allAny](
            () => assertAssume.isTrue(true),
            () => assertAssume.equal(1, 1)
        )).not.toThrow();
    });

    it(`re-throws a non-${AssertAssumeError.name} and stops immediately`, () => {
        const lines = new Set();
        expect(() => assertAssume[allAny](
            () => {
                lines.add(1);
                throw new Error("The test has an error");
            },
            () => {
                lines.add(2);
            }
        )).toThrowError(new Error("The test has an error"));
        expect(lines).toStrictEqual(new Set([1]));
    });

    it(`collects all ${AssertAssumeError.name}s of nested ${kind}s`, () => {
        expect(() => assertAssume[allAny](
            () => {
                assertAssume.line = 1;
                assertAssume.isTrue(false);
            },
            () => {
                assertAssume.line = 3;
                assertAssume.less(2, 1);
            }
        )).toThrowError(new AssertAssumeError({
            operator: "all",
            expected: [],
            actual: [
                new AssertAssumeError({
                    operator: "ok",
                    expected: true,
                    actual: false,
                    message: ""
                }),
                new AssertAssumeError({
                    operator: "less",
                    expected: 1,
                    actual: 2,
                    message: ""
                })
            ],
            message: ". "
        }));
    });
});

describe.each([
    ["assertion", t.assert, t.AssertionError],
    ["assumption", t.assume, t.AssumptionError]
])('The "each" %s', (kind, a, E) => {
    beforeEach(() => {
        a.onPassedAssertion = null;
        a.onExecutedAssertion = null;
        a.onPassedAssumption = null;
        a.onExecutedAssumption = null;
    });

    it(`only notifies about the executed callback ${kind}`, () => {
        const executed = [];
        a.onExecutedAssertion = (line) => executed.push(line);
        a.onExecutedAssumption = (line) => executed.push(line);
        a.line = 1;
        a.each([1, 2, 3], (i) => {
            a.line = 2;
            a.ok(true);
        });
        expect(executed).toStrictEqual([2, 2, 2]);
    });

    it(`only notifies about a passing callback ${kind}`, () => {
        const passed = [];
        a.onPassedAssertion = (line) => passed.push(line);
        a.onPassedAssumption = (line) => passed.push(line);
        a.line = 1;
        try {
            a.each([1, 2, 1, 2], (i) => {
                a.line = 2;
                a.equal(i, 2);
            });
        } catch (_e) {
            // ignored
        }
        expect(passed).toStrictEqual([2, 2]);
    });

    it("does not notify about its own execution", () => {
        let executed = false;
        a.onPassedAssertion = () => executed = true;
        a.onPassedAssumption = () => executed = true;
        a.each([], () => a.ok(true));
        expect(executed).toBeFalsy();
    });

    it("does not notify about its own status", () => {
        let passed = false;
        a.onPassedAssertion = () => passed = true;
        a.onPassedAssumption = () => passed = true;
        a.each([], () => a.ok(true));
        expect(passed).toBeFalsy();
    });

    it(`executes the callback ${kind} for all elements`, () => {
        const lines = [];
        a.onExecutedAssertion = (line) => lines.push(line);
        a.onExecutedAssumption = (line) => lines.push(line);
        expect(() => a.each([1, 2, 3], (i) => {
            a.line = 2;
            a.equal(i, 2);
        })).toThrow(E);
        expect(lines).toStrictEqual([2, 2, 2]);
    });

    it(`passes if the callback ${kind} passes for all elements`, () => {
        expect(() => a.each([1, 2, 3], () => a.ok(true))).not.toThrow();
    });

    it(`re-throws a non-${E.name} and stops immediately`, () => {
        const elems = [];
        expect(() => a.each([1, 2, 3], (i) => {
            if (i === 3) {
                throw new Error("The test has an error");
            }

            elems.push(i);
        })).toThrowError(new Error("The test has an error"));
        expect(elems).toStrictEqual([1, 2]);
    });

    it(`collects all ${E.name}s the callback ${kind} produced`, () => {
        expect(() =>
            a.each([1, 2, 3], (i) => a.equal(i, 2, `${i} should have been 2`))
        ).toThrowError(new E({
            operator: "all",
            expected: [],
            actual: [
                new E({
                    operator: "equal",
                    expected: 2,
                    actual: 1,
                    message: "1 should have been 2"
                }),
                new E({
                    operator: "equal",
                    expected: 2,
                    actual: 3,
                    message: "3 should have been 2"
                })
            ],
            message: "1 should have been 2. 3 should have been 2"
        }));
    });

    it("passes when there are no iterables", () => {
        expect(() => a.each([], () => a.fail())).not.toThrow();
    });

    it(`fails when the callback ${E.name} fails for one element`, () => {
        expect(() => a.each([1, 2, 3, 4], (i) => a.equal(i, 4))).toThrowError(E);
    });
});

describe.each([
    ["assertion", t.assert, t.AssertionError],
    ["assumption", t.assume, t.AssumptionError]
])('The "all" %s', (kind, assertAssume, AssertAssumeError) => {
    beforeEach(() => {
        assertAssume.onPassedAssertion = null;
        assertAssume.onExecutedAssertion = null;
        assertAssume.onPassedAssumption = null;
        assertAssume.onExecutedAssumption = null;
    });

    // Neutral element: pass. Analogous to boolean "and" having neutral element "true".
    it(`passes when there are no nested ${kind}s`, () => {
        expect(() => assertAssume.all()).not.toThrow();
    });

    it(`fails when a nested ${kind} fails`, () => {
        expect(() =>
            assertAssume.all(
                () => assertAssume.isTrue(true),
                () => assertAssume.isFalse(true),
            )
        ).toThrowError(AssertAssumeError);
    });
});

describe.each([
    ["assertion", t.assert, t.AssertionError],
    ["assumption", t.assume, t.AssumptionError]
])('The "any" %s', (kind, assertAssume, AssertAssumeError) => {
    beforeEach(() => {
        assertAssume.onPassedAssertion = null;
        assertAssume.onExecutedAssertion = null;
        assertAssume.onPassedAssumption = null;
        assertAssume.onExecutedAssumption = null;
    });

    // Neutral element: fail. Analogous to boolean "or" having neutral element "false".
    it(`fails when there are no nested ${kind}s`, () => {
        expect(() => assertAssume.any()).toThrow(new AssertAssumeError({
            operator: "any",
            actual: [],
            expected: [],
            message: ""
        }));
    });

    it(`passes when one nested ${kind} passes`, () => {
        expect(() =>
            assertAssume.any(
                () => assertAssume.isTrue(true),
                () => assertAssume.isFalse(true),
            )
        ).not.toThrowError(AssertAssumeError);
    });
});
