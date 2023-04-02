const {AssertionError} = require('assert');

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
/* Got the idea from github.com/bahmutov/lazy-ass. */
const getMessage = function (message) {
    if (message.length) {
        return message.join(' ');
    }
};

/**
 * Returns `true` if the input is neither a number nor something that can
 * be converted a number.
 *
 * @param x the input to check
 * @return {boolean} `true` iff `x` is neither a number nor a numeric string
 */
const isNotNumeric = function (x) {
    return Number.isNaN(x);
};

const assume = {};
const assert = {};

/**
 * @param {boolean} condition .
 * @param {...*} message .
 * @deprecated Please use `assert.isTrue` or `assert.isNotEmpty` instead
 */
assert.ok = function (condition, ...message) {
    if (!condition) {
        throw new AssertionError({
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'ok'
        });
    }
};

assert.isTrue = function (condition, ...message) {
    if (typeof condition !== 'boolean') {
        throw new TypeError(`"${condition}" is not a boolean`);
    }

    if (!condition) {
        throw new AssertionError({
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'isTrue'
        });
    }
};

/**
 * @param {boolean} condition .
 * @param {...*} message .
 * @deprecated Please use `assert.isFalse` or `assert.isEmpty`  instead
 */
assert.not = function (condition, ...message) {
    if (condition) {
        throw new AssertionError({
            message: getMessage(message),
            actual: true,
            expected: false,
            operator: 'not'
        });
    }
};

assert.isFalse = function (condition, ...message) {
    if (typeof condition !== 'boolean') {
        throw new TypeError(`"${condition}" is not a boolean`);
    }

    if (condition) {
        throw new AssertionError({
            message: getMessage(message),
            actual: true,
            expected: false,
            operator: 'isFalse'
        });
    }
};

/**
 * @param {...*} message .
 */
assert.fail = function (...message) {
    throw new AssertionError({
        message: getMessage(message),
        actual: null,
        expected: null,
        operator: 'fail'
    });
};

/**
 * @param {*} actual .
 * @param {*} expected .
 * @param {...*} message .
 */
assert.equal = function (actual, expected, ...message) {

    // Translate NaN to String to avoid type problems.
    if (Number.isNaN(actual)) {
        actual = "NaN";
    }
    if (Number.isNaN(expected)) {
        expected = "NaN";
    }

    /* eslint-disable-next-line eqeqeq */
    if ((isNaN(actual) && !isNaN(expected)) || !(actual == expected)) {
        throw new AssertionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '=='
        });
    }
};

/**
 * @param {*} actual .
 * @param {*} expected .
 * @param {...*} message .
 */
assert.equalDictionaries = function (actual, expected, ...message) {
    if (!(JSON.stringify(actual) === JSON.stringify(expected))) {
        throw new AssertionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '=='
        });
    }
};

/**
 * @param {*} actual .
 * @param {*} expected .
 * @param {...*} message .
 */
assert.strictEqual = function (actual, expected, ...message) {
    if (!(actual === expected)) {
        throw new AssertionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '==='
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {...*} message .
 */
assert.greater = function (actual, expected, ...message) {
    if (isNotNumeric(actual)) {
        throw new TypeError(`Actual value "${actual}" is not a number`);
    }

    if (isNotNumeric(expected)) {
        throw new TypeError(`Expected value "${expected}" is not a number`);
    }

    if (!(actual > expected)) {
        throw new AssertionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '>'
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {...*} message .
 */
assert.greaterOrEqual = function (actual, expected, ...message) {
    if (isNotNumeric(actual)) {
        throw new TypeError(`Actual value "${actual}" is not a number`);
    }

    if (isNotNumeric(expected)) {
        throw new TypeError(`Expected value "${expected}" is not a number`);
    }

    if (!(actual >= expected)) {
        throw new AssertionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '>='
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {...*} message .
 */
assert.less = function (actual, expected, ...message) {
    if (isNotNumeric(actual)) {
        throw new TypeError(`Actual value "${actual}" is not a number`);
    }

    if (isNotNumeric(expected)) {
        throw new TypeError(`Expected value "${expected}" is not a number`);
    }

    if (!(actual < expected)) {
        throw new AssertionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '<'
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {...*} message .
 */
assert.lessOrEqual = function (actual, expected, ...message) {
    if (isNotNumeric(actual)) {
        throw new TypeError(`Actual value "${actual}" is not a number`);
    }

    if (isNotNumeric(expected)) {
        throw new TypeError(`Expected value "${expected}" is not a number`);
    }

    if (!(actual <= expected)) {
        throw new AssertionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '<='
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {number} delta .
 * @param {...*} message .
 */
assert.withinRange = function (actual, expected, delta = 0, ...message) {
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
};

/**
 * @param {string} actual .
 * @param {RegExp} expected .
 * @param {...*} message .
 */
assert.matches = function (actual, expected, ...message) {
    if (typeof actual !== 'string') {
        throw new TypeError(`Actual value "${actual}" is not a string`);
    }

    if (!(typeof expected === 'string' || expected instanceof RegExp)) {
        throw new TypeError(`Expected value "${expected}" is not a string or regular expression`);
    }

    if (!(actual.match(expected))) {
        throw new AssertionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: 'match'
        });
    }
};

assert.isEmpty = function (arrayOrString, ...message) {
    if (!("length" in arrayOrString)) {
        throw new TypeError(`"${arrayOrString}" is not an array or a string`);
    }

    if (arrayOrString.length !== 0) {
        throw new AssertionError({
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'isEmpty'
        });
    }
};

assert.isNotEmpty = function (arrayOrString, ...message) {
    if (!("length" in arrayOrString)) {
        throw new TypeError(`"${arrayOrString}" is not an array or a string`);
    }

    if (arrayOrString.length === 0) {
        throw new AssertionError({
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'isNotEmpty'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * @param {boolean} condition .
 * @param {...*} message .
 * @deprecated Please use `assume.isTrue` or `assume.isNotEmpty` instead
 */
assume.ok = function (condition, ...message) {
    if (!condition) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'ok'
        });
    }
};

assume.isTrue = function (condition, ...message) {
    if (typeof condition !== 'boolean') {
        throw new TypeError(`"${condition}" is not a boolean`);
    }

    if (!condition) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'isTrue'
        });
    }
};

/**
 * @param {boolean} condition .
 * @param {...*} message .
 * @deprecated Please use `assume.isFalse` or `assume.isEmpty` instead
 */
assume.not = function (condition, ...message) {
    if (condition) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: true,
            expected: false,
            operator: 'not'
        });
    }
};

assume.isFalse = function (condition, ...message) {
    if (typeof condition !== 'boolean') {
        throw new TypeError(`"${condition}" is not a boolean`);
    }

    if (condition) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: true,
            expected: false,
            operator: 'isFalse'
        });
    }
};

/**
 * @param {...*} message .
 */
assume.fail = function (...message) {
    throw new AssumptionError({
        message: getMessage(message),
        actual: null,
        expected: null,
        operator: 'fail'
    });
};

/**
 * @param {*} actual .
 * @param {*} expected .
 * @param {...*} message .
 */
assume.equal = function (actual, expected, ...message) {
    // Translate NaN to String to avoid type problems.
    if (Number.isNaN(actual)) {
        actual = "NaN";
    }
    if (Number.isNaN(expected)) {
        expected = "NaN";
    }

    /* eslint-disable-next-line eqeqeq */
    if ((isNaN(actual) && !isNaN(expected)) || !(actual == expected)) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '=='
        });
    }
};

/**
 * @param {*} actual .
 * @param {*} expected .
 * @param {...*} message .
 */
assume.strictEqual = function (actual, expected, ...message) {
    if (!(actual === expected)) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '==='
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {...*} message .
 */
assume.greater = function (actual, expected, ...message) {
    if (isNotNumeric(actual)) {
        throw new TypeError(`Actual value "${actual}" is not a number`);
    }

    if (isNotNumeric(expected)) {
        throw new TypeError(`Expected value "${expected}" is not a number`);
    }

    if (!(actual > expected)) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '>'
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {...*} message .
 */
assume.greaterOrEqual = function (actual, expected, ...message) {
    if (isNotNumeric(actual)) {
        throw new TypeError(`Actual value "${actual}" is not a number`);
    }

    if (isNotNumeric(expected)) {
        throw new TypeError(`Expected value "${expected}" is not a number`);
    }

    if (!(actual >= expected)) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '>='
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {...*} message .
 */
assume.less = function (actual, expected, ...message) {
    if (isNotNumeric(actual)) {
        throw new TypeError(`Actual value "${actual}" is not a number`);
    }

    if (isNotNumeric(expected)) {
        throw new TypeError(`Expected value "${expected}" is not a number`);
    }

    if (!(actual < expected)) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '<'
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {...*} message .
 */
assume.lessOrEqual = function (actual, expected, ...message) {
    if (isNotNumeric(actual)) {
        throw new TypeError(`Actual value "${actual}" is not a number`);
    }

    if (isNotNumeric(expected)) {
        throw new TypeError(`Expected value "${expected}" is not a number`);
    }

    if (!(actual <= expected)) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: '<='
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {number} delta .
 * @param {...*} message .
 */
assume.withinRange = function (actual, expected, delta = 0, ...message) {
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
};

/**
 * @param {string} actual .
 * @param {regex} expected .
 * @param {...*} message .
 */
assume.matches = function (actual, expected, ...message) {
    if (typeof actual !== 'string') {
        throw new TypeError(`Actual value "${actual}" is not a string`);
    }

    if (!(typeof expected === 'string' || expected instanceof RegExp)) {
        throw new TypeError(`Expected value "${expected}" is not a string or regular expression`);
    }

    if (!(actual.match(expected))) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: 'match'
        });
    }
};

assume.isEmpty = function (arrayOrString, ...message) {
    if (!("length" in arrayOrString)) {
        throw new TypeError(`"${arrayOrString}" is not an array or a string`);
    }

    if (arrayOrString.length !== 0) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'isEmpty'
        });
    }
};

assume.isNotEmpty = function (arrayOrString, ...message) {
    if (!("length" in arrayOrString)) {
        throw new TypeError(`"${arrayOrString}" is not an array or a string`);
    }

    if (arrayOrString.length === 0) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: false,
            expected: true,
            operator: 'isNotEmpty'
        });
    }
};

module.exports = {
    AssertionError,
    assert,
    AssumptionError,
    assume
};
