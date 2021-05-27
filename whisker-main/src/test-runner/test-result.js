class TestResult {
    /**
     * @param {Test} test .
     */
    constructor (test) {

        /**
         * @type {Test} .
         */
        this.test = test;

        /**
         * @type {?string}
         */
        this.status = null;

        /**
         * @type {?Error}
         */
        this.error = null;

        /**
         * @type {any[]}
         */
        this.log = [];

        /**
         * @type {ModelResult}
         */
        this.modelResult = null;
    }
}

class ModelResult {
    constructor() {
        /**
         * @type {?string}
         */
        this.status = null;

        /**
         * @type {string[]}
         */
        this.errors = [];

        /**
         * type {[key:string]:number}
         */
        this.coverage = {};

        /**
         * @type {any[]}
         */
        this.log = [];

        /**
         * @type {string[]}
         */
        this.edgeTrace = []

        /**
         * States of the variables
         * @type {string[]}
         */
        this.state = [];
    }

    /**
     * @param {string} error
     */
    addError(error) {
        if (this.errors.indexOf(error) === -1) {
            this.errors.push(error);
        }
    }
}

module.exports = {TestResult, ModelResult};
