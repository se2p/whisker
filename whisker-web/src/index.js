import i18next from 'i18next';
import locI18next from 'loc-i18next';
import {NeatestSuiteExecutor} from 'whisker-main/src/whisker/agentTraining/suiteExecutor/NeatestSuiteExecutor';
import {QSuiteExecutor} from 'whisker-main/src/whisker/agentTraining/suiteExecutor/QSuiteExecutor';
import {StateActionRecorder} from 'whisker-main/src/whisker/agentTraining/neuroevolution/misc/StateActionRecorder';
import {Randomness} from 'whisker-main/src/whisker/utils/Randomness';
import {FileSaver} from './web-libs';
import uid from 'scratch-vm/src/util/uid';
import {Container} from 'whisker-main/src/whisker/utils/Container';
import JSZip from 'jszip';

/* Translation resources */
const indexDE = require('./locales/de/index.json');
const indexEN = require('./locales/en/index.json');
const aboutDE = require('./locales/de/about.json');
const aboutEN = require('./locales/en/about.json');
const snippetsDE = require('./locales/de/snippets.json');
const snippetsEN = require('./locales/en/snippets.json');
const tutorialDE = require('./locales/de/tutorial.json');
const tutorialEN = require('./locales/en/tutorial.json');
const contactDE = require('./locales/de/contact.json');
const contactEN = require('./locales/en/contact.json');
const imprintDE = require('./locales/de/imprint.json');
const imprintEN = require('./locales/en/imprint.json');
const privacyDE = require('./locales/de/privacy.json');
const privacyEN = require('./locales/en/privacy.json');
const footerDE = require('./locales/de/footer.json');
const footerEN = require('./locales/en/footer.json');
const headerDE = require('./locales/de/header.json');
const headerEN = require('./locales/en/header.json');
const modelEditorDE = require('./locales/de/modelEditor.json');
const modelEditorEN = require('./locales/en/modelEditor.json');

/* Important libraries */
const {$} = require('./web-libs');

/* Replace this with the path of whisker's source for now. Will probably be published as a npm module later. */
const {CoverageGenerator, TestRunner, TAP13Listener, Search, TAP13Formatter, ModelTester} = require('whisker-main');

/* Components */
const TestTable = require('./components/test-table');
const TestEditor = require('./components/test-editor');
const Scratch = require('./components/scratch-stage');
const FileSelect = require('./components/file-select');
const Output = require('./components/output');
const InputRecorder = require('./components/input-recorder');
require('./components/footer'); // attaches an event listener as side effect
require('./components/header'); // attaches an event listener as side effect
const ModelEditor = require('./components/model-editor');

const {showModal, escapeHtml} = require('./utils.js');
const logger = require('./logger');
const Whisker = window.Whisker = {};
window.$ = $;

/* Acceleration */
const DEFAULT_ACCELERATION_FACTOR = 1;
const accSlider = $('#acceleration-factor').slider();

const useBBTToggle = $('#use-bbt-tests');
const useBBTAddCommentToggleRow = $('#use-bbt-tests-add-comment-row');
const useBBTAddCommentToggle = $('#use-bbt-tests-add-comment');

/**
 * Comment text limit, imposed by scratch-blocks (core/scratch_block_comment.js)
 * @type {number}
 */
const BLOCKLY_COMMENT_TEXT_LIMIT = 8000;

const LANGUAGE_OPTION = 'lng';
const initialParams = new URLSearchParams(window.location.search); // This is only valid for initialization and has to be retrieved again afterwards
const initialLanguage = initialParams.get(LANGUAGE_OPTION); // This is only valid for initialization and has to be retrieved again afterwards

let testsRunning = false;

const defaultTracerSettings = {
    traceBlockCoverage: true,
    traceBranchCoverage: true,
    traceAttributes: false,
    traceDebug: false
};

/**
 * Combines both Whisker and block-based tests into a single array.
 *
 * @return {(Test[]|string)} the combined array
 */
const getCombinedWhiskerAndBBTTests = function () {
    if (typeof Whisker.tests === 'string') {
        return Whisker.tests;
    }

    let combined = [];

    if (Whisker.bbtTests) {
        combined = combined.concat(Array.from(Whisker.bbtTests.values()));
    }

    if (Array.isArray(Whisker.tests)) {
        combined = combined.concat(Whisker.tests);
    }

    return combined;
};

const loadModelFromString = function (models, userModels) {
    try {
        if (userModels) {
            Whisker.modelTester.loadUserModels(models);
            if (!Whisker.modelTester.userModelsLoaded()) {
                showModal('Model Loading', `<div class="mt-1">${i18next.t('err-no-user-model-in-file')}</div>`);
            }
        } else {
            Whisker.modelTester.loadProgramModels(models);
            if (!Whisker.modelTester.programModelsLoaded()) {
                showModal('Model Loading', `<div class="mt-1">${i18next.t('err-no-program-model-in-file')}</div>`);
            }
        }
    } catch (err) {
        Whisker.outputLog.println(`ERROR: ${err.message}`);
        logger.error(err);
        const message = `${err.name}: ${err.message}`;
        showModal('Model Loading', `<div class="mt-1"><pre>${escapeHtml(message)}</pre></div>`);
        throw err;
    }
};

const loadTestsFromString = async function (string) {
    // Check for Neuroevolution TestSuites.
    const testString = `${string}`;
    if ((testString.includes('"Static":') && testString.includes('"Dynamic":')) ||
        (testString.toLowerCase().includes('network') && testString.toLowerCase().includes('nodes'))) {
        Whisker.tests = testString;
        Whisker.testEditor.setValue(string);
        return testString;
    }

    if (testString.includes('"usage": "program"') || testString.includes('"usage": "user"') ||
        testString.includes('"usage": "end"')) {
        loadModelFromString(testString, true);
        Whisker.tests = null;
        Whisker.testEditor.setValue('');
        return '';
    }
    // Manually generated test suite or test suite generated through search algorithms.
    let tests;
    try {
        /*
         * Evil hack: Every Whisker test is a CommonJS module. As such, it contains a "module.exports"
         * declaration at the end. In the browser, CommonJS modules usually cannot be used as the global
         * "module" object does not exist there. For our purposes, we work around this by creating an empty
         * dummy object called "module", letting the test set the "module.exports" property, and return that as
         * result of evaluating the test.
         */
        // IMPORTANT!!!
        // DO NOT CHANGE THE FORMATTING OF THE NEXT LINE OR CODE WILL BREAK!                                    (lol)
        // For some parts of Whisker (e.g., program repair) it is important not to change the stack traces of Whisker
        // tests, which would be the case if, e.g., line breaks were added in the code below to put every statement
        // on one line.
        // @formatter:off
        /* eslint-disable-next-line no-eval */
        tests = eval(`(function () { const module = Object.create(null); ${string}; return module.exports; })();`);
        // @formatter:on
    } catch (err) {
        logger.error(err);
        const message = `${err.name}: ${err.message}`;
        showModal('Test Loading', `An error occurred while parsing the test code:<br>
            <div class="mt-1"><pre>${escapeHtml(message)}</pre></div>`);
        throw err;
    }
    tests = TestRunner.convertTests(tests);
    Whisker.tests = tests;
    Whisker.testsString = string;
    Whisker.testEditor.setValue(string);

    Whisker.testTable.setTests(getCombinedWhiskerAndBBTTests());

    return tests;
};

/**
 * Load Block-Based Tests into Whisker and the test table.
 *
 * @param {Map<string, Test>} bbtTests A map of Block-Based Tests to load.
 */
const setBBTTests = function (bbtTests) {
    Whisker.bbtTests = bbtTests;

    // only update the test table if the project contains
    // BBT tests and Whisker.tests does not contain
    // Neuroevolution TestSuites (-> string)
    if (bbtTests.size > 0 && typeof Whisker.tests !== 'string') {
        Whisker.testTable.setTests(getCombinedWhiskerAndBBTTests());
    }
};

/**
 * Run a Block-Based Test.
 * Can be awaited for to continue after the test has ended.
 * Test result evaluation is not done here, but in test-table.js!
 *
 * @param {object} bbtTest A BBT test object.
 */
const runBBTTest = async function (bbtTest) {
    await new Promise(resolve => {

        if (Whisker.scratch.vm.runtime.testRunning) {
            logger.error('runBBTTest aborted: testRunning!');
            resolve();
        }

        if (bbtTest.isRunning) {
            logger.error('runBBTTest aborted: this BBT test is already running!');
            resolve();
        }

        // I'm unsure why stopping and starting the VM is necessary.
        // For individual test runs, the VM of course must be running/started.
        // However, stopping is also necessary? BBT tests restore the original state
        // after execution, but here it does not work without the stop instruction.
        Whisker.scratch.stop();

        const seed = document.getElementById('seed').value;

        if (seed) {
            Randomness.setInitialSeeds(seed);
            Randomness.seedScratch(Whisker.scratch.vm);
        }

        Whisker.scratch.start();

        bbtTest.isRunning = true;
        bbtTest.testResultClass = null;
        bbtTest.testResultSign = null;
        bbtTest.translatedTestResult = null;
        bbtTest.error = null;
        bbtTest.bbtError = null;
        bbtTest.log = [];
        bbtTest.bbtPassingAssertionCount = 0;

        const handleTestEnd = topBlockId => {
            if (topBlockId === bbtTest.hatBlockId) {
                // eslint-disable-next-line no-use-before-define
                removeListeners();
                bbtTest.isRunning = false;
                resolve();
            }
        };

        const handleTestAbort = () => {
            // eslint-disable-next-line no-use-before-define
            removeListeners();
            // bbtTest.isRunning is set to false in test-table.js,
            // as tests that were running at the time of the abortion must be detectable somehow!
            resolve();
        };

        const removeListeners = () => {
            Whisker.scratch.vm.removeListener('BBT_TEST_FINISHED_NATURALLY', handleTestEnd);
            Whisker.scratch.vm.removeListener('BBT_TEST_TIMEOUT', handleTestEnd);
            Whisker.scratch.vm.removeListener('PROJECT_RUN_STOP', handleTestAbort);
        };

        Whisker.scratch.vm.addListener('BBT_TEST_FINISHED_NATURALLY', handleTestEnd);
        Whisker.scratch.vm.addListener('BBT_TEST_TIMEOUT', handleTestEnd);
        Whisker.scratch.vm.addListener('PROJECT_RUN_STOP', handleTestAbort);

        // This is where the BBT test is actually started:
        // the hat block is pushed for execution in a thread by the VM.
        Whisker.scratch.vm.runtime._pushThread(bbtTest.hatBlockId,
            Whisker.scratch.vm.runtime.getTargetById(bbtTest.containingSpriteId), null);
    });
};

const enableVMRelatedButtons = function () {
    $('.vm-related').prop('disabled', false);
};

const downloadMutants = async function (projectName, mutants) {
    for (const mutant of mutants) {
        await Whisker.scratch.vm.loadProject(JSON.parse(JSON.stringify(mutant)));
        const projectBlob = await Whisker.scratch.vm.saveProjectSb3(); // await required
        FileSaver.saveAs(projectBlob, `${projectName.split('.')[0]}-${mutant.mutantName}.sb3`);
    }
};

const injectBBTsAndDownloadProject = async function (projectName, blockBasedTests) {
    const stageTarget = Whisker.scratch.vm.runtime.getTargetForStage();

    blockBasedTests.forEach(bbt => {
        const hatBlock = bbt.blocks[0];

        bbt.blocks.forEach(block => {
            stageTarget.blocks.createBlock(block);
        });

        if (bbt.comment !== null && bbt.comment.length > 0 && bbt.comment.length < BLOCKLY_COMMENT_TEXT_LIMIT) {
            stageTarget.createComment(uid(), hatBlock.id, bbt.comment,
                hatBlock.x + 500, hatBlock.y, 250, 300, false);
        }
    });

    const updatedProject = await Whisker.scratch.vm.saveProjectSb3();

    const element = document.createElement('a');
    element.setAttribute('href', window.URL.createObjectURL(updatedProject));
    element.setAttribute('download', projectName.replace(/\.sb3$/, '_bbt.sb3'));
    element.click();
};

const _enableVMRelatedButtons = function () {
    $('.vm-related').prop('disabled', false);
};

const _disableVMRelatedButtons = function (exception) {
    $(`.vm-related:not(${exception})`).prop('disabled', true);
};

const runSearch = async function () {
    _disableVMRelatedButtons('#run-search');
    accSlider.slider('disable');
    Whisker.scratch.stop();
    const projectName = Whisker.projectFileSelect.getName();
    const configName =
        Whisker.configFileSelect.hasName() ?
            Whisker.configFileSelect.getName() :
            'mio.json';
    logger.info(`loading project ${projectName}`);
    const project = await Whisker.projectFileSelect.loadAsArrayBuffer();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();
    await Whisker.scratch.vm.loadProject(project);
    const config = await Whisker.configFileSelect.loadAsString();
    const accelerationFactor = $('#acceleration-value').text();
    const seed = document.getElementById('seed').value;
    const generateBBTs = useBBTToggle.is(':checked');
    const generateBBTsAddComment = useBBTAddCommentToggle.is(':checked');
    const groundTruth = document.querySelector('#container').groundTruth;
    const winningStates = document.querySelector('#container').winningStates;
    const searchResult = await Whisker.search.run(
        Whisker.scratch.vm, Whisker.scratch.project, projectName, config, configName,
        accelerationFactor, seed, generateBBTs, groundTruth, winningStates, generateBBTsAddComment);

    // Prints uncovered blocks summary and csv summary separated by a newline
    Whisker.outputLog.print(`${searchResult.summary}\n`);
    Whisker.outputLog.print(searchResult.csvOutput);
    Whisker.testEditor.setProjectName(projectName);
    accSlider.slider('enable');

    if (generateBBTs) {
        await injectBBTsAndDownloadProject(projectName, searchResult.blockBasedTests);
    }

    _enableVMRelatedButtons();
    return searchResult;
};

const _generateResults = function (coverage, coverageModels, summary) {
    if (typeof window.messageServantCallback !== 'function') {
        return;
    }
    const coveredBlockIdsPerSprite =
        [...coverage.coveredBlockIdsPerSprite].map(elem => ({key: elem[0], values: [...elem[1]]}));
    const blockIdsPerSprite =
        [...coverage.blockIdsPerSprite].map(elem => ({key: elem[0], values: [...elem[1]]}));

    const modelCoverage = [];
    if (Whisker.modelTester.programModelsLoaded()) {
        for (const modelName in coverageModels) {
            const content = [];
            const elem = coverageModels[modelName];
            content.push({key: 'covered', values: elem.covered});
            content.push({key: 'total', values: elem.total});
            content.push({key: 'missedEdges', values: elem.missedEdges});
            modelCoverage.push({key: modelName, values: content});
        }
    }
    const serializableCoverageObject = {coveredBlockIdsPerSprite, blockIdsPerSprite};
    const serializableModelCoverage = {modelCoverage};
    window.messageServantCallback({serializableCoverageObject, summary, serializableModelCoverage});
};

const _printSummaryForTestsAndModels = function (summary, coverage) {
    const coverageModels = Whisker.modelTester.getTotalCoverage(true);

    _generateResults(coverage, coverageModels, summary);

    const formattedSummary = TAP13Formatter.formatSummary(summary);
    const formattedCoverage = TAP13Formatter.formatCoverage(coverage.getCoveragePerSprite());

    const summaryString = TAP13Formatter.extraToYAML({summary: formattedSummary});
    const coverageString = TAP13Formatter.extraToYAML({coverage: formattedCoverage});

    let modelCoverageString = '';

    // Add model coverage if we have model-based results
    if (Object.keys(coverageModels).length > 0) {
        const formattedModelCoverage = TAP13Formatter.formatModelCoverage(coverageModels);
        modelCoverageString = TAP13Formatter.extraToYAML({modelCoverage: formattedModelCoverage});
    }

    Whisker.outputRun.println([
        summaryString,
        coverageString,
        modelCoverageString
    ].join('\n'));
};

const _isNeatestSuite = function () {
    return (`${Whisker.tests}`.toLowerCase().includes('network') && `${Whisker.tests}`.toLowerCase().includes('nodes'));
};

const _isRLSuite = function () {
    return `${Whisker.tests.name}`.split('.').pop() === 'zip';
};

const _isAgentSuite = function () {
    return _isNeatestSuite() || _isRLSuite();
};

const _showRunIcon = () => {
    $('#run-tests-icon').show();
    $('#stop-tests-icon').hide();
    $('#run-all-tests').off('click');

    // Suppress the rule for this line because there's a cyclic dependency.
    // eslint-disable-next-line no-use-before-define
    $('#run-all-tests').on('click', runAllTests);
};

/**
 * Abort running all tests.
 */
const abortRunAllTests = function () {
    if (!testsRunning) {
        return;
    }
    testsRunning = false;

    Whisker.outputLog.println('Stop-Button pressed, aborting...');
    Whisker.outputRun.println('Stop-Button pressed, aborting...');

    Whisker.scratch.stop();
    Whisker.testRunner.abort();
    Whisker.testTable.updateAfterAbort();
    accSlider.slider('enable');
    _showRunIcon();
    _enableVMRelatedButtons();
};

const _showStopIcon = () => {
    $('#run-tests-icon').hide();
    $('#stop-tests-icon').show();
    $('#run-all-tests').off('click');
    $('#run-all-tests').on('click', abortRunAllTests);
};

const runAllBBTTests = async function () {
    const bbtTests = Array.from(Whisker.bbtTests.values());

    for (const bbtTest of bbtTests) {
        if (!testsRunning) {
            // Test chain execution might have been stopped,
            // don't continue starting new tests.
            return;
        }

        await runBBTTest(bbtTest);
    }
};

const _runTestsWithCoverage = async function (vm, project, tests, tracerSettings, headless) {

    // Activate listener for tracing executed blocks
    tracerSettings.traceAttributes = document.querySelector('#container').traceAttributes;
    if (tracerSettings.traceAttributes) {
        Whisker.testRunner.on(TestRunner.RUN_END, () => {
            const blob = new Blob([JSON.stringify(Whisker.testRunner.attributeTraces)],
                {type: 'application/json;charset=utf-8'});
            FileSaver.saveAs(blob, `BlockTrace-${Whisker.projectFileSelect.getName()}.json`);
        });
    }

    let summary = null;
    let csvResults;
    let coverage;
    let coveragePerTest;
    let timingsPerTest;

    const setMutators = document.querySelector('#container').mutators;
    const mutantDownload = document.querySelector('#container').downloadMutants;

    const props = {
        accelerationFactor: $('#acceleration-value').text(),
        seed: document.getElementById('seed').value,
        projectName: Whisker.projectFileSelect.getName(),
        mutators: !setMutators || setMutators === '' ? ['NONE'] : setMutators,
        mutationBudget: document.querySelector('#container').mutationBudget,
        maxMutants: document.querySelector('#container').maxMutants,
        mutantDownload: mutantDownload,
        log: true,
        headless,
        useSaveStates: $('#use-save-states').is(':checked'),
        ...tracerSettings
    };

    let mutantPrograms = [];
    try {
        if (props.useSaveStates) {
            // Loading the project again seems unnecessary here. But removing
            // this line can cause occasional crashes in the renderer when
            // restoring the save state between test executions. See issue #217.
            await vm.loadProject(project);
        }

        vm.runtime.onBlockCovered(blockId => CoverageGenerator._coverBlock(blockId));

        CoverageGenerator.prepareVM(vm);

        [summary, csvResults, mutantPrograms, coveragePerTest, timingsPerTest] =
            await Whisker.testRunner.runTests(vm, project, tests, Whisker.modelTester, props);
        coverage = CoverageGenerator.getCoverage();
        Whisker.outputLog.println(csvResults);

        // Download generated mutants if desired.
        if (mutantDownload && mutantPrograms.length > 0) {
            await downloadMutants(props.projectName, mutantPrograms);
        }
    } catch (e) {
        logger.error('Error while running tests:', e instanceof Error ? e.stack : e);
        throw e;
    } finally {
        _showRunIcon();
        enableVMRelatedButtons();
        accSlider.slider('enable');
        testsRunning = false;
    }

    if (summary === null) {
        return [coveragePerTest, timingsPerTest];
    }

    _printSummaryForTestsAndModels(summary, coverage);

    return [coveragePerTest, timingsPerTest];
};

const runAllTests = async function () {
    $('#run-all-tests').tooltip('hide');

    const durationValue = Number(document.querySelector('#model-duration').value);
    Whisker.modelTester.duration = durationValue <= 0 || Number.isNaN() ? 35000 : durationValue * 1000;
    Whisker.modelTester.repetitions = Math.max(1, Number(document.querySelector('#model-repetitions').value) ?? 1);

    Whisker.modelTester.clear();

    if (Whisker.testFileSelect.files.length > 0 && Whisker.testFileSelect.getName().endsWith('.json')) {
        // Long tests, for example saved networks in Dynamic Suites, can take some time to be loaded;
        // Hence we wait a second before checking if tests are loaded.
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if ((!Whisker.bbtTests || Whisker.bbtTests.size === 0) &&
        (!Whisker.tests || Whisker.tests.length === 0) &&
        !Whisker.modelTester.someModelLoaded()) {
        showModal(i18next.t('test-execution'), i18next.t('no-tests'));
        return;
    } else if (!Whisker.projectFileSelect || Whisker.projectFileSelect.length() === 0) {
        showModal(i18next.t('test-execution'), i18next.t('no-project'));
        return;
    }
    Whisker.scratch.stop();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();

    // Agent Suite
    if (Whisker.tests && _isAgentSuite()) {
        let coverage;
        let summary;
        try {
            await Whisker.scratch.vm.loadProject(Whisker.scratch.project);

            Whisker.scratch.vm.runtime.onBlockCovered(blockId => CoverageGenerator._coverBlock(blockId));

            CoverageGenerator.prepareVM(Whisker.scratch.vm);

            const properties = {};
            const setMutators = document.querySelector('#container').mutators;
            const mutators = !setMutators || setMutators === '' ? ['NONE'] : setMutators;
            const maxMutants = document.querySelector('#container').maxMutants;
            const mutantDownload = document.querySelector('#container').downloadMutants;

            properties.projectName = Whisker.projectFileSelect.getName();
            properties.testName = Whisker.testFileSelect.getName();
            properties.acceleration = $('#acceleration-value').text();
            properties.seed = document.getElementById('seed').value;
            properties.mutators = mutators;
            properties.maxMutants = maxMutants;
            properties.downloadMutants = mutantDownload;
            properties.activationTraceRepetitions = document.querySelector('#container').activationTraceRepetitions;
            properties.winningStates = document.querySelector('#container').winningStates;

            let suiteExecutor;
            if (_isNeatestSuite()) {
                suiteExecutor = new NeatestSuiteExecutor(Whisker.scratch.project, Whisker.scratch.vm, properties,
                    Whisker.tests);
            } else {
                const zip = await JSZip.loadAsync(Whisker.tests);
                suiteExecutor = new QSuiteExecutor(Whisker.scratch.project, Whisker.scratch.vm, properties, zip);
            }

            const [csv, spriteTraces, mutantPrograms] = await suiteExecutor.execute(Whisker.modelTester);
            summary = Container.vmWrapper.getTestResultsSummary();
            // Download generated mutants if desired.
            if (mutantDownload && mutantPrograms.length > 0) {
                await downloadMutants(properties.projectName, mutantPrograms);
            }

            if (spriteTraces) {
                document.querySelector('#container').spriteTraces = spriteTraces;
            }

            coverage = CoverageGenerator.getCoverage();
            Whisker.outputLog.println(csv);
        } finally {
            _showRunIcon();
            enableVMRelatedButtons();
            accSlider.slider('enable');
            testsRunning = false;
        }

        if (!coverage) {
            return;
        }

        if (Whisker.modelTester.someModelLoaded()) {
            _printSummaryForTestsAndModels(summary, coverage);
        } else {
            const formattedCoverage = TAP13Formatter.formatCoverage(coverage.getCoveragePerSprite());
            const coverageString = TAP13Formatter.extraToYAML({coverage: formattedCoverage});

            Whisker.outputRun.println([
                coverageString
            ].join('\n'));
        }

    } else { // Static Suite
        for (let i = 0; i < Whisker.projectFileSelect.length(); i++) {
            const project = await Whisker.projectFileSelect.loadAsArrayBuffer(i);
            Whisker.outputRun.println(`# project: ${Whisker.projectFileSelect.getName(i)}`);
            Whisker.outputLog.println(`# project: ${Whisker.projectFileSelect.getName(i)}`);

            _disableVMRelatedButtons('#run-all-tests');
            testsRunning = true;
            _showStopIcon();
            $('#green-flag').prop('disabled', true);
            $('#reset').prop('disabled', true);
            $('#record').prop('disabled', true);
            accSlider.slider('disable');

            // Test chain execution might have been stopped, therefore check testsRunning
            if (testsRunning && Whisker.bbtTests && Whisker.bbtTests.size > 0) {
                Whisker.outputRun.println(`${Whisker.bbtTests.size} Block-Based Tests found in project!`);
                Whisker.outputLog.println(`${Whisker.bbtTests.size} Block-Based Tests found in project!`);
                await runAllBBTTests();
                Whisker.outputRun.println('Block-Based Tests have finished!');
                Whisker.outputLog.println('Block-Based Tests have finished!');
            }

            if (testsRunning && // Test chain execution might have been stopped
                ((Whisker.tests && Whisker.tests.length > 0) ||
                    Whisker.modelTester.someModelLoaded())) {

                await _runTestsWithCoverage(Whisker.scratch.vm, project, Whisker.tests, defaultTracerSettings, false);
            }

            // I suppressed the eslint error for this line because we have been using this for years now, I don't think
            // we ever noticed a problem -> Likely a false positive.
            // eslint-disable-next-line require-atomic-updates
            testsRunning = false;

            _showRunIcon();
            _enableVMRelatedButtons();
            $('#green-flag').prop('disabled', false);
            $('#reset').prop('disabled', false);
            $('#record').prop('disabled', false);
            accSlider.slider('enable');

            Whisker.outputRun.println();
            Whisker.outputLog.println();
        }
    }
};

const runTest = async function (test) {
    Whisker.scratch.stop();
    const project = await Whisker.projectFileSelect.loadAsArrayBuffer();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();
    await _runTestsWithCoverage(Whisker.scratch.vm, project, [test], Whisker.testRunner, defaultTracerSettings, false);
};

/**
 * Runs a single test. Detects if it's a Whisker test or a block-based test.
 *
 * @param {object} test The test object to run.
 */
const runSingleTest = async function (test) {
    if (test.type && test.type === 'BBT') {
        await runBBTTest(test);
    } else {
        await runTest(test);
    }
};

const abortTestRun = function () {
    Whisker.scratch.stop();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();
};

window.Whisker.runTestsForRepair = async function () {
    abortTestRun();

    const vm = Whisker.scratch.vm;
    const project = await Whisker.projectFileSelect.loadAsArrayBuffer(0);

    // Seems to be necessary to load the project here as well (even though it is also loaded by the test runner later).
    // But if we don't load it here, the VMWrapper fails to set or restore the save state because stuff is undefined.
    await vm.loadProject(project);

    // Performance optimizations: Avoid overhead caused by tracing used by test generation etc.
    const tracerSettings = {
        traceBlockCoverage: false,
        traceBranchCoverage: false,
        traceAttributes: false,
        traceDebug: false
    };

    const [traces, timings] = await _runTestsWithCoverage(vm, project, Whisker.tests, tracerSettings, true);

    for (const trace of traces) {
        // Rename the property key "coveredBlocks" to "covered".
        trace.covered = trace.coveredBlocks;
        delete trace.coveredBlocks;

        // Add coverage level information.
        trace.level = 'block';
    }

    const resetProject = timings.reduce((s, timing) => timing.resetProject + s, 0);
    const runTests = timings.reduce((s, timing) => timing.runTest + s, 0);

    // The coverage achieved by the entire test suite.
    const {covered, total} = CoverageGenerator.getCoverage().getCoverageTotal();

    return {
        traces,
        coverage: covered / total,
        timings: {
            resetProject,
            runTests
        }
    };
};

const initScratch = function () {
    Whisker.scratch = new Scratch(document.querySelector('#scratch-stage'));
};

/**
 * Extracts Block-Based Tests contained in the provided Scratch project.
 * Note that this loads the provided project into the VM!
 * @param {object} project the Scratch project to extract BBTs from
 */
const loadProjectAndExtractBlockBasedTests = async function (project) {

    // Cannot use a separate "dummy" VM for this, as VM instances have ties to window
    await Whisker.scratch.vm.loadProject(project);

    const newTestStore = {
        globalVariables: [],
        targetsWithTests: {}
    };

    // global variables are actually just the (regular/local) variables of the stage!
    newTestStore.globalVariables = Whisker.scratch.vm.runtime.getTargetForStage().variables;

    const originalTargets = Whisker.scratch.vm.runtime.targets.filter(target => target.isOriginal);

    for (const target of originalTargets) {
        let targetContainsTests = false;
        const spriteName = target.isStage ? '_stage_' : target.sprite.name;

        for (const script of target.blocks.getScripts()) {

            const topBlock = target.blocks.getBlock(script);
            if (!topBlock || topBlock.opcode !== 'bbt_testHat') {
                continue;
            }

            targetContainsTests = true;

            if (!(spriteName in newTestStore.targetsWithTests)) {
                newTestStore.targetsWithTests[spriteName] = {
                    comments: {},
                    localVariables: {},
                    testScripts: []
                };
            }

            const xmlString = target.blocks.blockToXML(script, target.comments);
            newTestStore.targetsWithTests[spriteName].testScripts.push(xmlString);
        }

        if (targetContainsTests) {

            // local variables of the stage == global variables, stored already
            if (!target.isStage) {
                newTestStore.targetsWithTests[spriteName].localVariables =
                    Object.assign({}, target.variables);
            }

            newTestStore.targetsWithTests[spriteName].comments =
                Object.assign({}, target.comments);
        }
    }

    Whisker.bbtTestStore = newTestStore;
};

/**
 * Removes all Block-Based Tests from the currently loaded project.
 * @return {number} the number of BBTs before removing
 */
const removeAllBBTTestsFromCurrentProject = function () {
    let numberOfBBTsBeforeRemoving = 0;

    for (const target of Whisker.scratch.vm.runtime.targets) {

        Object.values(target.blocks._blocks)
            .filter(block => block.opcode === 'bbt_testHat')
            .forEach(bbtTestHatBlock => {
                numberOfBBTsBeforeRemoving++;
                target.blocks.deleteBlock(bbtTestHatBlock.id);
            });
    }

    return numberOfBBTsBeforeRemoving;
};

/**
 * Injects (previously extracted from another project) Block-Based Tests
 * into the currently loaded project. Reads from Whisker.bbtTestStore.
 */
const injectTestsFromTestStore = function () {
    const stage = Whisker.scratch.vm.runtime.getTargetForStage();

    for (const gv of Object.values(Whisker.bbtTestStore.globalVariables)) {
        stage.createVariable(gv.id, gv.name, gv.type, gv.isCloud);
    }

    for (const spriteName of Object.keys(Whisker.bbtTestStore.targetsWithTests)) {

        const currTarget = spriteName === '_stage_' ? stage :
            Whisker.scratch.vm.runtime.getSpriteTargetByName(spriteName);

        if (!currTarget) {
            Whisker.outputLog.println(`ERROR: Target ${spriteName} not found, cannot inject tests!`);
            continue;
        }

        for (const comment of Object.values(Whisker.bbtTestStore.targetsWithTests[spriteName].comments)) {
            currTarget.createComment(comment.id, comment.blockId, comment.text,
                comment.x, comment.y, comment.width, comment.height, comment.minimized);
        }

        for (const localVariable of Object.values(Whisker.bbtTestStore.targetsWithTests[spriteName].localVariables)) {
            currTarget.createVariable(localVariable.id, localVariable.name, localVariable.type);
        }

        for (const testScript of Whisker.bbtTestStore.targetsWithTests[spriteName].testScripts) {
            Whisker.scratch.vm.createBlocksFromDomString(currTarget, testScript);
        }
    }
};

/**
 * Handles the onload event of the project file FileSelect element.
 * @param {FileSelect} fileSelect the FileSelect element for project files
 */
const handleOnLoadProjectFile = async function (fileSelect) {
    const project = await fileSelect.loadAsArrayBuffer();
    await Whisker.scratch.loadProject(project);

    // BBTs contained in _project_ files are not respected!
    const numberOfContainedBBTs = removeAllBBTTestsFromCurrentProject();
    if (numberOfContainedBBTs > 0) {
        document.getElementById('project-contains-bbts-tooltip-link').click();
    }

    if (Whisker.bbtTestStore) {
        // Test store contains tests, this means a project file
        // containing BBTs was provided earlier as _test_ file.
        injectTestsFromTestStore();
        setBBTTests(Whisker.scratch.getBBTTestsOfCurrentProject());

    } else if (Array.isArray(Whisker.tests)) {
        Whisker.tests.forEach(whiskerTest => {
            Whisker.testTable.resetRunDataAndShow(whiskerTest);
        });
    }
};

/**
 * Handles the onload event of the test file FileSelect element.
 * @param {FileSelect} fileSelect the FileSelect element for test files
 */
const handleOnLoadTestFile = async function (fileSelect) {
    const fileExtension = fileSelect.files[0].name.split('.').pop();
    if (fileExtension === 'sb3') {

        const project = await fileSelect.loadAsArrayBuffer();
        await loadProjectAndExtractBlockBasedTests(project);

        if (Whisker.projectFileSelect.files.length > 0) {
            await Whisker.scratch.loadProject(await Whisker.projectFileSelect.loadAsArrayBuffer());
        }

        const bbtTestStoreContainsTests = Object.keys(Whisker.bbtTestStore.targetsWithTests).length > 0;

        if (!bbtTestStoreContainsTests) {
            // a .sb3 file is loaded as test file, but it does not contain BBTs!
            document.getElementById('no-bbts-tooltip-link').click();
            return;
        }

        if (!Whisker.scratch.project) {
            // no project loaded
            return;
        }

        // clear regular Whisker tests, BBT tests are replaced during setBBTTests(..)
        Whisker.tests = null;
        Whisker.testsString = null;
        Whisker.testEditor.setDefaultValue();

        injectTestsFromTestStore();
        setBBTTests(Whisker.scratch.getBBTTestsOfCurrentProject());

    } else if (fileExtension === 'zip') {
        Whisker.tests = fileSelect.files[0];
    } else {
        // clear BBT tests, regular Whisker tests are replaced during loadTestsFromString(..)
        Whisker.bbtTests = null;
        Whisker.bbtTestStore = null;

        await fileSelect.loadAsString()
            .then(string => loadTestsFromString(string));
    }
};

const initComponents = function () {
    Whisker.outputRun = new Output($('#output-run')[0]);
    Whisker.outputLog = new Output($('#output-log')[0]);
    Whisker.testEditor = new TestEditor($('#test-editor')[0], loadTestsFromString);
    Whisker.testEditor.setDefaultValue();
    Whisker.testEditor.show();

    Whisker.projectFileSelect = new FileSelect($('#fileselect-project')[0], handleOnLoadProjectFile);
    Whisker.testFileSelect = new FileSelect($('#fileselect-tests')[0], handleOnLoadTestFile);
    Whisker.modelFileSelect = new FileSelect($('#fileselect-models')[0],
        fileSelect => fileSelect.loadAsString().then(string => loadModelFromString(string, false)));

    Whisker.testRunner = new TestRunner();
    Whisker.testRunner.on(TestRunner.TEST_LOG,
        (test, message) => Whisker.outputLog.println(`[${test.name}] ${message}`));
    Whisker.testRunner.on(TestRunner.TEST_ERROR, result => logger.error(result.error));

    Whisker.testTable = new TestTable($('#test-table')[0], runSingleTest, Whisker.testRunner);
    Whisker.testTable.setTests([]);
    Whisker.testTable.show();

    Whisker.modelTester = ModelTester.ModelTester.getInstance();

    Whisker.tap13Listener = new TAP13Listener(Whisker.testRunner, Whisker.modelTester,
        Whisker.outputRun.println.bind(Whisker.outputRun));

    Whisker.inputRecorder = new InputRecorder(Whisker.scratch);

    Whisker.search = new Search.Search(Whisker.scratch.vm);
    Whisker.configFileSelect = new FileSelect($('#fileselect-config')[0],
        fileSelect => fileSelect.loadAsArrayBuffer());


    Whisker.modelEditor = new ModelEditor(Whisker.modelTester);

    accSlider.slider('setValue', DEFAULT_ACCELERATION_FACTOR);
    $('#acceleration-value').text(DEFAULT_ACCELERATION_FACTOR);
};

const _jumpTo = elem => {
    location.href = '#'; // this line is required to work around a bug in WebKit (Chrome / Safari) according to stackoverflow
    location.href = elem;
    window.scrollBy(0, -100); // respect header size
};

const _showAndJumpTo = elem => {
    $(elem).show();
    _jumpTo(elem);
};

const _showTooltipIfTooLong = function (label, event) {
    $(event.target).parent()
        .tooltip('dispose');
    if (label.scrollWidth > label.offsetWidth) {
        $(event.target).parent()
            .tooltip({animation: true});
        setTimeout(() => {
            $(event.target).parent()
                .tooltip('hide');
        }, 2000);
    }
};

const _addFileListeners = function () {
    $('#fileselect-config').on('change', event => {
        const fileName = Whisker.configFileSelect.getName();
        $(event.target).parent()
            .removeAttr('data-i18n')
            .attr('title', fileName);
        const label = document.querySelector('#fileselect-config').parentElement.getElementsByTagName('label')[0];
        _showTooltipIfTooLong(label, event);
    });
    $('#fileselect-project').on('change', event => {
        const fileName = Whisker.projectFileSelect.getName();
        $(event.target).parent()
            .removeAttr('data-i18n')
            .attr('title', fileName);
        const label = document.querySelector('#fileselect-project').parentElement.getElementsByTagName('label')[0];
        _showTooltipIfTooLong(label, event);
        if (document.querySelector('#container').stateActionRecorder) {
            Whisker.stateActionRecorder = new StateActionRecorder(Whisker.scratch);
        }
    });
    $('#fileselect-tests').on('change', event => {
        const fileName = Whisker.testFileSelect.getName();
        $(event.target).parent()
            .removeAttr('data-i18n')
            .attr('title', fileName);
        const label = document.querySelector('#fileselect-tests').parentElement.getElementsByTagName('label')[0];
        _showTooltipIfTooLong(label, event);
    });
    $('#fileselect-models').on('change', event => {
        const fileName = Whisker.modelFileSelect.getName();
        $(event.target).parent()
            .removeAttr('data-i18n')
            .attr('title', fileName);
        const label = document.querySelector('#fileselect-models').parentElement.getElementsByTagName('label')[0];
        _showTooltipIfTooLong(label, event);
    });
};

const initEvents = function () {
    $('#acceleration-factor')
        .on('slide', slideEvt => {
            $('#acceleration-value').text(slideEvt.value);
        })
        .on('change', clickEvt => {
            $('#acceleration-value').text(clickEvt.value.newValue);
        });
    $('#green-flag').on('click', () => {
        if (!Whisker.projectFileSelect || Whisker.projectFileSelect.length() === 0) {
            showModal(i18next.t('test-generation'), i18next.t('no-project'));
        } else {
            Whisker.scratch.greenFlag();
        }
        if (Whisker.inputRecorder.isRecording()) {
            Whisker.inputRecorder.greenFlag();
        }
    });
    $('#stop-scratch').on('click', () => {
        Whisker.scratch.stop();
        if (Whisker.inputRecorder.isRecording()) {
            Whisker.inputRecorder.stop();
        }
        if (Whisker.stateActionRecorder.isRecording) {
            Whisker.stateActionRecorder.onStopAll();
        }
    });
    $('#reset').on('click', () => {
        $('#reset').tooltip('hide');
        if (!Whisker.tests || Whisker.tests.length === 0) {
            showModal(i18next.t('test-execution'), i18next.t('no-tests'));
        } else if (!Whisker.projectFileSelect || Whisker.projectFileSelect.length() === 0) {
            showModal(i18next.t('test-execution'), i18next.t('no-project'));
        } else {
            Whisker.scratch.reset().then();
        }
    });
    $('#run-all-tests').on('click', runAllTests);
    Whisker.inputRecorder.on('startRecording', () => {
        $('#record')
            .removeClass('btn-outline-danger')
            .addClass('btn-danger')
            .text(i18next.t('stop-record'));
    });
    Whisker.inputRecorder.on('stopRecording', () => {
        $('#record')
            .removeClass('btn-danger')
            .addClass('btn-outline-danger')
            .text(i18next.t('start-record'));
    });
    $('#record').on('click', () => {
        $('#record').tooltip('hide');
        if (document.querySelector('#container').stateActionRecorder) {
            if (Whisker.stateActionRecorder.isRecording) {
                Whisker.inputRecorder.emit('stopRecording');
                Whisker.stateActionRecorder.stopRecording();
                Whisker.scratch.disableInput();

                // Download the recording.
                const recording = Whisker.stateActionRecorder.getRecord();
                const blob = new Blob([JSON.stringify(recording)], {type: 'application/json;charset=utf-8'});
                FileSaver.saveAs(blob, `${Whisker.projectFileSelect.getName().replace('.sb3', '')}.json`);
            } else {
                Whisker.inputRecorder.emit('startRecording');
                Whisker.configFileSelect.loadAsString().then(config => Whisker.stateActionRecorder.startRecording(config));
                Whisker.scratch.enableInput();
            }
        } else if (Whisker.inputRecorder.isRecording()) {
            _enableVMRelatedButtons();
            Whisker.inputRecorder.stopRecording();
            Whisker.scratch.disableInput();
        } else {
            _disableVMRelatedButtons('.record-related');
            Whisker.scratch.enableInput();
            Whisker.inputRecorder.startRecording();
        }
    });

    const modelLog = msg => {
        Whisker.outputLog.println(msg);
    };
    const modelWarning = msg => {
        Whisker.outputLog.println(`MODEL WARNING: ${msg}`);
    };
    const modelCoverage = coverage => {
        const formattedModelCoverage = TAP13Formatter.formatModelCoverageLastRun(coverage);
        Whisker.outputLog.println(TAP13Formatter.extraToYAML({modelCoverageLastRun: formattedModelCoverage}));
    };
    const modelCheckbox = $('#model-logs-checkbox');
    modelCheckbox.prop('checked', true);
    Whisker.modelTester.on(ModelTester.ModelTester.MODEL_LOG, modelLog);
    Whisker.modelTester.on(ModelTester.ModelTester.MODEL_LOG_COVERAGE, modelCoverage);
    Whisker.modelTester.on(ModelTester.ModelTester.MODEL_LOG_MISSED_EDGES, edges =>
        Whisker.outputLog.println(TAP13Formatter.extraToYAML(edges)));
    Whisker.modelTester.on(ModelTester.ModelTester.MODEL_WARNING, modelWarning);
    modelCheckbox.on('change', event => {
        if ($(event.target).is(':checked')) {
            Whisker.modelTester.on(ModelTester.ModelTester.MODEL_LOG, modelLog);
            Whisker.modelTester.on(ModelTester.ModelTester.MODEL_LOG_COVERAGE, modelCoverage);
            Whisker.modelTester.on(ModelTester.ModelTester.MODEL_WARNING, modelWarning);
        } else {
            Whisker.modelTester.off(ModelTester.ModelTester.MODEL_LOG, modelLog);
            Whisker.modelTester.off(ModelTester.ModelTester.MODEL_LOG_COVERAGE, modelCoverage);
            Whisker.modelTester.off(ModelTester.ModelTester.MODEL_WARNING, modelWarning);
        }
    });
    $('#toggle-advanced').on('change', event => {
        if ($(event.target).is(':checked')) {
            $(event.target)
                .parent()
                .addClass('active');
            _showAndJumpTo('#scratch-controls');
        } else {
            $(event.target)
                .parent()
                .removeClass('active');
            $('#scratch-controls').hide();
        }
    });
    $('#toggle-test-editor').on('change', event => {
        if ($(event.target).is(':checked')) {
            $(event.target)
                .parent()
                .addClass('active');
            _showAndJumpTo('#test-editor-div');
            Whisker.testEditor.show();
        } else {
            $(event.target)
                .parent()
                .removeClass('active');
            $('#test-editor-div').hide();
        }
    });
    $('#toggle-model-editor').on('change', event => {
        if ($(event.target).is(':checked')) {
            $(event.target)
                .parent()
                .addClass('active');
            _showAndJumpTo('#model-editor');
            Whisker.modelEditor.reposition();
        } else {
            $(event.target)
                .parent()
                .removeClass('active');
            $('#model-editor').hide();
        }
    });
    $('#toggle-tap').on('change', event => {
        if ($(event.target).is(':checked')) {
            $(event.target)
                .parent()
                .addClass('active');
            _showAndJumpTo('#output-run');
        } else {
            $(event.target)
                .parent()
                .removeClass('active');
            $('#output-run').hide();
        }
    });
    $('#toggle-log').on('change', event => {
        if ($(event.target).is(':checked')) {
            $(event.target)
                .parent()
                .addClass('active');
            _showAndJumpTo('#output-log');
        } else {
            $(event.target)
                .parent()
                .removeClass('active');
            $('#output-log').hide();
        }
    });
    useBBTToggle.on('change', () => {
        useBBTAddCommentToggleRow.toggle(useBBTToggle.is(':checked'));
    });
    $('#run-search')
        .click('click', () => {
            if (!Whisker.projectFileSelect || Whisker.projectFileSelect.length() === 0) {
                showModal(i18next.t('test-generation'), i18next.t('no-project'));
            } else {
                $('#run-search').hide();
                $('#search-running').show();
                const tests = runSearch();
                tests.then(
                    result => {
                        if ('agentTests' in result){
                            Whisker.testEditor.setAgentTests(result.agentTests);
                        } else {
                            loadTestsFromString(result.javaScriptText).then();
                        }
                        _jumpTo('#test-table');
                        $('#run-search').show();
                        $('#search-running').hide();
                    }
                );
            }
        })
        .show();
    $('#search-running').hide();
    useBBTAddCommentToggleRow.hide();
    _addFileListeners();
};

const toggleComponents = function () {
    if (window.localStorage) {
        const componentStates = localStorage.getItem('componentStates');
        if (componentStates) {
            const [input, accelerationFactor] = JSON.parse(componentStates);
            if (input) $('#toggle-input').click();
            if (accelerationFactor) {
                accSlider.slider('setValue', accelerationFactor);
                $('#acceleration-value').text(accelerationFactor);
            }
        }
    }
};

const localize = locI18next.init(i18next, {
    selectorAttr: 'data-i18n', // selector for translating elements
    targetAttr: 'i18n-target',
    optionsAttr: 'i18n-options',
    useOptionsAttr: false,
    parseDefaultValueFromContent: true
});

const _updateLang = () => {
    localize('#body');
    $('[data-toggle="tooltip"]').tooltip();
    if (Whisker.testTable) {
        Whisker.testTable.hideTestDetails();
    }
};

const _initLangSelect = function () {
    const newLabel = document.createElement('label');
    let html = '<select id="lang-select">';
    const lngs = ['de', 'en'];
    let i;
    for (i = 0; i < lngs.length; i++) {
        html += `<option value='${lngs[i]}' `;
        if ((initialLanguage !== null && lngs[i] === initialLanguage) || lngs[i] === 'de') {
            html += 'selected';
        }
        html += ` data-i18n="${lngs[i]}">${i18next.t(lngs[i])}</option>`;
    }
    html += '</select>';
    newLabel.innerHTML = html;
    document.querySelector('#form-lang').appendChild(newLabel);
};

const _getKeyByValue = (langData, value) => Object.keys(langData).find(key => langData[key] === value);

const _translateTooltip = (tooltipElement, oldData, newData) => {
    const key = _getKeyByValue(oldData, tooltipElement.innerHTML);
    tooltipElement.innerHTML = newData[key];
};

const _translateTestTableTooltips = function (oldLanguage, newLanguage) {
    const oldLangData = i18next.getDataByLanguage(oldLanguage);
    const oldIndexData = oldLangData.index;
    const newLangData = i18next.getDataByLanguage(newLanguage);
    const newIndexData = newLangData.index;
    $('.tooltip-sign-text').html(function () {
        // Inside this function, jQuery binds `this` to the current element in the set of matched elements.
        // eslint-disable-next-line no-invalid-this
        _translateTooltip(this, oldIndexData, newIndexData);
    });
};

const loadHeader = function () {
    _initLangSelect();
    localize('#header');
    if (window.location.href.includes('/html')) {
        $('#link').attr('href', '../index.html');
        $('#tutorial').attr('href', 'tutorial.html');
        $('#contact').attr('href', 'contact.html');
        $('#about').attr('href', 'about.html');
        $('#small-logo').attr('src', '../assets/whisker-text-logo.png');
        $('#banner').attr('src', '../assets/whiskerHeader.png');
    } else {
        $('#link').attr('href', 'index.html');
        $('#tutorial').attr('href', 'html/tutorial.html');
        $('#contact').attr('href', 'html/contact.html');
        $('#about').attr('href', 'html/about.html');
        $('#small-logo').attr('src', 'assets/whisker-text-logo.png');
        $('#banner').attr('src', 'assets/whiskerHeader.png');
    }
    $('#tutorial').attr('target', '_blank');
    $('#about').attr('target', '_blank');
    $('#form-lang').on('change', () => {
        $('[data-toggle="tooltip"]').tooltip('dispose');
        const lng = $('#lang-select').val();
        _translateTestTableTooltips(i18next.language, lng); // This has to be executed before the current language is changed
        const params = new URLSearchParams(window.location.search);
        params.set(LANGUAGE_OPTION, lng);
        window.history.pushState('', '', `?${params.toString()}`);
        i18next.changeLanguage(lng).then(_updateLang());
    });
    $('.nav-link').on('click', event => {
        const lng = $('#lang-select').val();
        const href = event.target.getAttribute('href');
        if (href) {
            location.href = `${href}?lng=${lng}`;
            event.preventDefault();
        }
    });
};

const loadFooter = function () {
    localize('#footer');
    if (window.location.href.includes('/html')) {
        $('#imprint').attr('href', './imprint.html');
        $('#privacy').attr('href', './privacy.html');
        $('#logo-img').attr('src', '../assets/uniPassauLogo.png');
    } else {
        $('#imprint').attr('href', 'html/imprint.html');
        $('#privacy').attr('href', 'html/privacy.html');
        $('#logo-img').attr('src', 'assets/uniPassauLogo.png');
    }
};

$(document)
    .ready(() => {
        $('#scratch-controls').hide();
        loadHeader();
        loadFooter();
        initScratch();
        initComponents();
        initEvents();
        toggleComponents();
    });

window.onbeforeunload = function () {
    if (window.localStorage) {
        const componentStates = [
            $('#toggle-input').is(':checked'),
            accSlider.slider('getValue')
        ];
        window.localStorage.setItem('componentStates', JSON.stringify(componentStates));
    }
    if (location.href.includes('index')) {
        return ''; // Creates a popup warning that informs the user about potential loss of data (project, tests, etc.)
    }
};

i18next
    .init({
        whitelist: ['de', 'en'],
        nonExplicitWhitelist: true,
        lng: initialLanguage,
        fallbackLng: 'de',
        debug: false,
        ns: ['index', 'about', 'snippets', 'tutorial', 'contact', 'imprint', 'privacy', 'footer', 'header', 'modelEditor'],
        defaultNS: 'index',
        interpolation: {
            escapeValue: false
        },
        resources: {
            de: {
                index: indexDE,
                about: aboutDE,
                snippets: snippetsDE,
                tutorial: tutorialDE,
                contact: contactDE,
                imprint: imprintDE,
                privacy: privacyDE,
                footer: footerDE,
                header: headerDE,
                modelEditor: modelEditorDE
            },
            en: {
                index: indexEN,
                about: aboutEN,
                snippets: snippetsEN,
                tutorial: tutorialEN,
                contact: contactEN,
                imprint: imprintEN,
                privacy: privacyEN,
                footer: footerEN,
                header: headerEN,
                modelEditor: modelEditorEN
            }
        }
    }, () => {
        _updateLang();
    }).then();

$('#form-lang').on('change', () => {
    $('[data-toggle="tooltip"]').tooltip('dispose');
    const lng = $('#lang-select').val();
    _translateTestTableTooltips(i18next.language, lng); // This has to be executed before the current language is changed
    const params = new URLSearchParams(window.location.search);
    params.set(LANGUAGE_OPTION, lng);
    window.history.pushState('', '', `?${params.toString()}`);
    i18next.changeLanguage(lng).then(_updateLang());
});

const _updateFilenameLabels = () => {
    if (Whisker.projectFileSelect && Whisker.projectFileSelect.hasName()) {
        $('#project-label').html(Whisker.projectFileSelect.getName());
    }
    if (Whisker.testFileSelect && Whisker.testFileSelect.hasName()) {
        $('#tests-label').html(Whisker.testFileSelect.getName());
    }
    if (Whisker.configFileSelect && Whisker.configFileSelect.hasName()) {
        $('#config-label').html(Whisker.configFileSelect.getName());
    }
    if (Whisker.modelFileSelect && Whisker.modelFileSelect.hasName()) {
        $('#model-label').html(Whisker.modelFileSelect.getName());
    }
};

$('.nav-link').on('click', event => {
    const lng = $('#lang-select').val();
    const href = event.target.getAttribute('href');
    if (href) {
        location.href = `${href}?lng=${lng}`;
        event.preventDefault();
    }
    _updateFilenameLabels();
});

export {i18next as i18n};
