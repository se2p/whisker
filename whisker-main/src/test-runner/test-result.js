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
         * @type {?Error}
         */
        this.error = null;

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

}

module.exports = {TestResult, ModelResult};
