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

        /**
         * @type {Set<string>}
         */
        this.covered = new Set();
    }
}


module.exports = TestResult;
