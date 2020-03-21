const EventEmitter = require('events');
const Test = require('./test');
const TestResult = require('./test-result');
const WhiskerUtil = require('../test/whisker-util');
const {assert, assume} = require('./assert');
const {isAssertionError, isAssumptionError} = require('../util/is-error');

class TestRunner extends EventEmitter {

    /**
     * @param {VirtualMachine} vm .
     * @param {string} project .
     * @param {Test[]} tests .
     * @param {{extend: object}=} props .
     * @param {object} wrapperOptions
     * @param {CoverageGenerator} CoverageGenerator
     * @returns {Promise<Array>} .
     */
    async runTests (vm, project, tests, props, wrapperOptions, CoverageGenerator) {
        if (typeof props === 'undefined' || props === null) {
            props = {extend: {}};
        } else if (!props.hasOwnProperty('extend')) {
            props.extend = {};
        }

        const results = [];

        this.emit(TestRunner.RUN_START, tests);

        const benchmarkRecorder = new Map();

        for (const test of tests) {
            let result;

            const start = window.performance.now();

            if (test.skip) {
                result = new TestResult(test);
                result.status = Test.SKIP;
                this.emit(TestRunner.TEST_SKIP, result);

            } else {
                result = await this._executeTest(vm, project, test, props, wrapperOptions, CoverageGenerator);
                switch (result.status) {
                case Test.PASS: this.emit(TestRunner.TEST_PASS, result); break;
                case Test.FAIL: this.emit(TestRunner.TEST_FAIL, result); break;
                case Test.ERROR: this.emit(TestRunner.TEST_ERROR, result); break;
                case Test.SKIP: this.emit(TestRunner.TEST_SKIP, result); break;
                }
            }

            // record the end time
            const end = window.performance.now();

            // store the difference between start and end time of the test mapped by
            // the test name
            benchmarkRecorder.set(test.name, end - start);

            results.push(result);
        }

        // generate and download the CSV with a test name to duration mapping
        // this.downloadBenchmarkRecorderContentAsCSV(benchmarkRecorder);

        this.emit(TestRunner.RUN_END, results);
        return results;
    }

    downloadBenchmarkRecorderContentAsCSV (benchmarkRecorder) {
        const data = Array.from(benchmarkRecorder)
            .map(e => e.join(','))
            .join('\n');
        const CSV = `data:text/csv;charset=utf-8,Test,Duration\n${data}`;
        const encodedUri = encodeURI(CSV);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${new Date()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    }

    /**
     * @param {Array.<(object|Function)>} tests .
     * @returns {Test[]} .
     */
    static convertTests (tests) {
        return tests.map(test => new Test(test));
    }

    /**
     * @param {VirtualMachine} vm .
     * @param {string} project .
     * @param {Test} test .
     * @param {{extend: object}} props .
     * @param {object} wrapperOptions
     * @param {CoverageGenerator} CoverageGenerator
     *
     * @returns {Promise<TestResult>} .
     * @private
     */
    async _executeTest (vm, project, test, props, wrapperOptions, CoverageGenerator) {
        const result = new TestResult(test);

        const util = new WhiskerUtil(vm, project, wrapperOptions);
        await util.prepare();

        const testDriver = util.getTestDriver(
            {
                extend: {
                    assert: assert,
                    assume: assume,
                    log: message => {
                        this._log(test, message);
                        result.log.push(message);
                    },
                    ...props.extend
                }
            },
            CoverageGenerator,
            message => this._log(test, message),
        );

        this.emit(TestRunner.TEST_START, test);

        util.start();

        try {
            await test.test(testDriver);
            result.status = Test.PASS;

        } catch (e) {
            result.error = e;

            if (isAssertionError(e)) {
                result.status = Test.FAIL;
            } else if (isAssumptionError(e)) {
                result.status = Test.SKIP;
            } else {
                result.status = Test.ERROR;
            }

        } finally {
            util.end();
        }

        return result;
    }

    /**
     * @param {Test} test .
     * @param {string} message .
     * @private
     */
    _log (test, message) {
        this.emit(TestRunner.TEST_LOG, test, message);
    }

    /**
     * @returns {string} .
     */
    static get RUN_START () {
        return 'runStart';
    }

    /**
     * @returns {string} .
     */
    static get RUN_END () {
        return 'runEnd';
    }

    /**
     * @returns {string} .
     */
    static get RUN_CANCEL () {
        return 'runCancel';
    }

    /**
     * @returns {string} .
     */
    static get TEST_START () {
        return 'testStart';
    }

    /**
     * @returns {string} .
     */
    static get TEST_PASS () {
        return 'testPass';
    }

    /**
     * @returns {string} .
     */
    static get TEST_FAIL () {
        return 'testFail';
    }

    /**
     * @returns {string} .
     */
    static get TEST_ERROR () {
        return 'testError';
    }

    /**
     * @returns {string} .
     */
    static get TEST_SKIP () {
        return 'testSkip';
    }

    /**
     * @returns {string} .
     */
    static get TEST_LOG () {
        return 'testLog';
    }
}

module.exports = TestRunner;
