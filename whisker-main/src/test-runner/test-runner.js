const EventEmitter = require('events');
const Test = require('./test');
const {TestResult} = require('./test-result');
const WhiskerUtil = require('../test/whisker-util');
const {assert, assume} = require('./assert');
const {isAssertionError, isAssumptionError} = require('../util/is-error');
const Random = require('../util/random');

class TestRunner extends EventEmitter {

    /**
     * @param {VirtualMachine} vm .
     * @param {string} project .
     * @param {Test[]} tests .
     * @param {ModelTester} modelTester
     * @param {{extend: object}=} props .
     * @param {{duration: number, repetitions: number}} modelProps
     * @returns {Promise<Array>} .
     */
    async runTests(vm, project, tests, modelTester, props, modelProps) {
        this.aborted = false;

        if (typeof props === 'undefined' || props === null) {
            props = {extend: {}};
        } else if (!props.hasOwnProperty('extend')) {
            props.extend = {};
        }

        const results = [];

        this.emit(TestRunner.RUN_START, tests);

        if (modelTester && (!tests || tests.length === 0)) {
            // test only by model

            if (!modelProps || !modelProps.repetitions) {
                modelProps.repetitions = 1;
            }

            for (let i = 0; i < modelProps.repetitions; i++) {
                results.push(await this._executeTest(vm, project, undefined, modelTester, props, modelProps));
            }
        } else {
            // test by both, tests and model
            for (const test of tests) {
                let result;

            if (test.skip) {
                result = new TestResult(test);
                result.status = Test.SKIP;
                this.emit(TestRunner.TEST_SKIP, result);

            } else {
                result = await this._executeTest(vm, project, test, modelTester, props, modelProps);
                switch (result.status) {
                case Test.PASS: this.emit(TestRunner.TEST_PASS, result); break;
                case Test.FAIL: this.emit(TestRunner.TEST_FAIL, result); break;
                case Test.ERROR: this.emit(TestRunner.TEST_ERROR, result); break;
                case Test.SKIP: this.emit(TestRunner.TEST_SKIP, result); break;
                }
            }

            results.push(result);

                if (this.aborted) {
                    return null;
                }
            }
        }

        this.emit(TestRunner.RUN_END, results);
        return results;
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
     * @param {ModelTester} modelTester
     * @param {{extend: object}} props .
     *
     * @param {duration:number,repetitions:number} modelProps
     * @returns {Promise<TestResult>} .
     * @private
     */
    async _executeTest(vm, project, test, modelTester, props,
                       modelProps) {
        const result = new TestResult(test);

        const util = new WhiskerUtil(vm, project);
        await util.prepare(props.accelerationFactor);
        this.vmWrapper = util.getVMWrapper();

        const testDriver = util.getTestDriver(
            {
                extend: {
                    assert: assert,
                    assume: assume,
                    log: message => {
                        this._log(test, message);
                        result.log.push(message);
                    },
                    getCoverage: () => {
                        const coverage = props.CoverageGenerator.getCoverage();
                        return coverage.getCoverage();
                    },
                    ...props.extend
                }
            },
        );


        this.emit(TestRunner.TEST_START, test);
        util.start();
        testDriver.seedScratch(Random.INITIAL_SEED);

        if (modelTester && modelTester.programModelsDefined()) {
            await modelTester.prepareModel(testDriver, true); // modelProps.useUserModel); // todo include in html
        }

        if (test) {
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
            }
        } else if (modelTester && modelTester.programModelsDefined()) {
            // Start the test run with either a maximal duration or until the program stops
            await testDriver.runUntil(() => {
                return !testDriver.isProjectRunning();
            }, modelProps.duration);
        }

        if (modelTester && modelTester.programModelsDefined()) {
            result.modelResult = modelTester.getModelStates(testDriver);
        }

        util.end();
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

    abort() {
        this.aborted = true;
        if (this.vmWrapper !== undefined) {
            this.vmWrapper.abort();
        }
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
