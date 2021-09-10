const seed = require('seed-random');
let random;

const INITIAL_SEED = 'whisker';

/**
 * Generates a pseudo-random integer number between two given bounds.
 * @param {number} min inclusive minimum boundary.
 * @param {number} max inclusive maximum boundary.
 * @return {number} The randomly generated integer number.
 */
const randomInt = function (min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
};

/**
 * Generates a pseudo-random float number between two given bounds.
 * @param {number} min inclusive minimum boundary.
 * @param {number} max exclusive maximum boundary.
 * @return {number} The randomly generated float number.
 */
const randomFloat = function (min, max) {
    return (random() * (max - min)) + min;
};

/**
 * Generates a pseudo-random boolean value.
 * @return {boolean} The randomly generated boolean value.
 */
const randomBoolean = function () {
    return random() >= 0.5;
};

/**
 * Sets a seed for whisker to enable reproduction of test results.
 * @param {string=} s String for seeding.
 */
const seedWhisker = function (s) {
    if (arguments.length === 0) {
        random = seed('', {entropy: true});
    } else {
        random = seed(s);
    }
};

/**
 * Sets a seed for the scratch vm to enable reproduction of scratch project execution.
 * @param {string} s String for seeding.
 */
const seedScratch = function (s) {
    if (arguments.length === 0) {
        seed('', {entropy: true, global: true});
    } else {
        seed(s, {global: true});
    }
};

seedWhisker();
seedScratch();

module.exports = {
    randomInt,
    randomFloat,
    randomBoolean,
    seedWhisker,
    seedScratch,
    INITIAL_SEED
};
