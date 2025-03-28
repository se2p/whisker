const {AssertionError} = require('assert');
const CoverageGenerator = require("../coverage/coverage");

class AssumptionError extends AssertionError {
    constructor(props) {
        super(props);
        this.name = 'AssumptionError';
    }
}

/**
 * Constructs an assertion message from varargs message parts.
 * Is used to construct assertion messages lazily, i.e. only when the assertion fails.
 * @param {*[]} message The message parts.
 * @return {string} The constructed message. If the message parts are empty, undefined is returned.
 */
function getMessage(message) {
    /* Got the idea from github.com/bahmutov/lazy-ass. */
    if (message.length) {
        return message.join(' ');
    }

    return '';
}

let lastCoveredBlocks = new Set();

function getCoveredBlocks() {
    const coveredBlocks = CoverageGenerator.getCoveredBlockIdsPerAssertion();

    if (coveredBlocks.size === 0) {
        // No new blocks covered since the previous assertion ran -> probably, the VM hasn't taken any new steps yet,
        // e.g., due to assertions in consecutive lines in the test -> return coverage of previous assertion
        return new Set(lastCoveredBlocks);
    }

    lastCoveredBlocks = new Set(coveredBlocks);
    CoverageGenerator.clearCoveragePerAssertion();
    return coveredBlocks;
}

const assert = new class {

    constructor() {

        /**
         * The line number of the last executed assertion in the Whisker test suite, or `-1` if nothing has been
         * executed yet.
         *
         * Note for Whisker developers: This feature assumes you are running Whisker test suites that have been
         * instrumented to record line coverage. To this, every line in your test suite that contains `t.assert` should
         * be prefixed with `t.assert.line = xxx` where `xxx` is the current line number in your test suite.
         *
         * @type {number}
         */
        this.line = -1;

        /**
         * A callback to execute immediately before an assertion is executed. Use `null` to disable.
         *
         * @type {OnExecutedAssertionCallback | null}
         */
        this.onExecutedAssertion = null;

        /**
         * A callback to execute immediately after an assertion passed.
         *
         * @type {OnPassedAssertionCallback | null}
         */
        this.onPassedAssertion = null;
    }

    _notifyAssertionExecuted() {
        if (typeof this.onExecutedAssertion === "function") {
            this.onExecutedAssertion(this.line, getCoveredBlocks(), CoverageGenerator.getCoveredBlockIdsPerTest());
        }
    }

    _notifyAssertionPassed() {
        if (typeof this.onPassedAssertion === "function") {
            this.onPassedAssertion(this.line);
        }
    }

    /**
     * Asserts that the given condition is truthy. Type coercion applies and may lead to surprising results.
     * @param {boolean} condition .
     * @param {...*} message .
     * @deprecated Please use `assert.isTrue` or `assert.isNotEmpty` instead
     */
    ok(condition, ...message) {
        this._notifyAssertionExecuted();

        if (!condition) {
            throw new AssertionError({
                message: getMessage(message),
                actual: condition,
                expected: true,
                operator: 'ok'
            });
        }

        this._notifyAssertionPassed();
    }

    /**
     * Asserts that the given condition is `true`.
     * @param condition
     * @param message
     */
    isTrue(condition, ...message) {
        this._notifyAssertionExecuted();

        const options = {
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'isTrue'
        };

        if (typeof condition !== 'boolean') {
            throw new AssertionError({
                ...options,
                message: `TypeError: "${condition}" is not a boolean`,
            });
        }

        if (!condition) {
            throw new AssertionError(options);
        }

        this._notifyAssertionPassed();
    }

    /**
     * Asserts that the given condition is falsy. Type coercion applies and may lead to surprising results.
     * @param {boolean} condition .
     * @param {...*} message .
     * @deprecated Please use `assert.isFalse` or `assert.isEmpty`  instead
     */
    not(condition, ...message) {
        this._notifyAssertionExecuted();

        if (condition) {
            throw new AssertionError({
                message: getMessage(message),
                actual: condition,
                expected: false,
                operator: 'not'
            });
        }

        this._notifyAssertionPassed();
    }

    /**
     * Asserts that the given condition is `false`.
     * @param condition
     * @param message
     */
    isFalse(condition, ...message) {
        this._notifyAssertionExecuted();

        const options = {
            message: getMessage(message),
            actual: true,
            expected: false,
            operator: 'isFalse'
        };

        if (typeof condition !== 'boolean') {
            throw new AssertionError({
                ...options,
                message: `TypeError: "${condition}" is not a boolean`,
            });
        }

        if (condition) {
            throw new AssertionError(options);
        }

        this._notifyAssertionPassed();
    }

    /**
     * @param {...*} message .
     */
    fail(...message) {
        this._notifyAssertionExecuted();

        throw new AssertionError({
            message: getMessage(message),
            actual: null,
            expected: null,
            operator: 'fail'
        });
    }

    /** Asserts that the actual value loosely equals the expected value.
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    equal(actual, expected, ...message) {
        this._notifyAssertionExecuted();

        /* eslint-disable-next-line eqeqeq */
        if (!(actual == expected)) {
            throw new AssertionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '=='
            });
        }

        this._notifyAssertionPassed();
    }


    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    unequal(actual, expected, ...message) {
        this._notifyAssertionExecuted();

        /* eslint-disable-next-line eqeqeq */
        if ((actual == expected)) {
            throw new AssertionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '!='
            });
        }

        this._notifyAssertionPassed();
    }

    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    equalDictionaries(actual, expected, ...message) {
        this._notifyAssertionExecuted();

        if (!(JSON.stringify(actual) === JSON.stringify(expected))) {
            throw new AssertionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '=='
            });
        }

        this._notifyAssertionPassed();
    }

    /**
     * Asserts that the actual value strictly equals the expected value.
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    strictEqual(actual, expected, ...message) {
        this._notifyAssertionExecuted();

        if (!(actual === expected)) {
            throw new AssertionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '==='
            });
        }

        this._notifyAssertionPassed();
    }

    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    strictUnequal(actual, expected, ...message) {
        this._notifyAssertionExecuted();
        /* eslint-disable-next-line eqeqeq */
        if ((actual === expected)) {
            throw new AssertionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '!=='
            });
        }

        this._notifyAssertionPassed();
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    greater(actual, expected, ...message) {
        this._notifyAssertionExecuted();

        const options = {
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '>'
        };

        const actualNumber = Number(actual);

        if (Number.isNaN(actualNumber)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Actual value "${actual}" is not a number`,
            });
        }

        const expectedNumber = Number(expected);

        if (Number.isNaN(expectedNumber)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Expected value "${expected}" is not a number`,
            });
        }

        if (!(actualNumber > expectedNumber)) {
            throw new AssertionError(options);
        }

        this._notifyAssertionPassed();
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    greaterOrEqual(actual, expected, ...message) {
        this._notifyAssertionExecuted();

        const options = {
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '>='
        };

        const actualNumber = Number(actual);

        if (Number.isNaN(actualNumber)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Actual value "${actual}" is not a number`,
            });
        }

        const expectedNumber = Number(expected);

        if (Number.isNaN(expectedNumber)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Expected value "${expected}" is not a number`,
            });
        }

        if (!(actualNumber >= expectedNumber)) {
            throw new AssertionError(options);
        }

        this._notifyAssertionPassed();
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    less(actual, expected, ...message) {
        this._notifyAssertionExecuted();

        const options = {
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '<'
        };

        const actualNumber = Number(actual);

        if (Number.isNaN(actualNumber)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Actual value "${actual}" is not a number`,
            });
        }

        const expectedNumber = Number(expected);

        if (Number.isNaN(expectedNumber)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Expected value "${expected}" is not a number`,
            });
        }

        if (!(actualNumber < expectedNumber)) {
            throw new AssertionError(options);
        }

        this._notifyAssertionPassed();
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    lessOrEqual(actual, expected, ...message) {
        this._notifyAssertionExecuted();

        const options = {
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '<='
        };

        const actualNumber = Number(actual);

        if (Number.isNaN(actualNumber)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Actual value "${actual}" is not a number`,
            });
        }

        const expectedNumber = Number(expected);

        if (Number.isNaN(expectedNumber)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Expected value "${expected}" is not a number`
            });
        }

        if (!(actualNumber <= expectedNumber)) {
            throw new AssertionError(options);
        }

        this._notifyAssertionPassed();
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {number} delta .
     * @param {...*} message .
     */
    withinRange(actual, expected, delta = 0, ...message) {
        this._notifyAssertionExecuted();

        const options = {
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: `withinRange`
        };

        const actualNumber = Number(actual);

        if (Number.isNaN(actualNumber)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Actual value "${actual}" is not a number`,
            });
        }

        const expectedNumber = Number(expected);

        if (Number.isNaN(expectedNumber)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Expected value "${expected}" is not a number`
            });
        }

        const deltaNumber = Number(delta);

        if (Number.isNaN(deltaNumber)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Delta "${delta}" is not a number`
            });
        }

        const lowerBound = expectedNumber - deltaNumber;
        const upperBound = expectedNumber + deltaNumber;

        if (!(actualNumber >= lowerBound && actualNumber <= upperBound)) {
            throw new AssertionError(options);
        }

        this._notifyAssertionPassed();
    }

    /**
     * @param {string} actual .
     * @param {RegExp} expected .
     * @param {...*} message .
     */
    matches(actual, expected, ...message) {
        this._notifyAssertionExecuted();

        const options = {
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: 'match'
        };

        if (typeof actual !== 'string') {
            throw new AssertionError({
                ...options,
                message: `TypeError: Actual value "${actual}" is not a string`
            });
        }

        if (!(typeof expected === 'string' || expected instanceof RegExp)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: Expected value "${expected}" is not a string or regular expression`,
            });
        }

        if (!(actual.match(expected))) {
            throw new AssertionError(options);
        }

        this._notifyAssertionPassed();
    }

    isEmpty(arrayOrString, ...message) {
        this._notifyAssertionExecuted();

        const options = {
            message: getMessage(message),
            actual: arrayOrString.length,
            expected: 0,
            operator: 'isEmpty'
        };

        if (!("length" in arrayOrString)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: "${arrayOrString}" is not an array or a string`
            });
        }

        if (arrayOrString.length !== 0) {
            throw new AssertionError(options);
        }

        this._notifyAssertionPassed();
    }

    isNotEmpty(arrayOrString, ...message) {
        this._notifyAssertionExecuted();

        const options = {
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'isNotEmpty'
        };

        if (!("length" in arrayOrString)) {
            throw new AssertionError({
                ...options,
                message: `TypeError: "${arrayOrString}" is not an array or a string`
            });
        }

        if (arrayOrString.length === 0) {
            throw new AssertionError(options);
        }

        this._notifyAssertionPassed();
    }

    /**
     * Asserts that all supplied assertions pass. Fails if at least one supplied assertion fails. In this case, throws
     * an `AssertionError` that wraps the `AssertionError`s of the failed supplied assertions.
     *
     * Using `all` may be preferable over other assertions with complex boolean conditions, as it can allow for more
     * detailed feedback about the failure.
     *
     * @example Assertion with complex boolean conditions
     * t.assert.ok(true && 1 === 1 && !false);
     *
     * @example Equivalent `all` assertion
     * t.assert.all(
     *     () => t.assert.ok(true),
     *     () => t.assert.equals(1, 1),
     *     () => t.assert.not(false),
     * );
     *
     * @param assertions The assertions of which all must pass
     */
    all(...assertions) {
        const errors = [];

        for (const assertion of assertions) {
            try {
                assertion();
            } catch (e) {
                if (e instanceof AssertionError) {
                    errors.push(e);
                } else {
                    throw e;
                }
            }
        }

        if (errors.length > 0) {
            throw new AssertionError({
                operator: 'all',
                expected: [],
                actual: errors,
                message: errors.map((e) => e.message).join('. '),
            });
        }
    }

    /**
     * Asserts that at least one supplied assertions passes. Fails if no assertions pass. In this case, throws an
     * `AssertionError` that wraps the `AssertionError`s of the failed supplied assertions.
     *
     * Using `any` may be preferable over other assertions with complex boolean conditions, as it can allow for more
     * detailed feedback about the failure.
     *
     * @example Assertion with complex boolean conditions
     * t.assert.ok(true || 1 === 1 || !false);
     *
     * @example Equivalent `all` assertion
     * t.assert.any(
     *     () => t.assert.ok(true),
     *     () => t.assert.equals(1, 1),
     *     () => t.assert.not(false),
     * );
     *
     * @param assertions The assertions of which at least one must pass
     */
    any(...assertions) {
        const errors = [];

        for (const assertion of assertions) {
            try {
                assertion();
            } catch (e) {
                if (e instanceof AssertionError) {
                    errors.push(e);
                } else {
                    throw e;
                }
            }
        }

        if (errors.length === assertions.length) {
            throw new AssertionError({
                operator: 'any',
                expected: [],
                actual: errors,
                message: errors.map((e) => e.message).join('. '),
            });
        }
    }

    /**
     * Asserts that every element in the given iterable passes the supplied assertion. Fails if at least one element
     * fails the supplied assertion. In this case, throws an `AssertionError` that wraps the `AssertionError`s of all
     * elements that failed the supplied assertion.
     *
     * Using `each` may be preferable over other assertions with complex boolean conditions or loops, as it can allow
     * for more detailed feedback about the failure.
     *
     * @example Using a `for`-loop to check an assertion for each element
     * for (const sprite of t.getSprites()) {
     *     t.assert.equals(sprite.x, 42);
     * }
     *
     * @example Equivalent `each` assertion
     * t.assert.each(t.getSprites(), (sprite) =>
     *     t.assert.equals(sprite.x, 42)
     * );
     *
     * @param iterable The elements to check
     * @param assertion The assertion that must hold for every element
     */
    each(iterable, assertion) {
        const errors = [];

        for (const elem of iterable) {
            try {
                assertion(elem);
            } catch (e) {
                if (e instanceof AssertionError) {
                    errors.push(e);
                } else {
                    throw e;
                }
            }
        }

        if (errors.length > 0) {
            throw new AssertionError({
                operator: 'each',
                expected: [],
                actual: errors,
                message: errors.map((e) => e.message).join('. ')
            });
        }
    }
}();

// -----------------------------------------------------------------------------

const assume = new class {

    constructor() {

        /**
         * The line number of the last executed assumption in the Whisker test suite, or `-1` if nothing has been
         * executed yet.
         *
         * Note for Whisker developers: This feature assumes you are running Whisker test suites that have been
         * instrumented to record line coverage. To this, every line in your test suite that contains `t.assume` should
         * be prefixed with `t.assume.line = xxx` where `xxx` is the current line number in your test suite.
         *
         * @type {number}
         */
        this.line = -1;

        /**
         * A callback to execute immediately before an assumption is executed. Use `null` to disable.
         *
         * @type {OnExecutedAssumptionCallback | null}
         */
        this.onExecutedAssumption = null;

        /**
         * A callback to execute immediately after an assumption passed.
         *
         * @type {OnPassedAssumptionCallback | null}
         */
        this.onPassedAssumption = null;
    }

    _notifyAssumptionExecuted() {
        if (typeof this.onExecutedAssumption === "function") {
            this.onExecutedAssumption(this.line, getCoveredBlocks(), CoverageGenerator.getCoveredBlockIdsPerTest());
        }
    }

    _notifyAssumptionPassed() {
        if (typeof this.onPassedAssumption === "function") {
            this.onPassedAssumption(this.line);
        }
    }

    /**
     * @param {boolean} condition .
     * @param {...*} message .
     * @deprecated Please use `assume.isTrue` or `assume.isNotEmpty` instead
     */
    ok(condition, ...message) {
        this._notifyAssumptionExecuted();

        if (!condition) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: condition,
                expected: true,
                operator: 'ok'
            });
        }

        this._notifyAssumptionPassed();
    }

    isTrue(condition, ...message) {
        this._notifyAssumptionExecuted();

        const options = {
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'isTrue'
        };

        if (typeof condition !== 'boolean') {
            throw new AssumptionError({
                ...options,
                message: `TypeError: "${condition}" is not a boolean`,
            });
        }

        if (!condition) {
            throw new AssumptionError(options);
        }

        this._notifyAssumptionPassed();
    }

    /**
     * @param {boolean} condition .
     * @param {...*} message .
     * @deprecated Please use `assume.isFalse` or `assume.isEmpty` instead
     */
    not(condition, ...message) {
        this._notifyAssumptionExecuted();

        if (condition) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: condition,
                expected: false,
                operator: 'not'
            });
        }

        this._notifyAssumptionPassed();
    }

    isFalse(condition, ...message) {
        this._notifyAssumptionExecuted();

        const options = {
            message: getMessage(message),
            actual: true,
            expected: false,
            operator: 'isFalse'
        };

        if (typeof condition !== 'boolean') {
            throw new AssumptionError({
                ...options,
                message: `TypeError: "${condition}" is not a boolean`,
            });
        }

        if (condition) {
            throw new AssumptionError(options);
        }

        this._notifyAssumptionPassed();
    }

    /**
     * @param {...*} message .
     */
    fail(...message) {
        this._notifyAssumptionExecuted();

        throw new AssumptionError({
            message: getMessage(message),
            actual: null,
            expected: null,
            operator: 'fail'
        });
    }

    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    equal(actual, expected, ...message) {
        this._notifyAssumptionExecuted();

        /* eslint-disable-next-line eqeqeq */
        if (!(actual == expected)) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '=='
            });
        }

        this._notifyAssumptionPassed();
    }

    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    unequal(actual, expected, ...message) {
        this._notifyAssumptionExecuted();

        /* eslint-disable-next-line eqeqeq */
        if ((actual == expected)) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '!='
            });
        }

        this._notifyAssumptionPassed();
    }

    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    strictEqual(actual, expected, ...message) {
        this._notifyAssumptionExecuted();

        if (!(actual === expected)) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '==='
            });
        }

        this._notifyAssumptionPassed();
    }

    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    strictUnequal(actual, expected, ...message) {
        this._notifyAssumptionExecuted();

        /* eslint-disable-next-line eqeqeq */
        if ((actual === expected)) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '!=='
            });
        }

        this._notifyAssumptionPassed();
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    greater(actual, expected, ...message) {
        this._notifyAssumptionExecuted();

        const options = {
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '>'
        };

        const actualNumber = Number(actual);

        if (Number.isNaN(actualNumber)) {
            throw new AssumptionError({
                ...options,
                message: `TypeError: Actual value "${actual}" is not a number`,
            });
        }

        const expectedNumber = Number(expected);

        if (Number.isNaN(expectedNumber)) {
            throw new AssumptionError({
                ...options,
                message: `TypeError: Expected value "${expected}" is not a number`,
            });
        }

        if (!(actualNumber > expectedNumber)) {
            throw new AssumptionError(options);
        }

        this._notifyAssumptionPassed();
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    greaterOrEqual(actual, expected, ...message) {
        this._notifyAssumptionExecuted();

        const options = {
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '>='
        };

        const actualNumber = Number(actual);

        if (Number.isNaN(actualNumber)) {
            throw new AssumptionError({
                ...options,
                message: `TypeError: Actual value "${actual}" is not a number`,
            });
        }

        const expectedNumber = Number(expected);

        if (Number.isNaN(expectedNumber)) {
            throw new AssumptionError({
                ...options,
                message: `TypeError: Expected value "${expected}" is not a number`,
            });
        }

        if (!(actualNumber >= expectedNumber)) {
            throw new AssumptionError(options);
        }

        this._notifyAssumptionPassed();
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    less(actual, expected, ...message) {
        this._notifyAssumptionExecuted();

        const options = {
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '<'
        };

        const actualNumber = Number(actual);

        if (Number.isNaN(actualNumber)) {
            throw new AssumptionError({
                ...options,
                message: `TypeError: Actual value "${actual}" is not a number`,
            });
        }

        const expectedNumber = Number(expected);

        if (Number.isNaN(expectedNumber)) {
            throw new AssumptionError({
                ...options,
                message: `TypeError: Expected value "${expected}" is not a number`,
            });
        }

        if (!(actualNumber < expectedNumber)) {
            throw new AssumptionError(options);
        }

        this._notifyAssumptionPassed();
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    lessOrEqual(actual, expected, ...message) {
        this._notifyAssumptionExecuted();

        const options = {
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '<='
        };

        const actualNumber = Number(actual);

        if (Number.isNaN(actualNumber)) {
            throw new AssumptionError({
                ...options,
                message: `TypeError: Actual value "${actual}" is not a number`,
            });
        }

        const expectedNumber = Number(expected);

        if (Number.isNaN(expectedNumber)) {
            throw new AssumptionError({
                ...options,
                message: `TypeError: Expected value "${expected}" is not a number`,
            });
        }

        if (!(actualNumber <= expectedNumber)) {
            throw new AssumptionError(options);
        }

        this._notifyAssumptionPassed();
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {number} delta .
     * @param {...*} message .
     */
    withinRange(actual, expected, delta = 0, ...message) {
        this._notifyAssumptionExecuted();

        const lowerBound = expected - delta;
        const upperBound = expected + delta;
        if (!(actual >= lowerBound && actual <= upperBound)) {
            throw new AssertionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: `withinRange`
            });
        }

        this._notifyAssumptionPassed();
    }

    /**
     * @param {string} actual .
     * @param {regex} expected .
     * @param {...*} message .
     */
    matches(actual, expected, ...message) {
        this._notifyAssumptionExecuted();

        const options = {
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: 'match'
        };

        if (typeof actual !== 'string') {
            throw new AssumptionError({
                ...options,
                message: `TypeError: Actual value "${actual}" is not a string`,
            });
        }

        if (!(typeof expected === 'string' || expected instanceof RegExp)) {
            throw new AssumptionError({
                ...options,
                message: `TypeError: Expected value "${expected}" is not a string or regular expression`,
            });
        }

        if (!(actual.match(expected))) {
            throw new AssumptionError(options);
        }

        this._notifyAssumptionPassed();
    }

    isEmpty(arrayOrString, ...message) {
        this._notifyAssumptionExecuted();

        const options = {
            message: getMessage(message),
            actual: arrayOrString.length,
            expected: 0,
            operator: 'isEmpty'
        };

        if (!("length" in arrayOrString)) {
            throw new AssumptionError({
                ...options,
                message: `TypeError: "${arrayOrString}" is not an array or a string`,
            });
        }

        if (arrayOrString.length !== 0) {
            throw new AssumptionError(options);
        }

        this._notifyAssumptionPassed();
    }

    isNotEmpty(arrayOrString, ...message) {
        this._notifyAssumptionExecuted();

        const options = {
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'isNotEmpty'
        };

        if (!("length" in arrayOrString)) {
            throw new AssumptionError({
                ...options,
                message: `TypeError: "${arrayOrString}" is not an array or a string`,
            });
        }

        if (arrayOrString.length === 0) {
            throw new AssumptionError(options);
        }

        this._notifyAssumptionPassed();
    }

    /**
     * Assumes that all supplied assumptions pass. Fails if at least one supplied assumption fails. In this case, throws
     * an `AssumptionError` that wraps the `AssumptionError`s of the failed supplied assumptions.
     *
     * Using `all` may be preferable to other assumptions with complex boolean conditions, as it can allow for more
     * detailed feedback about the failure.
     *
     * @example Assumption with complex boolean conditions
     * t.assume.ok(true && 1 === 1 && !false);
     *
     * @example Equivalent `all` assumption
     * t.assume.all(
     *     () => t.assume.ok(true),
     *     () => t.assume.equals(1, 1),
     *     () => t.assume.not(false),
     * );
     *
     * @param assumptions The assumptions of which all must pass
     */
    all(...assumptions) {
        const errors = [];

        for (const assumption of assumptions) {
            try {
                assumption();
            } catch (e) {
                if (e instanceof AssumptionError) {
                    errors.push(e);
                } else {
                    throw e;
                }
            }
        }

        if (errors.length > 0) {
            throw new AssumptionError({
                operator: 'all',
                expected: [],
                actual: errors,
                message: errors.map((e) => e.message).join('. '),
            });
        }
    }

    /**
     * Assumes that at least one supplied assumption passes. Fails if no assumptions pass. In this case, throws an
     * `AssumptionError` that wraps the `AssumptionError`s of the failed supplied assumptions.
     *
     * Using `any` may be preferable over other assumptions with complex boolean conditions, as it can allow for more
     * detailed feedback about the failure.
     *
     * @example Assumption with complex boolean conditions
     * t.assume.ok(true || 1 === 1 || !false);
     *
     * @example Equivalent `all` assumption
     * t.assume.any(
     *     () => t.assume.ok(true),
     *     () => t.assume.equals(1, 1),
     *     () => t.assume.not(false),
     * );
     *
     * @param assumptions The assumptions of which at least one must pass
     */
    any(...assumptions) {
        const errors = [];

        for (const assumption of assumptions) {
            try {
                assumption();
            } catch (e) {
                if (e instanceof AssumptionError) {
                    errors.push(e);
                } else {
                    throw e;
                }
            }
        }

        if (errors.length === assumptions.length) {
            throw new AssumptionError({
                operator: 'any',
                expected: [],
                actual: errors,
                message: errors.map((e) => e.message).join('. '),
            });
        }
    }

    /**
     * Assumes that every element in the given iterable passes the supplied assumption. Fails if at least one element
     * fails the supplied assumption. In this case, throws an `AssumptionError` that wraps the `AssumptionError`s of all
     * elements that failed the supplied assumption.
     *
     * Using `each` may be preferable over other assumptions with complex boolean conditions or loops, as it can allow
     * for more detailed feedback about the failure.
     *
     * @example Using a `for`-loop to check an assumption for each element
     * for (const sprite of t.getSprites()) {
     *     t.assume.equals(sprite.x, 42);
     * }
     *
     * @example Equivalent `each` assumption
     * t.assume.each(t.getSprites(), (sprite) =>
     *     t.assume.equals(sprite.x, 42)
     * );
     *
     * @param iterable The elements to check
     * @param assumption The assumption that must hold for every element
     */
    each(iterable, assumption) {
        const errors = [];

        for (const elem of iterable) {
            try {
                assumption(elem);
            } catch (e) {
                if (e instanceof AssumptionError) {
                    errors.push(e);
                } else {
                    throw e;
                }
            }
        }

        if (errors.length > 0) {
            throw new AssumptionError({
                operator: 'each',
                expected: [],
                actual: errors,
                message: errors.map((e) => e.message).join('. ')
            });
        }
    }
}();

module.exports = {
    AssertionError,
    assert,
    AssumptionError,
    assume,
};

/**
 * A callback to execute immediately before an assertion is executed.
 *
 * @callback OnExecutedAssertionCallback
 * @param {number} line Line number of the assertion about to be executed
 * @param {Set<string>} coveredBlockIdsPerAssertion IDs of the blocks covered since the last assertion was executed
 * @param {Set<string>} coveredBlockIdsPerTest IDs of the blocks covered since the beginning of the current test
 */

/**
 * A callback to execute immediately after an assertion passed.
 *
 * @callback OnPassedAssertionCallback
 * @param {number} line Line number of the assertion that just passed.
 */

/**
 * A callback to execute immediately before an assumption is executed.
 *
 * @callback OnExecutedAssumptionCallback
 * @param {number} line Line number of the assumption about to be executed
 * @param {Set<string>} coveredBlockIdsPerAssumption IDs of the blocks covered since the last assumption was executed
 * @param {Set<string>} coveredBlockIdsPerTest IDs of the blocks covered since the beginning of the current test
 */

/**
 * A callback to execute immediately after an assumption passed.
 *
 * @callback OnPassedAssumptionCallback
 * @param {number} line Line number of the assumption that just passed.
 */
