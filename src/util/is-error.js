/**
 * Checks if the given {@link Error} is an assertion error by checking if the class name includes the string 'assert'.
 * @param {Error} error The error to check.
 * @returns {boolean} If the given {@link Error} is an assertion error.
 */
const isAssertionError = function (error) {
    return error.constructor.name.toLowerCase().includes('assert');
};

/**
 * Checks if the given {@link Error} is an assumption error by checking if the class name includes the string 'assum'.
 * @param {Error} error The error to check.
 * @returns {boolean} If the given {@link Error} is an assumption error.
 */
const isAssumptionError = function (error) {
    return error.constructor.name.toLowerCase().includes('assum');
};

module.exports = {
    isAssertionError,
    isAssumptionError
};
