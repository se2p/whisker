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
         * @type {{checkId: string, errorText: string}}
         */
        this.errors = {};

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

        this.hasErrors = false;
    }

    /**
     * @param {Check} check
     * @param {string} error
     */
    addError(check, error) {
        if (this.errors[check.id] === undefined) {
            this.errors[check.id] = error;
            this.hasErrors = true;
        }
    }
}

module.exports = {TestResult, ModelResult};
