class MathUtil {
    /**
     * @param {number} min inclusive
     * @param {number} max inclusive
     * @return {number} .
     */
    static randomInt (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * @param {number} min inclusive
     * @param {number} max exclusive
     * @return {number} .
     */
    static randomFloat (min, max) {
        return (Math.random() * (max - min)) + min;
    }

    /**
     * @return {boolean} .
     */
    static randomBoolean () {
        return Math.random() >= 0.5;
    }
}

module.exports = MathUtil;
