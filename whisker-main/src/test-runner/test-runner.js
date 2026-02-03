const EventEmitter = require('events');
const Test = require('./test');
const TestResult = require('./test-result');
const WhiskerUtil = require('../test/whisker-util');
const {
    assert,
    assume,
} = require('./assert');
const {isAssertionError, isAssumptionError} = require('../util/is-error');
const {Randomness} = require("../whisker/utils/Randomness");
const {MutationFactory} = require("../whisker/scratch/ScratchMutation/MutationFactory");
const {StatementFitnessFunctionFactory} = require("../whisker/testcase/fitness/StatementFitnessFunctionFactory");
const CoverageGenerator = require("../coverage/coverage");
const {BranchCoverageFitnessFunctionFactory} = require("../whisker/testcase/fitness/BranchCoverageFitnessFunctionFactory");
const logger = require("../util/logger");
const {ModelTester} = require("../whisker/model/ModelTester");
const {onExecuted, onPassed} = require("../coverage/assertion-level-tracing");
const {serializeError} = require("../util/serialize-error");
const {modelCsvHeader, modelResultToCsvData} = require("./model-result");
const {Container} = require("../whisker/utils/Container");

function enableAssertionLevelBlockTracing(assertions, assumptions) {
    assert.onExecutedAssertion = onExecuted.bind(null, assertions);
    assume.onExecutedAssumption = onExecuted.bind(null, assumptions);
    assert.onPassedAssertion = onPassed.bind(null, assertions);
    assume.onPassedAssumption = onPassed.bind(null, assumptions);
}

function postProcessResults(test, result) {
    // We are interested in the name of the JavaScript test function itself, not the human-readable name of the
    // test, which is test.name and could be ambiguous.
    const name = test.test.name;
    const exportedName = test.name;
    const description = test.description;
    const {status, error} = result;

    // Turn the Error object into a plain JSON object to avoid serialization problems. For example, the stack
    // property on the Error class is sometimes implemented as a getter function, which is not serializable.
    const serializableError = serializeError(error);

    const coveredBlocks = Array.from(CoverageGenerator.getCoveredBlockIdsPerTest());
    const assertions = Object.values(result.assertions);
    const assumptions = Object.values(result.assumptions);
    assertions.forEach((assertion) => {
        assertion.covered = Array.from(assertion.covered);
        assertion.coveredCumulative = Array.from(assertion.coveredCumulative);
    });
    assumptions.forEach((assumption) => {
        assumption.covered = Array.from(assumption.covered);
        assumption.coveredCumulative = Array.from(assumption.coveredCumulative);
    });

    return {name, exportedName, description, status, error: serializableError, coveredBlocks, assertions, assumptions};
}

class TestRunner extends EventEmitter {

    constructor() {
        super();

        /**
         * Collects attributes of sprite after every executed block during the execution of tests.
         * @type {[]}
         */
        this.attributeTraces = [];
        this.headless = false;
    }

    /**
     * @param {VirtualMachine} vm .
     * @param {string} project .
     * @param {Test[]} tests .
     * @param {ModelTester} modelTester
     * @param {{accelerationFactor, seed, projectName, mutators, mutationBudget, maxMutants, mutantDownload,
     * log, traceBlockCoverage, traceBranchCoverage, traceAttributes, traceDebug}} props .
     * @returns {Promise<[{}, {}, []]>} .
     */
    async runTests(vm, project, tests, modelTester, props) {
        Container.vm = vm;
        this.aborted = false;

        this.activateTracing(vm, props);

        if (typeof props === 'undefined' || props === null) {
            props = {extend: {}};
        } else if (!('extend' in props)) {
            props.extend = {};
        }

        // Count number of assertions across all test cases and define a sampleTest used for setting the seed.
        let totalAssertions = 0;
        let sampleTest = undefined;
        if (tests) {
            sampleTest = tests[0];
            for (const test of tests) {
                totalAssertions += test.test.toString().split('\n').filter(t => t.includes('t.assert.')).length;
            }
        }

        this._setRNGSeeds(props['seed'], sampleTest, vm);

        // Load the project and establish an initial save state
        vm.setInterrogativeDebuggerSupported(false);
        this.util = await this._loadProject(vm, project, props, modelTester);
        this.vmWrapper.useSaveStates = props.useSaveStates;
        this.saveState = this.vmWrapper._recordInitialState();

        const projectName = props['projectName'];
        const testResults = [];
        const finalResults = {};
        let csv = this._generateCSVHeader(tests);

        // repair-specific variables
        const coveragePerTest = [];
        const timingsPerTest = [];

        this.headless = !!props.headless;

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
                modelTester.clearCoverage();
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
                const projectMutation = `${projectName}-${mutant.mutantName}`;
                logger.info(`Analysing mutant ${i}: ${projectMutation}`);
                this.util = await this._loadProject(vm, mutant, props, modelTester);
                this.saveState = this.vmWrapper._recordInitialState();
                this._initialiseFitnessTargets(vm);
                this.emit(TestRunner.TEST_MUTATION, projectMutation);
                this.emit(TestRunner.RESET_TABLE, tests);
                const {startTime, testStatusResults, resultRecords} = this._initialiseCSVRowVariables();
                if (tests) {
                    csv += await this._executeTests(vm, tests, props, resultRecords, testStatusResults, testResults,
                        startTime, projectMutation, totalAssertions,
                        600000, false, coveragePerTest, timingsPerTest);
                } else {
                    csv += await this._executeUserModels(vm, modelTester, mutant, props, testResults, projectMutation);
                }

                finalResults[projectMutation] = JSON.parse(JSON.stringify(testResults));
                testResults.length = 0;
                i++;
            }
        } else if (modelTester.someModelLoaded() && (!tests || tests.length === 0)) {
            this._initialiseFitnessTargets(vm);
            // test only by models
            csv += await this._executeUserModels(vm, modelTester, project, props, testResults, projectName);
            finalResults[projectName] = testResults;
        } else {
            // test by JS test suite, with models or without models. When a model is given it is restarted with every
            // test case as long as the test case runs or the model stops.
            this._initialiseFitnessTargets(vm);
            const {startTime, testStatusResults, resultRecords} = this._initialiseCSVRowVariables();
            const res = await this._executeTests(vm, tests, props,
                resultRecords, testStatusResults, testResults,
                startTime, projectName, totalAssertions,
                0, true, coveragePerTest, timingsPerTest);
            if (res == null) {
                return null;
            }
            csv += res;
            finalResults[projectName] = testResults;
        }

        csv += "\n";    // We add another newline here to make it easier finding the csv output within the logs

        this.emit(TestRunner.RUN_END, finalResults);
        return [finalResults, csv, generatedMutants, coveragePerTest, timingsPerTest];
    }

    /**
     *
     * @param {VirtualMachine} vm
     * @param {Test[]} tests
     * @param {{accelerationFactor, seed, projectName, mutators, mutationBudget, maxMutants, mutantDownload,
     * log, traceBlockCoverage, traceBranchCoverage, traceAttributes, traceDebug}} props .
     * @param {{duration: number, repetitions: number}} modelProps
     * @param {{}} resultRecords
     * @param {(?string)[]} testStatusResults
     * @param {TestResult[]} testResults
     * @param {number} startTime
     * @param {string} projectName
     * @param {number} totalAssertions
     * @param {number} defaultTimeoutPerTest
     * @param {boolean} canBeAborted
     * @param coveragePerTest
     * @param timingsPerTest
     * @return {Promise<string|null>}
     */
    async _executeTests(vm, tests, props,
                        resultRecords, testStatusResults, testResults,
                        startTime, projectName, totalAssertions,
                        defaultTimeoutPerTest, canBeAborted, coveragePerTest, timingsPerTest) {
        for (const test of tests) {
            let timeResetProject = Date.now();
            await this.vmWrapper.resetProject(this.saveState);
            timeResetProject = Date.now() - timeResetProject;

            let result;
            if ("generationAlgorithm" in test) {
                resultRecords.generationAlgorithm = test.generationAlgorithm;
            }

            if (test.skip) {
                result = new TestResult(test);
                result.status = Test.SKIP;
                this.emit(TestRunner.TEST_SKIP, result);

            } else {
                let timeRunTest = Date.now();
                result = await this._executeTest(vm, test, props, defaultTimeoutPerTest);
                timeRunTest = Date.now() - timeRunTest;

                testStatusResults.push(result.status);
                timingsPerTest.push({
                    resetProject: timeResetProject,
                    runTest: timeRunTest,
                });

                this._propagateTestResults(result, resultRecords);
            }

            testResults.push(result);

            if (!test.skip) {
                coveragePerTest.push(postProcessResults(test, result));
            }

            if (canBeAborted && this.aborted) {
                return null;
            }
        }
        const duration = (Date.now() - startTime) / 1000;
        const seed = Randomness.scratchSeed;
        const coverage = this._extractCoverage();
        return this._generateCSVRow(projectName, seed, totalAssertions, testStatusResults, coverage,
            duration, resultRecords);
    }

    /**
     * Executes the UserModels loaded in {@linkcode modelTester}
     * @param {VirtualMachine} vm
     * @param {ModelTester} modelTester
     * @param {ScratchMutant | string} project
     * @param {{accelerationFactor, seed, projectName, mutators, mutationBudget, maxMutants, mutantDownload,
     * log, traceBlockCoverage, traceBranchCoverage, traceAttributes, traceDebug}} props .
     * @param {TestResult[]} testResults
     * @param {string} projectName
     * @return {Promise<string>}
     */
    async _executeUserModels(vm, modelTester, project, props,
                             testResults, projectName) {
        let csv = "";
        const modifiedProps = {...props};
        const startSeed = modifiedProps.seed ? Number(modifiedProps.seed) : Date.now();
        for (let i = 0; i < modelTester.repetitions; i++) {
            modelTester.clearRepetitionCoverage();
            for (const uM of modelTester.userModelIndices()) {
                modifiedProps.seed = startSeed + modelTester.runIndex;
                this.util = await this._loadProject(vm, project, modifiedProps, modelTester);
                this.vmWrapper.nextUserModelIndex = uM;
                const startTime = Date.now();
                const result = await this._executeTest(vm, null, modifiedProps, 0);
                this.emit(TestRunner.TEST_MODEL, result);
                testResults.push(result);
                const duration = (Date.now() - startTime) / 1000;
                const coverage = this._extractCoverage();
                csv += this._generateCSVRow(projectName, Randomness.scratchSeed, 0,
                    [result.status], coverage, duration, undefined, result.modelResult, i, modelTester.currentUserModelId);
            }
        }
        return csv;
    }

    /**
     * Runs a test in a VM that is already started and has the respective project already loaded.
     * Intended to run tests in a VM that is already in use, e.g. by a regular scratch-gui instance.
     *
     * @param {VirtualMachine} preloadedVM an existing scratch-vm instance that has
     *                                     the project under test already loaded
     * @param {Test} test a single Whisker test to be executed
     * @return {Promise<TestResult>} the test result
     */
    async runTestInPreloadedVM(preloadedVM, test) {

        const util = new WhiskerUtil(preloadedVM, null);
        const vmWrapper = util.getVMWrapper();
        await preloadedVM.runtime.translateText2Speech();

        preloadedVM.runtime.virtualSound = -1;

        const result = new TestResult(test);

        if (test.skip) {
            result.status = Test.SKIP;
            return result;
        }

        const testDriver = util.getTestDriver(
            {
                extend: {
                    assert: assert,
                    assume: assume,
                    log: message => {
                        result.log.push(message);
                    }
                }
            }
        );

        this.saveState = vmWrapper._recordInitialState();

        this._setRNGSeeds(undefined, test, preloadedVM);
        this._checkSeed(test);

        preloadedVM.greenFlag(); // I am unsure if this is correct, but vm-wrapper.js "start()" contains it, too.

        preloadedVM.runtime.testRunning = true;

        const defaultTimeout = 0; // same value as in the executeTest function
        const timeout = Object.prototype.hasOwnProperty.call(test, 'timeout') ? test['timeout'] : defaultTimeout;

        try {
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

        preloadedVM.runtime.testRunning = false;
        vmWrapper.loadSaveState(this.saveState);
        return result;
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
        if (seed && seed !== 'undefined' && seed !== "") {
            Randomness.setInitialSeeds(seed);
            seedDateObject = true;
        }

        // Check if a seed is saved in the test and set the RNG generators to that seed if present.
        else if (test && "seed" in test) {
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
    _checkSeed(test) {
        if (test && "seed" in test && Randomness.getInitialRNGSeed().toString() !== test.seed.toString()) {
            logger.warn(`The generation seed (${test.seed}) and the execution seed (${Randomness.getInitialRNGSeed()}) do not match. This may lead to non-deterministic behaviour!`);
        }
    }

    /**
     * @param {Array.<(object|Function)>} tests .
     * @returns {Test[]} .
     */
    static convertTests(tests) {
        return tests.map(test => new Test(test));
    }

    /**
     * Loads a given Scratch project by initialising the VmWrapper and the fitness targets.
     * @param {VirtualMachine} vm
     * @param {ScratchMutant | string} project.
     * @param {{extend: object}=} props
     * @param {boolean} loadSaveState
     * @param {ModelTester} modelTester
     * @return {Promise<WhiskerUtil>}.
     */
    async _loadProject(vm, project, props, modelTester) {
        const util = new WhiskerUtil(vm, project, modelTester);
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
     * @return {string}
     */
    _generateCSVHeader(tests) {
        let header = `\nprojectName,seed,assertions`;
        if (tests) {
            header += ',generationAlgorithm';
            for (const test of tests) {
                header += `,${test.name}`;
            }
            header += `,passed,failed,error,skip`;
        }
        header += `,statements,statementCoverage,branches,branchCoverage,duration,testResult,repetition,userModelId${modelCsvHeader}`;
        return header + "\n";
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
     * @param {ModelResult} modelResult
     * @param {number} repetition
     * @param {string | null} userModelId
     * @return {string}
     */
    _generateCSVRow(projectName, seed, assertions, testStatusResults,
                    coverage, duration, resultRecords, modelResult = undefined, repetition = 0, userModelId = null) {
        let csvRow = `${projectName},${seed},${assertions}`;
        if (resultRecords !== undefined) {
            csvRow += `,${resultRecords.generationAlgorithm}`;
            for (const testResult of testStatusResults) {
                csvRow += `,${testResult}`;
            }
            csvRow += `,${resultRecords.pass},${resultRecords.fail},${resultRecords.error},${resultRecords.skip}`;
        }
        csvRow += `,${coverage.statements},${coverage.statCoverage},${coverage.branches},${coverage.branchCoverage},${duration},${testStatusResults[0]}`;
        csvRow += `,${repetition},${userModelId},${modelResultToCsvData(modelResult)}`;
        return csvRow + '\n';
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
     * @param {VirtualMachine} vm .
     * @param {Test} test .
     * @param {{extend: object}} props .
     * @param {number} defaultTimeoutPerTest .
     * @returns {Promise<TestResult>} .
     * @private
     */
    async _executeTest(vm, test, props, defaultTimeoutPerTest = 0) {
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
                    getCoverage: () => CoverageGenerator.getCoverage(),
                    ...props.extend
                }
            },
        );

        const assertions = {};
        const assumptions = {};

        CoverageGenerator.clearCoveragePerTest();
        CoverageGenerator.clearCoveragePerAssertion();

        this.emit(TestRunner.TEST_START, test);
        await this.vmWrapper.start();
        this._setRNGSeeds(props.seed, test, vm);
        this._checkSeed(test);

        if (test) {
            enableAssertionLevelBlockTracing(assertions, assumptions);

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
            } finally {
                assert.onExecutedAssertion = null;
                assume.onExecutedAssumption = null;
                assert.onPassedAssertion = null;
                assume.onPassedAssumption = null;
            }
            this.vmWrapper.stopModels(result, false);
            await this._determineCoverages(test, props);
        } else if (this.vmWrapper.modelTester.someModelLoaded()) {
            let updateResultStatus = true;
            const duration = this.vmWrapper.modelTester.getDurationForUserModel();
            // this code executes a User Model or executes the Models without inputs depending on the userModelIndex
            try {
                // wait until either a maximal duration or until the model stops
                await testDriver.runUntil(() => {
                    return !this.vmWrapper.modelTester.running();
                }, duration);
            } catch (e) {
                // probably run aborted
                logger.error(e);
                updateResultStatus = false;
                result.status = Test.ERROR;
            } finally {
                await this._determineCoverages(test, props);
                this.vmWrapper.stopModels(result, updateResultStatus);
            }
        }
        // set test driver to null so there is no automatic start before the next test run when resetting vwWrapper
        this.vmWrapper.nextModelTestDriver = null;

        result.assertions = assertions;
        result.assumptions = assumptions;

        // If desired, save execution trace after executing each block.
        if (props['traceAttributes']) {
            this.attributeTraces.push(this._extractTraces());
        }

        this.vmWrapper.end();
        return result;
    }

    /**
     * Determines the achieved coverage values of an executed test.
     * @param {Test} test
     * @param props
     * @returns {Promise<void>}
     */
    async _determineCoverages(test, props) {
        const coverageTrace = this.vmWrapper.vm.getTraces();

        if (props.traceBlockCoverage) {
            if (test) {
                test.coverage = coverageTrace.blockCoverage;
            }

            // Infer statement coverage
            for (const statement of this.statementMap.keys()) {
                if (coverageTrace.blockCoverage.has(statement.getNodeId())) {
                    this.statementMap.set(statement, true);
                }
            }
        }

        if (props.traceBranchCoverage) {
            // Infer branch coverage
            for (const branch of this.branchMap.keys()) {
                if (coverageTrace.branchCoverage.has(branch.getNodeId())) {
                    this.branchMap.set(branch, true);
                }
            }
        }
    }

    /**
     * Activates specified tracers.
     * @param {VirtualMachine} vm
     * @param {{traceBlockCoverage:boolean, traceBranchCoverage:boolean, traceAttributes:boolean,
     * traceDebug:boolean}} props
     */
    activateTracing(vm, props) {
        if (props.traceBlockCoverage && props.traceBranchCoverage) {
            vm.registerCoverageTracer();
        } else if (props.traceBlockCoverage) {
            vm.registerBlockCoverageTracer();
        } else if (props.traceBranchCoverage) {
            vm.registerBranchCoverageTracer();
        }

        if (props.traceAttributes) {
            vm.registerAttributeTracer();
        }

        if (props.traceDebug) {
            vm.registerDebugTracer();
        }
    }

    /**
     * Extracts desired trace information for every executed block.
     * @return {{id:string, targets:{}}}
     * @private
     */
    _extractTraces() {
        const traces = [];
        for (const trace of this.vmWrapper.vm.getTraces().targetAttributes) {
            traces.push({id: trace['id'], opcode: trace['opcode'], sprites: trace['attributes']});
        }
        return {...traces};
    }

    /**
     * @param {Test} test .
     * @param {string} message .
     * @private
     */
    _log(test, message) {
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
    static get RUN_START() {
        return 'runStart';
    }

    /**
     * @returns {string} .
     */
    static get RUN_END() {
        return 'runEnd';
    }

    /**
     * @returns {string} .
     */
    static get RUN_CANCEL() {
        return 'runCancel';
    }

    /**
     * @returns {string} .
     */
    static get TEST_START() {
        return 'testStart';
    }

    /**
     * @return {string}
     */
    static get TEST_MODEL() {
        return 'testModel';
    }

    /**
     * @returns {string} .
     */
    static get TEST_PASS() {
        return 'testPass';
    }

    /**
     * @returns {string} .
     */
    static get TEST_FAIL() {
        return 'testFail';
    }

    /**
     * @returns {string} .
     */
    static get TEST_ERROR() {
        return 'testError';
    }

    /**
     * @returns {string} .
     */
    static get TEST_SKIP() {
        return 'testSkip';
    }

    /**
     * @returns {string} .
     */
    static get TEST_LOG() {
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
