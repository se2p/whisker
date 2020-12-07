const {AssertionError} = require('assert');

class AssumptionError extends AssertionError {
    constructor (props) {
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
        return message.join('');
    }
};

const assume = {};
const assert = {};

/**
 * @param {boolean} condition .
 * @param {...*} message .
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

/**
 * @param {boolean} condition .
 * @param {...*} message .
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
    /* eslint-disable-next-line eqeqeq */
    if (!(actual == expected)) {
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
 * @param {string} actual .
 * @param {regex} expected .
 * @param {...*} message .
 */
assert.matches = function (actual, expected, ...message) {
    if (!(actual.match(expected))) {
        throw new AssertionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: 'match'
        });
    }
};

// -----------------------------------------------------------------------------

/**
 * @param {boolean} condition .
 * @param {...*} message .
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

/**
 * @param {boolean} condition .
 * @param {...*} message .
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
    /* eslint-disable-next-line eqeqeq */
    if (!(actual == expected)) {
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
 * @param {string} actual .
 * @param {regex} expected .
 * @param {...*} message .
 */
assume.matches = function (actual, expected, ...message) {
    if (!(actual.match(expected))) {
        throw new AssumptionError({
            message: getMessage(message),
            actual: actual,
            expected: expected,
            operator: 'match'
        });
    }
};

module.exports = {
    AssertionError,
    assert,
    AssumptionError,
    assume
};
