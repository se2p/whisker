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
function getMessage(message) {
    /* Got the idea from github.com/bahmutov/lazy-ass. */
    if (message.length) {
        return message.join(' ');
    }

    return '';
}

const assert = new class {

    /**
     * Asserts that the given condition is truthy. Type coercion applies and may lead to surprising results.
     * @param {boolean} condition .
     * @param {...*} message .
     * @deprecated Please use `assert.isTrue` or `assert.isNotEmpty` instead
     */
    ok(condition, ...message) {
        if (!condition) {
            throw new AssertionError({
                message: getMessage(message),
                actual: condition,
                expected: true,
                operator: 'ok'
            });
        }
    }

    /**
     * Asserts that the given condition is `true`.
     * @param condition
     * @param message
     */
    isTrue(condition, ...message) {
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
    }

    /**
     * Asserts that the given condition is falsy. Type coercion applies and may lead to surprising results.
     * @param {boolean} condition .
     * @param {...*} message .
     * @deprecated Please use `assert.isFalse` or `assert.isEmpty`  instead
     */
    not(condition, ...message) {
        if (condition) {
            throw new AssertionError({
                message: getMessage(message),
                actual: condition,
                expected: false,
                operator: 'not'
            });
        }
    }

    /**
     * Asserts that the given condition is `false`.
     * @param condition
     * @param message
     */
    isFalse(condition, ...message) {
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
    }

    /**
     * @param {...*} message .
     */
    fail(...message) {
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
    equal(actual, expected, ...message) {/* eslint-disable-next-line eqeqeq */
        if (!(actual == expected)) {
            throw new AssertionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '=='
            });
        }
    }


    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    unequal(actual, expected, ...message) {/* eslint-disable-next-line eqeqeq */
        if ((actual == expected)) {
            throw new AssertionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '!='
            });
        }
    }

    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    equalDictionaries(actual, expected, ...message) {
        if (!(JSON.stringify(actual) === JSON.stringify(expected))) {
            throw new AssertionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '=='
            });
        }
    }

    /**
     * Asserts that the actual value strictly equals the expected value.
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    strictEqual(actual, expected, ...message) {
        if (!(actual === expected)) {
            throw new AssertionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '==='
            });
        }
    }

    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    strictUnequal(actual, expected, ...message) {
        if ((actual === expected)) {
            throw new AssertionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '!=='
            });
        }
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    greater(actual, expected, ...message) {
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
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    greaterOrEqual(actual, expected, ...message) {
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
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    less(actual, expected, ...message) {
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
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    lessOrEqual(actual, expected, ...message) {
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
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {number} delta .
     * @param {...*} message .
     */
    withinRange(actual, expected, delta = 0, ...message) {
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
    }

    /**
     * @param {string} actual .
     * @param {RegExp} expected .
     * @param {...*} message .
     */
    matches(actual, expected, ...message) {
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
    }

    isEmpty(arrayOrString, ...message) {
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
    }

    isNotEmpty(arrayOrString, ...message) {
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
    }
};

// -----------------------------------------------------------------------------

const assume = new class {
    /**
     * @param {boolean} condition .
     * @param {...*} message .
     * @deprecated Please use `assume.isTrue` or `assume.isNotEmpty` instead
     */
    ok(condition, ...message) {
        if (!condition) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: condition,
                expected: true,
                operator: 'ok'
            });
        }
    }

    isTrue(condition, ...message) {
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
    }

    /**
     * @param {boolean} condition .
     * @param {...*} message .
     * @deprecated Please use `assume.isFalse` or `assume.isEmpty` instead
     */
    not(condition, ...message) {
        if (condition) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: condition,
                expected: false,
                operator: 'not'
            });
        }
    }

    isFalse(condition, ...message) {
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
    }

    /**
     * @param {...*} message .
     */
    fail(...message) {
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
    equal(actual, expected, ...message) {/* eslint-disable-next-line eqeqeq */
        if (!(actual == expected)) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '=='
            });
        }
    }

    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    unequal(actual, expected, ...message) {/* eslint-disable-next-line eqeqeq */
        if ((actual == expected)) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '!='
            });
        }
    }

    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    strictEqual(actual, expected, ...message) {
        if (!(actual === expected)) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '==='
            });
        }
    }

    /**
     * @param {*} actual .
     * @param {*} expected .
     * @param {...*} message .
     */
    strictUnequal(actual, expected, ...message) {/* eslint-disable-next-line eqeqeq */
        if ((actual === expected)) {
            throw new AssumptionError({
                message: getMessage(message),
                actual: actual,
                expected: expected,
                operator: '!=='
            });
        }
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    greater(actual, expected, ...message) {
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
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    greaterOrEqual(actual, expected, ...message) {
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
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    less(actual, expected, ...message) {
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
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {...*} message .
     */
    lessOrEqual(actual, expected, ...message) {
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
    }

    /**
     * @param {number} actual .
     * @param {number} expected .
     * @param {number} delta .
     * @param {...*} message .
     */
    withinRange(actual, expected, delta = 0, ...message) {
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
    }

    /**
     * @param {string} actual .
     * @param {regex} expected .
     * @param {...*} message .
     */
    matches(actual, expected, ...message) {
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
    }

    isEmpty(arrayOrString, ...message) {
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
    }

    isNotEmpty(arrayOrString, ...message) {
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
    }
};

module.exports = {
    AssertionError,
    assert,
    AssumptionError,
    assume,
};
