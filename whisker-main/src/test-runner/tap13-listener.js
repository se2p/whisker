const TestRunner = require('./test-runner');
const Test = require('./test');
const {isAssertionError, isAssumptionError} = require('../util/is-error');
const cleanYamlObject = require('clean-yaml-object');
const TAP13Formatter = require('./tap13-formatter');
const {ModelTester} = require("../whisker/model/ModelTester");

class TAP13Listener {
    constructor(testRunner, modelTester, print) {
        /**
         * @type {TestRunner}
         */
        this.testRunner = testRunner;

        /**
         * @type {Function}
         */
        this.print = print;

        /**
         * @type {ModelTester}
         */
        this.modelTester = modelTester;

        this.tests = null;

        this._onRunStart = this.onRunStart.bind(this);
        this._onTestDone = this.onTestDone.bind(this);
        this._onModelTestDone = this.onModelTestDone.bind(this);
        this._onRunCancel = this.onRunCancel.bind(this);
        this._onMutationTesting = this.onMutationTesting.bind(this);

        testRunner.on(TestRunner.RUN_START, this._onRunStart);
        testRunner.on(TestRunner.RUN_CANCEL, this._onRunCancel);
        testRunner.on(TestRunner.TEST_PASS, this._onTestDone);
        testRunner.on(TestRunner.TEST_MODEL, this._onModelTestDone);
        testRunner.on(TestRunner.TEST_FAIL, this._onTestDone);
        testRunner.on(TestRunner.TEST_ERROR, this._onTestDone);
        testRunner.on(TestRunner.TEST_SKIP, this._onTestDone);
        testRunner.on(TestRunner.TEST_MUTATION, this._onMutationTesting);

        this._onModelLoadError = this.onModelLoadError.bind(this);
        this._onModelWarning = this.onModelWarning.bind(this);

        modelTester.on(ModelTester.MODEL_LOAD_ERROR, this._onModelLoadError);
        modelTester.on(ModelTester.MODEL_WARNING, this._onModelWarning);
    }

    unregister () {
        this.testRunner.off(TestRunner.RUN_START, this._onRunStart);
        this.testRunner.off(TestRunner.RUN_CANCEL, this._onRunCancel);
        this.testRunner.off(TestRunner.TEST_PASS, this._onTestDone);
        this.testRunner.off(TestRunner.TEST_MODEL, this._onModelTestDone);
        this.testRunner.off(TestRunner.TEST_FAIL, this._onTestDone);
        this.testRunner.off(TestRunner.TEST_ERROR, this._onTestDone);
        this.testRunner.off(TestRunner.TEST_SKIP, this._onTestDone);
        this.testRunner.off(TestRunner.TEST_MUTATION, this._onMutationTesting);
        this.modelTester.off(ModelTester.MODEL_LOAD_ERROR, this._onModelLoadError);
        this.modelTester.off(ModelTester.MODEL_WARNING, this._onModelWarning);
    }

    /**
     * @param {Test[]} tests .
     */
    onRunStart (tests) {
        if (tests) {
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
    }

    /**
     * @param {TestResult} result .
     */
    onModelTestDone(result) {
        let success = result.modelResult.errors.length === 0 && result.modelResult.fails.length === 0;
        const testIndex = result.modelResult.testNbr;
        const testName = "model-test";
        const yamlOutput = {};
        if (!success) {
            yamlOutput.severity = result.status;
        }

        if (result.modelResult.fails.length > 0) {
            yamlOutput.modelFails = result.modelResult.fails;
        }
        if (result.modelResult.errors.length > 0) {
            yamlOutput.modelErrors = result.modelResult.errors;
        }
        const output = [`${success ? 'ok' : 'not ok'} ${testName} #${testIndex} `];
        if (Object.keys(yamlOutput).length) {
            output.push(TAP13Formatter.descriptionToYAML(yamlOutput));
        }

        this.print(output.join('\n'));
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
            yamlOutput.coverage = TAP13Formatter.formatCoverage(result.coverage);
        }

        if (result.modelResult) {
            if (result.modelResult.errors.length > 0) {
                yamlOutput.modelErrors = result.modelResult.errors;
            }

            if (result.modelResult.fails.length > 0) {
                yamlOutput.modelFails = result.modelResult.fails;
            }
        }

        const output = [`${success ? 'ok' : 'not ok'} ${testIndex}${testName}`];
        if (Object.keys(yamlOutput).length) {
            output.push(TAP13Formatter.descriptionToYAML(yamlOutput));
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
     * @param {string} err
     */
    onModelLoadError(err) {
        err = "MODEL: " + err;
        this.print(TAP13Formatter.descriptionToYAML(err));
    }

    /**
     * @param {string} err
     */
    onModelWarning(err) {
        this.print(TAP13Formatter.descriptionToYAML("MODEL WARNING: \n" + err));
    }

    /**
     * @param {number} mutant
     */
    onMutationTesting(mutant){
        this.print(`\nPerforming Mutation Analysis on ${mutant}\n`);
    }
}

module.exports = TAP13Listener;
