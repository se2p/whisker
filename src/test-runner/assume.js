const {AssertionError} = require('assert');

class AssumptionError extends AssertionError {
    constructor (props) {
        super(props);
        this.name = 'AssumptionError';
    }
}

const assume = {};

/**
 * @param {boolean} condition .
 * @param {string=} message .
 */
assume.ok = function (condition, message) {
    if (!condition) {
        throw new AssumptionError({
            message: message,
            actual: false,
            expected: true,
            operator: 'ok'
        });
    }
};

assume.fail = function (message) {
    throw new AssumptionError({
        message: message,
        actual: null,
        expected: null,
        operator: 'fail'
    });
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {string=} message .
 */
assume.equal = function (actual, expected, message) {
    /* eslint-disable-next-line eqeqeq */
    if (!(actual == expected)) {
        throw new AssumptionError({
            message: message,
            actual: actual,
            expected: expected,
            operator: '=='
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {string=} message .
 */
assume.strictEqual = function (actual, expected, message) {
    if (!(actual === expected)) {
        throw new AssumptionError({
            message: message,
            actual: actual,
            expected: expected,
            operator: '==='
        });
    }
};

/**
 * @param {number} actual .
 * @param {number} expected .
 * @param {string=} message .
 */
assume.greater = function (actual, expected, message) {
    if (!(actual > expected)) {
        throw new AssumptionError({
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
assume.greaterOrEqual = function (actual, expected, message) {
    if (!(actual >= expected)) {
        throw new AssumptionError({
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
assume.less = function (actual, expected, message) {
    if (!(actual < expected)) {
        throw new AssumptionError({
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
assume.lessOrEqual = function (actual, expected, message) {
    if (!(actual <= expected)) {
        throw new AssumptionError({
            message: message,
            actual: actual,
            expected: expected,
            operator: '<='
        });
    }
};

module.exports = {
    AssumptionError,
    assume
};
