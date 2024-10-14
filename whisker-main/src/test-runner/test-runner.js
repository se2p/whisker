const EventEmitter = require('events');
const Test = require('./test');
const TestResult = require('./test-result');
const WhiskerUtil = require('../test/whisker-util');
const {assert, assume} = require('./assert');
const {isAssertionError, isAssumptionError} = require('../util/is-error');
const {Randomness} = require("../whisker/utils/Randomness");
const {MutationFactory} = require("../whisker/scratch/ScratchMutation/MutationFactory");
const {StatementFitnessFunctionFactory} = require("../whisker/testcase/fitness/StatementFitnessFunctionFactory");
const CoverageGenerator = require("../coverage/coverage");
const {BranchCoverageFitnessFunctionFactory} = require("../whisker/testcase/fitness/BranchCoverageFitnessFunctionFactory");
const {ExecutionTrace} = require("../whisker/testcase/ExecutionTrace");
const logger = require("../util/logger");

class TestRunner extends EventEmitter {

    constructor() {
        super();

        /**
         * Collects traces of executed blocks during the execution of tests.
         * @type {[]}
         */
        this.blockTraces = [];
    }

    /**
     * @param {VirtualMachine} vm .
     * @param {string} project .
     * @param {Test[]} tests .
     * @param {ModelTester} modelTester
     * @param {{accelerationFactor, seed, projectName, mutators, mutationBudget, maxMutants, mutantDownload,
     * traceBlocks, log}} props .
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

        // Count number of assertions across all test cases and define a sampleTest used for setting the seed.
        let totalAssertions = 0;
        let sampleTest = undefined;
        if(tests) {
            sampleTest = tests[0];
            for (const test of tests) {
                totalAssertions += test.test.toString().split('\n').filter(t => t.includes('t.assert.')).length;
            }
        }

        this._setRNGSeeds(props['seed'], sampleTest, vm);

        // Load the project and establish an initial save state
        vm.setInterrogativeDebuggerSupported(false);
        this.util = await this._loadProject(vm, project, props);
        this.vmWrapper.useSaveStates = props.useSaveStates;
        this.saveState = this.vmWrapper._recordInitialState();

        const projectName = props['projectName'];
        const testResults = [];
        const finalResults = {};
        let csv = this._generateCSVHeader(tests, modelProps);

        this.emit(TestRunner.RUN_START, tests);

        const generatedMutants = [];
        if ('mutators' in props && props['mutators'][0] !== 'NONE') {
            // Mutation Analysis

            // Divide by 1000 since we measure the budget in seconds and will multiply by 1000 afterwards.
            const maxMutants = props['maxMutants'] > 0 ? props['maxMutants'] : Number.MAX_SAFE_INTEGER;
            const mutationBudget = props['mutationBudget'] > 0 ? props['mutationBudget'] : Number.MAX_SAFE_INTEGER / 1000;
            const mutantFactory = new MutationFactory(vm, props['mutators']);
            let i = -1; // We start with -1 since the first suite execution is on the original project
            const mutationStart = Date.now();
            while (i < maxMutants && mutantFactory.candidates.size > 0 && Date.now() - mutationStart < mutationBudget * 1000) {
                let mutant;
                if (i === -1) { // In the first iteration, we execute the original project as a reference.
                    mutant = JSON.parse(vm.toJSON());
                    mutant.name = "Original";
                } else { // Generate mutant
                    mutant = mutantFactory.generateRandomMutant();
                    if (mutant == null) {
                        continue;
                    }
                    if (props['mutantDownload']) {
                        generatedMutants.push(mutant);
                    }
                }
                const projectMutation = `${projectName}-${mutant.name}`;
                logger.info(`Analysing mutant ${i}: ${projectMutation}`);
                this.util = await this._loadProject(vm, mutant, props);
                this.saveState = this.vmWrapper._recordInitialState();
                this._initialiseFitnessTargets(vm);
                this.emit(TestRunner.TEST_MUTATION, projectMutation);
                this.emit(TestRunner.RESET_TABLE, tests);
                const {startTime, testStatusResults, resultRecords} = this._initialiseCSVRowVariables();
                for (const test of tests) {
                    await this.vmWrapper.resetProject(this.saveState);
                    let result;
                    if ("generationAlgorithm" in test) {
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
                }

                // Record the results
                const duration = (Date.now() - startTime) / 1000;
                const coverage = this._extractCoverage();
                const seed = Randomness.scratchSeed;
                csv += this._generateCSVRow(projectMutation, seed, totalAssertions, testStatusResults, coverage,
                    duration, resultRecords);
                finalResults[projectMutation] = JSON.parse(JSON.stringify(testResults));
                testResults.length = 0;

                i++;
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
                const coverage = this._extractCoverage();
                const modelResults = this._extractModelCSVData(result.modelResult);
                const seed = Randomness.scratchSeed;
                csv += this._generateCSVRow(projectName, seed, totalAssertions, [result.status], coverage,
                    duration, undefined, modelResults);
            }
            finalResults[projectName] = testResults;
        } else {
            // test by JS test suite, with models or without models. When a model is given it is restarted with every
            // test case as long as the test case runs or the model stops.
            this._initialiseFitnessTargets(vm);
            const {startTime, testStatusResults, resultRecords} = this._initialiseCSVRowVariables();
            for (const test of tests) {
                await this.vmWrapper.resetProject(this.saveState);
                let result;
                if ("generationAlgorithm" in test) {
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
            const seed = Randomness.scratchSeed;
            const coverage = this._extractCoverage();
            csv += this._generateCSVRow(projectName, seed, totalAssertions, testStatusResults,
                coverage, duration, resultRecords);
            finalResults[projectName] = testResults;
        }

        csv += "\n";    // We add another newline here to make it easier finding the csv output within the logs

        this.emit(TestRunner.RUN_END, finalResults);
        return [finalResults, csv, generatedMutants];
    }

    /**
     * Sets the seeds for the RNG generator and Scratch based on the supplied cli parameter
     * or the seed used during the test generation phase.
     * @param {string | undefined } seed the supplied seed form the cli.
     * @param {Test} test the test to be executed that may contain the seed used during the generation phase.
     * @param {VirtualMachine} vm the vm that contains the loaded project
     */
    _setRNGSeeds(seed, test, vm) {
        let seedDateObject = false;

        // Prioritise seeds set using the CLI.
        if (seed !== undefined && seed !== 'undefined' && seed !== "") {
            Randomness.setInitialSeeds(seed);
            seedDateObject = true;
        }

        // Check if a seed is saved in the test and set the RNG generators to that seed if present.
        else if (test !== undefined && "seed" in test){
            Randomness.setInitialSeeds(test.seed);
            seedDateObject = true;
        }

        // If no seed is specified via the CLI or saved in the test use Date.now() as RNG-Seed
        // but only set it once to keep consistent if several test runs are executed at once
        else if (Randomness.getInitialRNGSeed() === undefined) {
            Randomness.setInitialSeeds(Date.now());
        }

        Randomness.seedScratch(vm, seedDateObject);
    }

    /**
     * Validates whether the test generation seed and the test execution seed are equivalent.
     * @param {Test} test
     */
    _checkSeed(test){
        if(test !== undefined && "seed" in test && Randomness.getInitialRNGSeed().toString() !== test.seed.toString()){
            logger.warn(`The generation seed (${test.seed}) and the execution seed (${Randomness.getInitialRNGSeed()}) do not match. This may lead to non-deterministic behaviour!`);
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
     * @return {Promise<WhiskerUtil>}.
     */
    async _loadProject(vm, project, props) {
        const util = new WhiskerUtil(vm, project);
        await util.prepare(props.accelerationFactor || 1);
        this.vmWrapper = util.getVMWrapper();
        await this.vmWrapper.vm.runtime.translateText2Speech();
        return util;
    }

    /**
     * Extracts coverage information based on the last test run.
     * @returns {{statements:number, statCoverage:number, branches:number, branchCoverage:number}} the extracted
     * coverage information
     */
    _extractCoverage() {
        const coveredStatements = [...this.statementMap.values()].filter(cov => cov).length;
        const coveredBranches = [...this.branchMap.values()].filter(cov => cov).length;
        return {
            statements: this.statementMap.size,
            statCoverage: Math.round((coveredStatements / this.statementMap.size) * 100) / 100,
            branches: this.branchMap.size,
            branchCoverage: Math.round((coveredBranches / this.branchMap.size) * 100) / 100,
        };
    }

    /**
     * Initialises the statement map.
     * @param {VirtualMachine} vm
     * @returns {number} total statements.
     */
    _initialiseFitnessTargets(vm) {
        // Initialise statements
        const statementFactory = new StatementFitnessFunctionFactory();
        const statementTargets = statementFactory.extractFitnessFunctions(vm, []);
        this.statementMap = new Map();
        for (const statement of statementTargets) {
            this.statementMap.set(statement, false);
        }

        // Initialise branches
        const branchFactory = new BranchCoverageFitnessFunctionFactory();
        const branchTargets = branchFactory.extractFitnessFunctions(vm, []);
        this.branchMap = new Map();
        for (const branch of branchTargets) {
            this.branchMap.set(branch, false);
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
        if (tests) {
            for (const test of tests) {
                header += `,${test.name}`;
            }
            header += `,passed,failed,error,skip,statements,statementCoverage,branches,branchCoverage,duration\n`;
        } else if (modelProps.repetitions > 0) {
            header += `,modelRepetition,modelFails,modelErrors,testResult,statements,statementCoverage,branches,branchCoverage,modelCoverage,duration\n`;
        }
        return header;
    }

    /**
     * Generates a CSV row of the obtained test results.
     * @param {string} projectName
     * @param {number} seed
     * @param {number} assertions
     * @param {Array<string>} testStatusResults
     * @param {{statements:number, statCoverage:number, branches:number, branchCoverage:number}} coverage
     * @param {number} duration
     * @param {{}} resultRecords
     * @param {{repetition: number, fails: number, errors:number, coverage:number, generationAlgorithm: string}} modelResults
     * @return {string}
     */
    _generateCSVRow(projectName, seed, assertions, testStatusResults,
                    coverage, duration, resultRecords, modelResults = undefined) {
        let csvRow = `${projectName},${seed},${assertions}`;
        if (modelResults !== undefined) {
            csvRow += `,${modelResults.generationAlgorithm},${modelResults.repetition},${modelResults.fails},${modelResults.errors},${testStatusResults[0]},${coverage.statements},${coverage.statCoverage},${coverage.branches},${coverage.branchCoverage},${modelResults.coverage},${duration}\n`;
        } else if (resultRecords !== undefined) {
            csvRow += `,${resultRecords.generationAlgorithm}`;
            for (const testResult of testStatusResults) {
                csvRow += `,${testResult}`;
            }
            csvRow += `,${resultRecords.pass},${resultRecords.fail},${resultRecords.error},${resultRecords.skip},${coverage.statements},${coverage.statCoverage},${coverage.branches},${coverage.branchCoverage},${duration}\n`;
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
     * @param {number} defaultTimeoutPerTest .
     *
     * @param {duration:number,repetitions:number,caseSensitive:boolean} modelProps
     * @returns {Promise<TestResult>} .
     * @private
     */
    async _executeTest(vm, project, test, modelTester, props, modelProps, defaultTimeoutPerTest = 0) {
        const result = new TestResult(test);

        if (props['traceBlocks']) {
            this.vmWrapper.vm.activateBlockTracing();
        }

        const testDriver = this.util.getTestDriver(
            {
                extend: {
                    assert: assert,
                    assume: assume,
                    log: message => {
                        this._log(test, message);
                        result.log.push(message);
                    },
                    getCoverage: () => CoverageGenerator.getCoverage(),
                    ...props.extend
                }
            },
        );


        this.emit(TestRunner.TEST_START, test);
        await this.vmWrapper.start();
        this._setRNGSeeds(props.seed, test, vm);
        this._checkSeed(test);

        if (modelTester && modelTester.someModelLoaded()) {
            await modelTester.prepareModel(testDriver, modelProps.caseSensitive);
        }

        if (test) {
            try {
                // Use the default timeout (given as function parameter), unless the test specifies its own timeout.
                const timeout = Object.prototype.hasOwnProperty.call(test, 'timeout') ? test['timeout'] : defaultTimeoutPerTest;

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

            // Set the execution trace and the covered blocks set for computing coverages.
            test.trace = new ExecutionTrace(this.vmWrapper.vm.runtime.traceInfo.tracer.branchDistTraces, []);
            test.coverage = this.vmWrapper.vm.runtime.traceInfo.tracer.coverage;
            await this._determineCoverages(test);

        } else if (modelTester && modelTester.someModelLoaded()) {
            // Start the test run with either a maximal duration or until the model stops
            try {
                await testDriver.runUntil(() => {
                    return !modelTester.running();
                }, modelProps.duration);

                // TODO: Refactor coverage computation for model executions to be similar to test executions.
                result.modelResult = modelTester.stopAndGetModelResult(testDriver);
                if (result.modelResult.errors.length > 0) {
                    result.status = Test.ERROR;
                } else {
                    result.status = result.modelResult.fails.length === 0 ? Test.PASS : Test.FAIL;
                }
            } catch (e) {
                // probably run aborted
                logger.error(e);
                result.modelResult = modelTester.stopAndGetModelResult(testDriver);
                result.status = Test.ERROR;
            }
        }

        // If desired, save execution trace after executing each block.
        if (props['traceBlocks']) {
            this.blockTraces.push(this._extractTraces());
        }

        this.vmWrapper.end();
        return result;
    }

    /**
     * Determines the achieved coverage values of an executed test.
     * @param {Test} test
     * @returns {Promise<void>}
     */
    async _determineCoverages(test){
        // Infer statement coverage
        for (const statement of this.statementMap.keys()) {
            if (await statement.isCovered(test)) {
                this.statementMap.set(statement, true);
            }
        }

        // Infer branch coverage
        for (const branch of this.branchMap.keys()) {
            if (await branch.isCovered(test)) {
                this.branchMap.set(branch, true);
            }
        }
    }

    /**
     * Extracts desired trace information for every executed block.
     * @return {{id:string, targets:{}}}
     * @private
     */
    _extractTraces() {
        const traces = [];
        for (const trace of this.vmWrapper.vm.runtime.traceInfo.tracer.traces) {
            traces.push({id: trace['id'], opcode: trace['opcode'], sprite: trace['targetsInfo']});
        }
        return {...traces};
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
    static get TEST_DUMP() {
        return 'testDump';
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
