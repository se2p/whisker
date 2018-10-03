const assert = require('assert');

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {number} message .
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
 * @param {number} message .
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
 * @param {number} message .
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
 * @param {number} message .
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
