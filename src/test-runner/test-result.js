class TestResult {
    constructor (test) {

        /**
         * @type {Test}
         */
        this.test = test;

        /**
         * @type {?string}
         */
        this.status = null;

        /**
         * @type {?string}
         */
        this.error = null;

        /**
         * @type {any[]}
         */
        this.log = [];
    }
}

module.exports = TestResult;
