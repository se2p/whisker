const defaults = require('lodash.defaults');

class Test {
    constructor (props) {
        if (!props.test && props instanceof Function) {
            props = {
                test: props,
                name: props.name
            };
        }

        defaults(this, props, {
            name: null,
            description: null,
            categories: [],
            skip: false,
            type: null, // 'Whisker' || null => Whisker test, 'BBT' => Block-Based test

            test: () => { /* do nothing */ }, // Whisker tests contain a function that describes the actual test

            // Block-Based tests contain the Scratch hat block ID
            // and the Scratch target ID it refers to
            hatBlockId: null,
            containingSpriteId: null
        });
    }

    /**
     * @returns {string} .
     */
    static get PASS () {
        return 'pass';
    }

    /**
     * @returns {string} .
     */
    static get FAIL () {
        return 'fail';
    }

    /**
     * @returns {string} .
     */
    static get TIMEOUT () {
        return 'timeout';
    }

    /**
     * @returns {string} .
     */
    static get ERROR () {
        return 'error';
    }

    /**
     * @returns {string} .
     */
    static get SKIP () {
        return 'skip';
    }
}

module.exports = Test;
