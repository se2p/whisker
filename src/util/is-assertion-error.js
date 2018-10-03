/**
 * Checks if the given {@link Error} is an assertion error by checking if the class name includes the word 'assertion'.
 * @param {Error} error The error to check.
 * @returns {boolean} If the given {@link Error} is an assertion error.
 */
const isAssertionError = function (error) {
    return error.constructor.name.toLowerCase().includes('assert');
};

module.exports = isAssertionError;
