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
    }

    setCoverage (coverage) {
        this.coverage = coverage;
    }
}

module.exports = TestResult;
