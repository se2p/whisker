const TestRunner = require('./test-runner');
const Test = require('./test');
const {isAssertionError, isAssumptionError} = require('../util/is-error');
const yaml = require('js-yaml');
const cleanYamlObject = require('clean-yaml-object');

class TAP13Listener {
    constructor (testRunner, print) {
        /**
         * @type {TestRunner}
         */
        this.testRunner = testRunner;

        /**
         * @type {Function}
         */
        this.print = print;

        this.tests = null;

        this._onRunStart = this.onRunStart.bind(this);
        this._onTestDone = this.onTestDone.bind(this);
        this._onRunEnd = this.onRunEnd.bind(this);
        this._onRunCancel = this.onRunCancel.bind(this);

        testRunner.on(TestRunner.RUN_START, this._onRunStart);
        testRunner.on(TestRunner.RUN_END, this._onRunEnd);
        testRunner.on(TestRunner.RUN_CANCEL, this._onRunCancel);
        testRunner.on(TestRunner.TEST_SUCCESS, this._onTestDone);
        testRunner.on(TestRunner.TEST_FAIL, this._onTestDone);
        testRunner.on(TestRunner.TEST_ERROR, this._onTestDone);
        testRunner.on(TestRunner.TEST_SKIP, this._onTestDone);
    }

    unregister () {
        this.testRunner.off(TestRunner.RUN_START, this._onRunStart);
        this.testRunner.off(TestRunner.RUN_END, this._onRunEnd);
        this.testRunner.off(TestRunner.RUN_CANCEL, this._onRunCancel);
        this.testRunner.off(TestRunner.TEST_SUCCESS, this._onTestDone);
        this.testRunner.off(TestRunner.TEST_FAIL, this._onTestDone);
        this.testRunner.off(TestRunner.TEST_ERROR, this._onTestDone);
        this.testRunner.off(TestRunner.TEST_SKIP, this._onTestDone);
    }

    /**
     * @param {Test[]} tests .
     */
    onRunStart (tests) {
        this.tests = tests;
        const lastTestIndex = tests.length;
        const firstTestIndex = lastTestIndex > 0 ? 1 : 0;

        this.print(
            [
                `TAP version 13`,
                `${firstTestIndex}..${lastTestIndex}`
            ].join('\n')
        );
    }

    /**
     * @param {TestResult} result .
     */
    onTestDone (result) {
        const success = (result.status === Test.PASS);
        const testName = result.test.name ? ` - ${result.test.name}` : '';
        const testIndex = this.tests.indexOf(result.test) + 1;
        const yamlOutput = {};

        if (!success) {
            yamlOutput.severity = result.status;
        }

        if (result.error) {
            yamlOutput.error = cleanYamlObject(result.error);
            if (isAssertionError(result.error) || isAssumptionError(result.error)) {
                delete yamlOutput.error.stack;
            }
        }

        if (result.log.length) {
            yamlOutput.log = result.log;
        }

        const output = [`${success ? 'ok' : 'not ok'} ${testIndex}${testName}`];
        if (Object.keys(yamlOutput).length) {
            output.push(TAP13Listener.resultToYAML(yamlOutput));
        }

        this.print(output.join('\n'));
    }

    /**
     * @param {TestResult[]} results .
     */
    onRunEnd (results) {
        const numTests = results.length;
        const numPass = results.filter(result => result.status === Test.PASS).length;
        const numFail = results.filter(result => result.status === Test.FAIL).length;
        const numError = results.filter(result => result.status === Test.ERROR).length;
        const numSkip = results.filter(result => result.status === Test.SKIP).length;

        this.print(
            [
                `# tests: ${numTests}`,
                `# pass: ${numPass}`,
                `# fail: ${numFail}`,
                `# error: ${numError}`,
                `# skip: ${numSkip}`
            ].join('\n')
        );
    }

    /**
     * @param {string=} reason .
     */
    onRunCancel (reason) {
        if (reason) {
            this.print(`Bail out! ${reason}`);
        } else {
            this.print('Bail out!');
        }
    }

    /**
     * @param {object} result .
     * @return {string} .
     */
    static resultToYAML (result) {
        return [
            '  ---',
            yaml.safeDump(result)
                .trim()
                .replace(/^/mg, '  '),
            '  ...'
        ].join('\n');
    }
}

module.exports = TAP13Listener;
