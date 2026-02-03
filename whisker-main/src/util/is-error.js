/**
 * Checks if the given {@link Error} is an assertion error.
 * @param {Error} error The error to check.
 * @returns {boolean} If the given {@link Error} is an assertion error.
 */
const isAssertionError = function (error) {
    return (error.name.toLowerCase().includes('assert') ||
        error.constructor.name.toLowerCase().includes('assert')) &&
        (Object.prototype.hasOwnProperty.call(error, 'actual') || Object.prototype.hasOwnProperty.call(error, 'expected'));
};

/**
 * Checks if the given {@link Error} is an assumption error.
 * @param {Error} error The error to check.
 * @returns {boolean} If the given {@link Error} is an assumption error.
 */
const isAssumptionError = function (error) {
    return (error.name.toLowerCase().includes('assum') ||
        error.constructor.name.toLowerCase().includes('assum')) &&
        (Object.prototype.hasOwnProperty.call(error, 'actual') || Object.prototype.hasOwnProperty.call(error, 'expected'));
};

module.exports = {
    isAssertionError,
    isAssumptionError
};
