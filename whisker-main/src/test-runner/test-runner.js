const EventEmitter = require('events');
const Test = require('./test');
const TestResult = require('./test-result');
const WhiskerUtil = require('../test/whisker-util');
const {assert, assume} = require('./assert');
const {isAssertionError, isAssumptionError} = require('../util/is-error');
const {Randomness} = require("../whisker/utils/Randomness");
const {MutationFactory} = require("../whisker/scratch/ScratchMutation/MutationFactory");
const {StatementFitnessFunctionFactory} = require("../whisker/testcase/fitness/StatementFitnessFunctionFactory");
const {shuffle} = require("../whisker/utils/Arrays");

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

        this._setRNGSeeds(props['seed']);

        // Load project and establish an initial save state
        this.util = await this._loadProject(vm, project, props);
        this.saveState = this.vmWrapper._recordInitialState();

        // Count number of assertions across all test cases.
        let totalAssertions = 0;
        if(tests) {
            for (const test of tests) {
                totalAssertions += test.test.toString().split('\n').filter(t => t.includes('t.assert.')).length;
            }
        }

        const projectName = props['projectName'];
        const testResults = [];
        const finalResults = {};
        let csv = this._generateCSVHeader(tests, modelProps);
        let mutantPrograms = undefined;

        this.emit(TestRunner.RUN_START, tests);

        if (props['mutators'][0] !== 'NONE') {
            // Mutation Analysis
            const mutationBudget = props['mutationBudget'] > 0 ? props['mutationBudget'] : Number.MAX_SAFE_INTEGER;

            // Add the original as reference when applying mutation analysis
            const original = JSON.parse((vm.toJSON()));
            original.name = "Original";

            const mutantFactory = new MutationFactory(vm);
            mutantPrograms = mutantFactory.generateScratchMutations(props['mutators'], props['maxMutants']);
            shuffle(mutantPrograms); // Shuffle so we do not favour mutation operators when a time limit is set
            mutantPrograms.push(original);

            // Execute the given tests on every mutant
            const startTime = Date.now();
            while (mutantPrograms.length > 0 && Date.now() - startTime < mutationBudget) {
                const mutant = mutantPrograms.pop();
                const projectMutation = `${projectName}-${mutant.name}`;
                console.log(`Analysing mutant ${projectMutation}`);
                this.util = await this._loadProject(vm, mutant, props);
                this.saveState = this.vmWrapper._recordInitialState(vm);
                this._initialiseFitnessTargets(vm);
                this.emit(TestRunner.TEST_MUTATION, projectMutation);
                this.emit(TestRunner.RESET_TABLE, tests);
                const {startTime, testStatusResults, resultRecords} = this._initialiseCSVRowVariables();
                for (const test of tests) {
                    this.vmWrapper.loadSaveState(this.saveState);
                    let result;
                    if("generationAlgorithm" in test){
                        resultRecords.generationAlgorithm = test.generationAlgorithm;
                    }

                    if (test.skip) {
                        result = new TestResult(test);
                        result.status = Test.SKIP;
                        this.emit(TestRunner.TEST_SKIP, result);

                    } else {
                        // Set timeout of 600000ms = 1min for every test
                        result = await this._executeTest(vm, mutant, test, modelTester, props, modelProps, 600000);
                        testStatusResults.push(result.status);
                        this._propagateTestResults(result, resultRecords);
                    }

                    testResults.push(result);

                    if (this.aborted) {
                        return null;
                    }
                }

                // Record the results
                const duration = (Date.now() - startTime) / 1000;
                const total = this.statementMap.size;
                const covered = [...this.statementMap.values()].filter(cov => cov).length;
                csv += this._generateCSVRow(projectMutation, props.seed, totalAssertions, testStatusResults, total, covered, duration, resultRecords);
                finalResults[projectMutation] = JSON.parse(JSON.stringify(testResults));
                testResults.length = 0;
            }
        } else if (modelTester && (!tests || tests.length === 0)) {
            this._initialiseFitnessTargets(vm);
            // test only by models

            if (!modelProps.repetitions) {
                modelProps.repetitions = 1;
            }
            if (!modelProps.duration) {
                modelProps.duration = 35000;
            }

            for (let i = 0; i < modelProps.repetitions; i++) {
                // TODO: It would be better here to use the loadSaveState function.
                //  However there seem to be timing issues with the models.
                this.util = await this._loadProject(vm, project, props);
                const startTime = Date.now();
                let result = await this._executeTest(vm, project, undefined, modelTester, props, modelProps);
                result.modelResult.testNbr = i;
                this.emit(TestRunner.TEST_MODEL, result);
                testResults.push(result);

                // Record the results
                const duration = (Date.now() - startTime) / 1000;
                const total = this.statementMap.size;
                const covered = [...this.statementMap.values()].filter(cov => cov).length;
                const modelResults = this._extractModelCSVData(result.modelResult);
                csv += this._generateCSVRow(projectName, props.seed, totalAssertions,[result.status], total,  covered, duration, undefined, modelResults);
            }
            finalResults[projectName] = testResults;
        } else {
            // test by JS test suite, with models or without models. When a model is given it is restarted with every
            // test case as long as the test case runs or the model stops.
            this._initialiseFitnessTargets(vm);
            const {startTime, testStatusResults, resultRecords} = this._initialiseCSVRowVariables();
            for (const test of tests) {
                this.vmWrapper.loadSaveState(this.saveState);
                let result;
                if("generationAlgorithm" in test){
                    resultRecords.generationAlgorithm = test.generationAlgorithm;
                }

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
            // Record the results
            const duration = (Date.now() - startTime) / 1000;
            const total = this.statementMap.size;
            const covered = [...this.statementMap.values()].filter(cov => cov).length;
            csv += this._generateCSVRow(projectName, props.seed, totalAssertions, testStatusResults, total, covered, duration, resultRecords);
            finalResults[projectName] = testResults;
        }

        csv += "\n";    // We add another newline here to make it easier finding the csv output within the logs

        this.emit(TestRunner.RUN_END, finalResults);
        return [finalResults, csv, mutantPrograms];
    }

    /**
     * Sets the seeds for the RNG generator based on the supplied cli parameter.
     * @param {string | undefined } seed the supplied seed form the cli.
     */
    _setRNGSeeds(seed) {
        if (seed !== 'undefined' && seed !== "") {
            Randomness.setInitialSeeds(seed);
        }
            // If no seed is specified via the CLI use Date.now() as RNG-Seed but only set it once to keep consistent if
        // several test runs are executed at once
        else if (Randomness.getInitialRNGSeed() === undefined) {
            Randomness.setInitialRNGSeed(Date.now());
        }
        Randomness.seedScratch();
    }

    /**
     * Validates whether the test generation seed and the test execution seed are equivalent.
     * @param {Test} test
     */
    _checkSeed(test){
        if(test !== undefined && "seed" in test && Randomness.getInitialRNGSeed().toString() !== test.seed){
            console.warn(`The generation seed (${test.seed}) and the execution seed (${Randomness.getInitialRNGSeed()}) do not match. This may lead to non-deterministic behaviour!`);
        }
    }

    /**
     * @param {Array.<(object|Function)>} tests .
     * @returns {Test[]} .
     */
    static convertTests (tests) {
        return tests.map(test => new Test(test));
    }

    /**
     * Loads a given Scratch project by initialising the VmWrapper and the fitness targets.
     * @param {VirtualMachine} vm
     * @param {ScratchMutant | string} project.
     * @param {{extend: object}=} props
     * @param {boolean} loadSaveState
     * @return {WhiskerUtil}.
     */
    async _loadProject(vm, project, props) {
        const util = new WhiskerUtil(vm, project);
        await util.prepare(props.accelerationFactor || 1);
        this.vmWrapper = util.getVMWrapper();
        if(typeof this.vmWrapper.vm.runtime.translateText2Speech == "function") {
            await this.vmWrapper.vm.runtime.translateText2Speech();
        }
        return util;
    }

    /**
     * Initialises the statement map.
     * @param {VirtualMachine} vm
     * @returns {number} total statements.
     */
    _initialiseFitnessTargets(vm) {
        const fitnessFactory = new StatementFitnessFunctionFactory();
        const fitnessTargets = fitnessFactory.extractFitnessFunctions(vm, []);
        this.statementMap = new Map();
        for (const statement of fitnessTargets){
            this.statementMap.set(statement, false);
        }
    }

    /**
     * Initialises variables required to generate a csv row incorporating the results of executing one JS-TestSuite.
     * @return {{testStatusResults: *[], generationAlgorithm: string, resultRecords: {}, startTime: number}}
     */
    _initialiseCSVRowVariables() {
        const resultRecords = {};
        resultRecords.generationAlgorithm = "None";
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
        let header = `\nprojectName,seed,assertions,generationAlgorithm`;
        if(tests) {
            for (const test of tests) {
                header += `,${test.name}`;
            }
            header += `,passed,failed,error,skip,totalBlocks,coveredBlocks,coverage,duration\n`;
        }
        else if(modelProps.repetitions > 0){
            header += `,modelRepetition,modelFails,modelErrors,testResult,totalBlocks,projectCoverage,modelCoverage,duration\n`;
        }
        return header;
    }

    /**
     * Generates a CSV row of the obtained test results.
     * @param {string} projectName
     * @param {number} seed
     * @param {number} assertions
     * @param {Array<string>} testStatusResults
     * @param {number} total
     * @param {number} covered
     * @param {number} duration
     * @param {{}} resultRecords
     * @param {{repetition: number, fails: number, errors:number, coverage:number, generationAlgorithm: string}} modelResults
     * @return {string}
     */
    _generateCSVRow(projectName, seed, assertions, testStatusResults, total, covered, duration, resultRecords, modelResults = undefined) {
        const coverage = Math.round((covered / total) * 100) / 100;
        let csvRow = `${projectName},${seed},${assertions}`;
        if (modelResults !== undefined) {
            csvRow += `,${modelResults.generationAlgorithm},${modelResults.repetition},${modelResults.fails},${modelResults.errors},${testStatusResults[0]},${total},${covered},${coverage},${modelResults.coverage},${duration}\n`;
        } else if (resultRecords !== undefined) {
            csvRow += `,${resultRecords.generationAlgorithm}`;
            for (const testResult of testStatusResults) {
                csvRow += `,${testResult}`;
            }
            csvRow += `,${resultRecords.pass},${resultRecords.fail},${resultRecords.error},${resultRecords.skip},${total},${covered},${coverage},${duration}\n`;
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
     * @return {{repetition: number, fails: number, errors:number, coverage:number, generationAlgorithm: string}}
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
            coverage: coverageRate,
            generationAlgorithm: "None"     // We do not generate models automatically yet.
        };
    }

    /**
     * @param {VirtualMachine} vm .
     * @param {string} project .
     * @param {Test} test .
     * @param {ModelTester} modelTester
     * @param {{extend: object}} props .
     * @param {number} timeout .
     *
     * @param {duration:number,repetitions:number,caseSensitive:boolean} modelProps
     * @returns {Promise<TestResult>} .
     * @private
     */
    async _executeTest(vm, project, test, modelTester, props, modelProps, timeout = 0) {
        const result = new TestResult(test);

        const testDriver = this.util.getTestDriver(
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
        this.vmWrapper.start();
        this._setRNGSeeds(props.seed);
        this._checkSeed(test);

        if (modelTester && modelTester.someModelLoaded()) {
            await modelTester.prepareModel(testDriver, modelProps.caseSensitive);
        }

        if (test) {
            try {

                // A timeout was set to stop the test after the timeout has been reached.
                if (timeout > 0) {
                    const timeoutError = new Error("Timeout");
                    const testTimeout = (prom, time, exception) => {
                        let timer;
                        return Promise.race([
                            prom,
                            new Promise((_r, rej) => timer = setTimeout(rej, time, exception))
                        ]).finally(() => clearTimeout(timer));
                    };
                    await testTimeout(test.test(testDriver), timeout, timeoutError);
                } else {
                    await test.test(testDriver);
                }
                result.status = Test.PASS;

            } catch (e) {
                result.error = e;

                if (e.message === "Timeout") {
                    result.status = Test.FAIL;
                } else if (isAssertionError(e)) {
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

        result.covered = this.vmWrapper.vm.runtime.traceInfo.tracer.coverage;
        for (const statement of this.statementMap.keys()){
            if(result.covered.has(statement._targetNode.id)){
                this.statementMap.set(statement, true);
            }
        }
        this.vmWrapper.end();
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
