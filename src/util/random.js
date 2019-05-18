const seed = require('seed-random');
let random;

/**
 * @param {number} min inclusive
 * @param {number} max inclusive
 * @return {number} .
 */
const randomInt = function (min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
};

/**
 * @param {number} min inclusive
 * @param {number} max exclusive
 * @return {number} .
 */
const randomFloat = function (min, max) {
    return (random() * (max - min)) + min;
};

/**
 * @return {boolean} .
 */
const randomBoolean = function () {
    return random() >= 0.5;
};

/**
 * @param {string=} s .
 */
const seedWhisker = function (s) {
    if (arguments.length === 0) {
        random = seed('', {entropy: true});
    } else {
        random = seed(s);
    }
};

/**
 * @param {string} s .
 */
const seedScratch = function (s) {
    if (arguments.length === 0) {
        seed('', {entropy: true, global: true});
    } else {
        seed(s, {global: true});
    }
};

/**
 * @param {string} s .
 * @return {function} .
 */
const getRandom = function (s) {
    if (arguments.length === 0) {
        return seed('', {entropy: true});
    } else {
        return seed(s);
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
    getRandom
};
