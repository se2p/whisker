const TestRunner = require('./test-runner');
const Test = require('./test');
const isAssertionError = require('../util/is-assertion-error');
const yaml = require('js-yaml');
const cleanYamlObject = require('clean-yaml-object');

class TAP13Listener {
    constructor (print) {
        this.print = print;
        this.tests = null;
    }

    /**
     * @param {TestRunner} testRunner .
     */
    register (testRunner) {
        this._onRunStart = this.onRunStart.bind(this);
        this._onTestDone = this.onTestDone.bind(this);
        this._onRunEnd = this.onRunEnd.bind(this);

        testRunner.on(TestRunner.RUN_START, this._onRunStart);
        testRunner.on(TestRunner.TEST_SUCCESS, this._onTestDone);
        testRunner.on(TestRunner.TEST_FAIL, this._onTestDone);
        testRunner.on(TestRunner.TEST_ERROR, this._onTestDone);
        testRunner.on(TestRunner.TEST_SKIP, this._onTestDone);
        testRunner.on(TestRunner.RUN_END, this._onRunEnd);
    }

    /**
     * @param {TestRunner} testRunner .
     */
    unregister (testRunner) {
        testRunner.off(TestRunner.RUN_START, this._onRunStart);
        testRunner.off(TestRunner.TEST_SUCCESS, this._onTestDone);
        testRunner.off(TestRunner.TEST_FAIL, this._onTestDone);
        testRunner.off(TestRunner.TEST_ERROR, this._onTestDone);
        testRunner.off(TestRunner.TEST_SKIP, this._onTestDone);
        testRunner.off(TestRunner.RUN_END, this._onRunEnd);
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
        const success = (result.status === Test.SUCCESS);
        const testName = result.test.name ? ` - ${result.test.name}` : '';
        const testIndex = this.tests.indexOf(result.test) + 1;
        const yamlOutput = {};

        if (!success) {
            yamlOutput.severity = result.status;
        }
        if (result.error) {
            yamlOutput.error = cleanYamlObject(result.error);
            if (isAssertionError(result.error)) {
                delete yamlOutput.error.stack;
            } else {
                console.log(result.error);
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
        const numFail = results.filter(result => result.status === Test.FAIL).length;
        const numError = results.filter(result => result.status === Test.ERROR).length;
        const numSkip = results.filter(result => result.status === Test.SKIP).length;

        this.print(
            [
                `# tests: ${numTests}`,
                `# fail: ${numFail}`,
                `# error: ${numError}`,
                `# skip: ${numSkip}`
            ].join('\n')
        );
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
