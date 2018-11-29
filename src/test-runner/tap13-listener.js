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
        this._onRunCancel = this.onRunCancel.bind(this);

        testRunner.on(TestRunner.RUN_START, this._onRunStart);
        testRunner.on(TestRunner.RUN_CANCEL, this._onRunCancel);
        testRunner.on(TestRunner.TEST_PASS, this._onTestDone);
        testRunner.on(TestRunner.TEST_FAIL, this._onTestDone);
        testRunner.on(TestRunner.TEST_ERROR, this._onTestDone);
        testRunner.on(TestRunner.TEST_SKIP, this._onTestDone);
    }

    unregister () {
        this.testRunner.off(TestRunner.RUN_START, this._onRunStart);
        this.testRunner.off(TestRunner.RUN_CANCEL, this._onRunCancel);
        this.testRunner.off(TestRunner.TEST_PASS, this._onTestDone);
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

        if (result.coverage) {
            yamlOutput.coverage = TAP13Listener.formatCoverage(result.coverage);
        }

        const output = [`${success ? 'ok' : 'not ok'} ${testIndex}${testName}`];
        if (Object.keys(yamlOutput).length) {
            output.push(TAP13Listener.descriptionToYAML(yamlOutput));
        }

        this.print(output.join('\n'));
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
     * @param {object} description .
     * @return {string} .
     */
    static descriptionToYAML (description) {
        return [
            '  ---',
            yaml.safeDump(description)
                .trim()
                .replace(/^/mg, '  '),
            '  ...'
        ].join('\n');
    }

    /**
     * @param {object} extra .
     * @return {string} .
     */
    static extraToYAML (extra) {
        return yaml.safeDump(extra)
            .trim()
            .replace(/^/mg, '# ');
    }

    /**
     * @param {TestResult[]} summary .
     * @return {object} .
     */
    static formatSummary (summary) {
        const tests = summary.length;
        const pass = summary.filter(result => result.status === Test.PASS).length;
        const fail = summary.filter(result => result.status === Test.FAIL).length;
        const error = summary.filter(result => result.status === Test.ERROR).length;
        const skip = summary.filter(result => result.status === Test.SKIP).length;

        return {
            tests,
            pass,
            fail,
            error,
            skip
        };
    }

    /**
     * @param {object} coverage .
     * @return {object} .
     */
    static formatCoverage (coverage) {
        const individualCoverage = coverage.getCoveragePerSprite();
        const combinedCoverage = coverage.getCoverage();

        const individualCoverageObj = {};
        for (const [spriteName, coverageRecord] of individualCoverage) {
            individualCoverageObj[spriteName] = TAP13Listener.formatCoverageRecord(coverageRecord);
        }

        return {
            combined: TAP13Listener.formatCoverageRecord(combinedCoverage),
            individual: individualCoverageObj
        };
    }

    /**
     * @param {object} coverageRecord .
     * @return {string} .
     */
    static formatCoverageRecord (coverageRecord) {
        const {covered, total} = coverageRecord;
        let percentage;
        if (total === 0) {
            percentage = NaN;
        } else {
            percentage = (covered / total).toFixed(2);
        }
        return `${percentage} (${covered}/${total})`;
    }
}

module.exports = TAP13Listener;
