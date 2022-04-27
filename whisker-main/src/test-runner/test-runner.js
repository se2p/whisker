const EventEmitter = require('events');
const Test = require('./test');
const TestResult = require('./test-result');
const WhiskerUtil = require('../test/whisker-util');
const {assert, assume} = require('./assert');
const {isAssertionError, isAssumptionError} = require('../util/is-error');
const {Randomness} = require("../whisker/utils/Randomness");
const {MutationFactory} = require("../whisker/scratch/ScratchMutation/MutationFactory");
const CoverageGenerator = require("../coverage/coverage");

class TestRunner extends EventEmitter {

    /**
     * @param {VirtualMachine} vm .
     * @param {string} project .
     * @param {Test[]} tests .
     * @param {ModelTester} modelTester
     * @param {{extend: object}=} props .
     * @param {{duration: number, repetitions: number}} modelProps
     * @returns {Promise<[{}, {}, []]>} .
     */
    async runTests(vm, project, tests, modelTester, props, modelProps) {
        this.aborted = false;

        if (typeof props === 'undefined' || props === null) {
            props = {extend: {}};
        } else if (!('extend' in props)) {
            props.extend = {};
        }

        const projectName = props['projectName'];
        const testResults = [];
        const finalResults = {};
        let csv = this._generateCSVHeader(tests, modelProps);
        let mutantPrograms = undefined;

        this.emit(TestRunner.RUN_START, tests);

        if (props['mutators'][0] !== 'NONE') {
            // Mutation Analysis

            const mutantFactory = new MutationFactory(vm);
            mutantPrograms = mutantFactory.generateScratchMutations(props['mutators']);
            console.log(`Generated ${mutantPrograms.length} mutants`);

            // Execute the given tests on every mutant
            for (const mutant of mutantPrograms) {
                const projectMutation = `${projectName}-${mutant.name}`;
                console.log(`Analysing mutant ${projectMutation}`);
                this.emit(TestRunner.TEST_MUTATION, projectMutation);
                this.emit(TestRunner.RESET_TABLE, tests);
                const {startTime, testStatusResults, resultRecords} = this._initialiseCSVRowVariables();
                for (const test of tests) {
                    let result;

                    if (test.skip) {
                        result = new TestResult(test);
                        result.status = Test.SKIP;
                        this.emit(TestRunner.TEST_SKIP, result);

                    } else {
                        result = await this._executeTest(vm, mutant, test, modelTester, props, modelProps);
                        testStatusResults.push(result.status);
                        this._propagateTestResults(result, resultRecords);
                    }

                    testResults.push(result);

                    if (this.aborted) {
                        return null;
                    }
                }

                // Record the results
                const {covered, total} = CoverageGenerator.getCoverage().getCoverageTotal();
                const coverage = Math.round((covered / total) * 100) / 100;
                const duration = (Date.now() - startTime) / 1000;
                csv += this._generateCSVRow(projectMutation, testStatusResults, coverage, duration, resultRecords);
                finalResults[projectMutation] = JSON.parse(JSON.stringify(testResults));
                testResults.length = 0;
            }
        } else if (modelTester && (!tests || tests.length === 0)) {
            // test only by models

            if (!modelProps.repetitions) {
                modelProps.repetitions = 1;
            }
            if (!modelProps.duration) {
                modelProps.duration = 35000;
            }

            for (let i = 0; i < modelProps.repetitions; i++) {
                const startTime = Date.now();
                let result = await this._executeTest(vm, project, undefined, modelTester, props, modelProps);
                result.modelResult.testNbr = i;
                this.emit(TestRunner.TEST_MODEL, result);
                testResults.push(result);

                // Collect data for the CSV output.
                const {covered, total} = CoverageGenerator.getCoverage().getCoverageTotal();
                const coverage = Math.round((covered / total) * 100) / 100;
                const duration = (Date.now() - startTime) / 1000;
                const modelResults = this._extractModelCSVData(result.modelResult);
                csv += this._generateCSVRow(projectName, [result.status],  coverage, duration, undefined, modelResults);
            }
            finalResults[projectName] = testResults;
        } else {
            // test by JS test suite, with models or without models. When a model is given it is restarted with every
            // test case as long as the test case runs or the model stops.
            const {startTime, testStatusResults, resultRecords} = this._initialiseCSVRowVariables();
            for (const test of tests) {
                let result;

                if (test.skip) {
                    result = new TestResult(test);
                    result.status = Test.SKIP;
                    this.emit(TestRunner.TEST_SKIP, result);

                } else {
                    result = await this._executeTest(vm, project, test, modelTester, props, modelProps);
                    testStatusResults.push(result.status);
                    this._propagateTestResults(result, resultRecords);
                }

                testResults.push(result);

                if (this.aborted) {
                    return null;
                }
            }
            const {covered, total} = CoverageGenerator.getCoverage().getCoverageTotal();
            const coverage = Math.round((covered / total) * 100) / 100;
            const duration = (Date.now() - startTime) / 1000;
            csv += this._generateCSVRow(projectName, testStatusResults, coverage, duration, resultRecords);
            finalResults[projectName] = testResults;
        }

        csv += "\n";    // We add another newline here to make it easier finding the csv output within the logs

        this.emit(TestRunner.RUN_END, finalResults);
        return [finalResults, csv, mutantPrograms];
    }

    /**
     * @param {Array.<(object|Function)>} tests .
     * @returns {Test[]} .
     */
    static convertTests (tests) {
        return tests.map(test => new Test(test));
    }

    /**
     * Initialises variables required to generate a csv row incorporating the results of executing one JS-TestSuite.
     * @return {{testStatusResults: *[], resultRecords: {}, startTime: number}}
     */
    _initialiseCSVRowVariables() {
        const resultRecords = {};
        resultRecords.pass = 0;
        resultRecords.fail = 0;
        resultRecords.error = 0;
        resultRecords.skip = 0;
        return {
            startTime: Date.now(),
            testStatusResults: [],
            resultRecords
        };
    }

    /**
     * Generates the csv header
     * @param {Test[]} tests
     * @param {{duration: number, repetitions: number}} modelProps
     * @return {string}
     */
    _generateCSVHeader(tests, modelProps) {
        let header = `\nprojectName`;
        if(tests) {
            for (const test of tests) {
                header += `,${test.name}`;
            }
            header += `,passed,failed,error,skip,coverage,duration\n`;
        }
        else if(modelProps.repetitions > 0){
            header += `,modelRepetition,modelFails,modelErrors,testResult,projectCoverage,modelCoverage,duration\n`;
        }
        return header;
    }

    /**
     * Generates a CSV row of the obtained test results.
     * @param {string} projectName
     * @param {Array<string>} testStatusResults
     * @param {number} coverage
     * @param {number} duration
     * @param {{}} resultRecords
     * @param {{repetition: number, fails: number, errors:number, coverage:number}} modelResults
     * @return {string}
     */
    _generateCSVRow(projectName, testStatusResults, coverage, duration, resultRecords, modelResults = undefined) {
        let csvRow = `${projectName}`;
        if (modelResults !== undefined) {
            csvRow += `,${modelResults.repetition},${modelResults.fails},${modelResults.errors},${testStatusResults[0]},${coverage},${modelResults.coverage},${duration}\n`;
        } else if (resultRecords !== undefined) {
            for (const testResult of testStatusResults) {
                csvRow += `,${testResult}`;
            }
            csvRow += `,${resultRecords.pass},${resultRecords.fail},${resultRecords.error},${resultRecords.skip},${coverage},${duration}\n`;
        }
        return csvRow;
    }

    /**
     * Propagates the test results to the test-table and counts the number of results types.
     * @param {TestResult} result
     * @param {{}} resultRecords
     */
    _propagateTestResults(result, resultRecords) {
        switch (result.status) {
            case Test.PASS:
                this.emit(TestRunner.TEST_PASS, result);
                resultRecords.pass = resultRecords['pass'] + 1;
                break;
            case Test.FAIL:
                this.emit(TestRunner.TEST_FAIL, result);
                resultRecords.fail = resultRecords['fail'] + 1;
                break;
            case Test.ERROR:
                this.emit(TestRunner.TEST_ERROR, result);
                resultRecords.error = resultRecords['error'] + 1;
                break;
            case Test.SKIP:
                this.emit(TestRunner.TEST_SKIP, result);
                resultRecords.skip = resultRecords['skip'] + 1;
                break;
        }
    }

    /**
     * Extracts csv data from observed obtained model results.
     * @param {object} modelResults
     * @return {{repetition: number, fails: number, errors:number, coverage:number}}
     * @private
     */
    _extractModelCSVData(modelResults){
        let achievedModelCoverage = 0;
        let totalModelCoverage = 0;
        for(const coverages of Object.values(modelResults.coverage)){
            achievedModelCoverage += coverages.covered.length;
            totalModelCoverage += coverages.total;
        }
        const coverageRate = Math.round((achievedModelCoverage / totalModelCoverage) * 100) / 100;
        return {
            repetition: modelResults.testNbr,
            fails: modelResults.fails.length,
            errors: modelResults.errors.length,
            coverage: coverageRate
        };
    }

    /**
     * @param {VirtualMachine} vm .
     * @param {string} project .
     * @param {Test} test .
     * @param {ModelTester} modelTester
     * @param {{extend: object}} props .
     *
     * @param {duration:number,repetitions:number,caseSensitive:boolean} modelProps
     * @returns {Promise<TestResult>} .
     * @private
     */
    async _executeTest(vm, project, test, modelTester, props, modelProps) {
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
        if(props.seed !== 'undefined' && props.seed !== "") {
            Randomness.setInitialSeeds(props.seed);
        }
        // If no seed is specified via the CLI use Date.now() as RNG-Seed but only set it once to keep consistent if
        // several test runs are executed at once
        else if (Randomness.getInitialRNGSeed() === undefined){
            Randomness.setInitialRNGSeed(Date.now());
        }
        Randomness.seedScratch();

        if (modelTester && modelTester.someModelLoaded()) {
            await modelTester.prepareModel(testDriver, modelProps.caseSensitive);
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

            if (modelTester && modelTester.someModelLoaded()) {
                result.modelResult = modelTester.stopAndGetModelResult(testDriver);
            }
        } else if (modelTester && modelTester.someModelLoaded()) {
            // Start the test run with either a maximal duration or until the model stops
            try {
                await testDriver.runUntil(() => {
                    return !modelTester.running();
                }, modelProps.duration);
                result.modelResult = modelTester.stopAndGetModelResult(testDriver);
                if (result.modelResult.errors.length > 0) {
                    result.status = Test.ERROR;
                } else {
                    result.status = result.modelResult.fails.length === 0 ? Test.PASS : Test.FAIL;
                }
            } catch (e) {
                // probably run aborted
                console.error(e);
                result.modelResult = modelTester.stopAndGetModelResult(testDriver);
                result.status = Test.ERROR;
            }
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
     * @return {string}
     */
    static get TEST_MODEL () {
        return 'testModel';
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

    /**
     * @returns {string} .
     */
    static get TEST_MUTATION() {
        return 'testMutation';
    }

    /**
     * @return {string}
     */
    static get RESET_TABLE() {
        return 'resetTable';
    }
}

module.exports = TestRunner;
