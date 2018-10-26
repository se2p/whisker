const assert = require('assert');

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {string=} message .
 */
assert.greater = function (actual, expected, message) {
    if (actual <= expected) {
        throw new assert.AssertionError({
            message: message,
            actual: actual,
            expected: expected,
            operator: '>'
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {string=} message .
 */
assert.greaterOrEqual = function (actual, expected, message) {
    if (actual < expected) {
        throw new assert.AssertionError({
            message: message,
            actual: actual,
            expected: expected,
            operator: '>='
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {string=} message .
 */
assert.less = function (actual, expected, message) {
    if (actual >= expected) {
        throw new assert.AssertionError({
            message: message,
            actual: actual,
            expected: expected,
            operator: '<'
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {string=} message .
 */
assert.lessOrEqual = function (actual, expected, message) {
    if (actual > expected) {
        throw new assert.AssertionError({
            message: message,
            actual: actual,
            expected: expected,
            operator: '<='
        });
    }
};

module.exports = assert;
