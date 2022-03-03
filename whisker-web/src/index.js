import i18next from 'i18next';
import locI18next from 'loc-i18next';
import {DynamicSuite} from 'whisker-main/src/whisker/whiskerNet/Algorithms/DynamicSuite';
import {StaticSuite} from "whisker-main/src/whisker/whiskerNet/Algorithms/StaticSuite";

/* Translation resources */
const indexDE = require('./locales/de/index.json');
const indexEN = require('./locales/en/index.json');
const faqDE = require('./locales/de/faq.json');
const faqEN = require('./locales/en/faq.json');
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
const Thread = require('scratch-vm/src/engine/thread');
const TestTable = require('./components/test-table');
const TestEditor = require('./components/test-editor');
const Scratch = require('./components/scratch-stage');
const FileSelect = require('./components/file-select');
const Output = require('./components/output');
const InputRecorder = require('./components/input-recorder');
const Footer = require('./components/footer');
const Header = require('./components/header');
const ModelEditor = require('./components/model-editor');

const {showModal, escapeHtml} = require('./utils.js');
const Whisker = window.Whisker = {};
window.$ = $;

/* Acceleration */
const DEFAULT_ACCELERATION_FACTOR = 1;
const accSlider = $('#acceleration-factor').slider();


const LANGUAGE_OPTION = 'lng';
const initialParams = new URLSearchParams(window.location.search); // This is only valid for initialization and has to be retrieved again afterwards
const initialLanguage = initialParams.get(LANGUAGE_OPTION); // This is only valid for initialization and has to be retrieved again afterwards

let testsRunning = false;
const loadModelFromString = function (models) {
    try {
        Whisker.modelTester.load(models);
    } catch (err) {
        Whisker.outputLog.println(`ERROR: ${err.message}`);
        console.error(err);
        const message = `${err.name}: ${err.message}`;
        showModal('Modal Loading', `<div class="mt-1"><pre>${escapeHtml(message)}</pre></div>`);
        throw err;
    }

    if (Whisker.modelTester.userModelsLoaded()) {
        $('#model-user-loaded').text(i18next.t('model-output-user-model'));
    } else {
        $('#model-user-loaded').text(i18next.t('model-output-no-user-model'));
    }
};

const loadTestsFromString = async function (string) {
    // Check for dynamic test suites.
    if ((`${string}`.toLowerCase().includes('network') && `${string}`.toLowerCase().includes('nodes'))) {
        const tests = `${string}`;
        Whisker.tests = tests;
        Whisker.testEditor.setValue(string);
        return tests;
    }
    // Manually generated test suite or test suite generated through search algorithms.
    let tests;
    try {
        /* eslint-disable-next-line no-eval */
        tests = eval(`${string};
        module.exports;`);
    } catch (err) {
        console.error(err);
        const message = `${err.name}: ${err.message}`;
        showModal('Test Loading', `An error occurred while parsing the test code:<br>
            <div class="mt-1"><pre>${escapeHtml(message)}</pre></div>`);
        throw err;
    }
    tests = TestRunner.convertTests(tests);
    Whisker.tests = tests;
    Whisker.testEditor.setValue(string);
    Whisker.testTable.setTests(tests);
    return tests;
};

const enableVMRelatedButtons = function () {
    $('.vm-related').prop('disabled', false);
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
    console.log(`Whisker-Web: loading project ${projectName}`);
    const project = await Whisker.projectFileSelect.loadAsArrayBuffer();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();
    await Whisker.scratch.vm.loadProject(project);
    const config = await Whisker.configFileSelect.loadAsString();
    const networkTemplate = await Whisker.testFileSelect.loadAsString();
    const accelerationFactor = $('#acceleration-value').text();
    const seed = document.getElementById('seed').value;
    const [tests, testListWithSummary, csv] = await Whisker.search.run(Whisker.scratch.vm,
        Whisker.scratch.project, projectName, config, configName, accelerationFactor, seed, networkTemplate);
    // Prints uncovered blocks summary and csv summary separated by a newline
    Whisker.outputLog.print(`${testListWithSummary}\n`);
    Whisker.outputLog.print(csv);
    accSlider.slider('enable');
    _enableVMRelatedButtons();
    return tests;
};

const _runTestsWithCoverage = async function (vm, project, tests) {
    if (testsRunning) {
        testsRunning = false;
        _showRunIcon();
        _enableVMRelatedButtons();
        Whisker.scratch.stop();
        Whisker.testRunner.abort();
        Whisker.testTable.updateAfterAbort();
    } else {
        _disableVMRelatedButtons('#run-all-tests');
        testsRunning = true;
        _showStopIcon();
        $('#green-flag').prop('disabled', true);
        $('#reset').prop('disabled', true);
        $('#record').prop('disabled', true);

        let summary;
        let coverage;
        let coverageModels = {};
        accSlider.slider('disable');
        const accelerationFactor = $('#acceleration-value').text();
        const seed = document.getElementById('seed').value;
        let duration = Number(document.querySelector('#model-duration').value);
        if (duration) {
            duration = duration * 1000;
        }
        const repetitions = Number(document.querySelector('#model-repetitions').value);
        const caseSensitive = $('#model-case-sensitive').is(':checked');

        try {
            await Whisker.scratch.vm.loadProject(project);
            CoverageGenerator.prepareClasses({Thread});
            CoverageGenerator.prepareVM(vm);

            summary = await Whisker.testRunner.runTests(vm, project, tests, Whisker.modelTester,
                {accelerationFactor, seed}, {duration, repetitions, caseSensitive});
            coverage = CoverageGenerator.getCoverage();

            if (Whisker.modelTester.programModelsLoaded()) {
                coverageModels = Whisker.modelTester.getTotalCoverage();
            }

            if (typeof window.messageServantCallback === 'function') {
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
            }

            CoverageGenerator.restoreClasses({Thread});
        } finally {
            _showRunIcon();
            enableVMRelatedButtons();
            accSlider.slider('enable');
            testsRunning = false;
        }

        if (summary === null) {
            return;
        }

        const formattedSummary = TAP13Formatter.formatSummary(summary);
        const formattedCoverage = TAP13Formatter.formatCoverage(coverage.getCoveragePerSprite());

        const summaryString = TAP13Formatter.extraToYAML({summary: formattedSummary});
        const coverageString = TAP13Formatter.extraToYAML({coverage: formattedCoverage});
        const formattedModelCoverage = TAP13Formatter.formatModelCoverage(coverageModels);
        const modelCoverageString = TAP13Formatter.extraToYAML({modelCoverage: formattedModelCoverage});

        Whisker.outputRun.println([
            summaryString,
            coverageString,
            modelCoverageString
        ].join('\n'));
    }
};

const runTests = async function (tests) {
    Whisker.scratch.stop();
    const project = await Whisker.projectFileSelect.loadAsArrayBuffer();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();
    await _runTestsWithCoverage(Whisker.scratch.vm, project, tests);
};

const runAllTests = async function () {
    $('#run-all-tests').tooltip('hide');
    if ((Whisker.tests === undefined || Whisker.tests.length === 0) && !Whisker.modelTester.someModelLoaded()) {
        showModal(i18next.t('test-execution'), i18next.t('no-tests'));
        return;
    } else if (Whisker.projectFileSelect === undefined || Whisker.projectFileSelect.length() === 0) {
        showModal(i18next.t('test-execution'), i18next.t('no-project'));
        return;
    }
    Whisker.scratch.stop();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();

    // Dynamic Suite
    if ((`${Whisker.tests}`.toLowerCase().includes('network') && `${Whisker.tests}`.toLowerCase().includes('nodes'))) {
        let coverage;
        try {
            await Whisker.scratch.vm.loadProject(Whisker.scratch.project);
            CoverageGenerator.prepareClasses({Thread});
            CoverageGenerator.prepareVM(Whisker.scratch.vm);
            const dynamicSuite = new DynamicSuite();
            const properties = {};
            properties.train = 1;
            properties.projectName = Whisker.projectFileSelect.getName();
            properties.testName = Whisker.testFileSelect.getName();
            properties.acceleration = $('#acceleration-value').text();
            properties.seed = document.getElementById('seed').value;
            const csv = await dynamicSuite.execute(Whisker.scratch.vm, Whisker.scratch.project, Whisker.tests,
                properties);
            coverage = CoverageGenerator.getCoverage();
            CoverageGenerator.restoreClasses({Thread});
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

        const formattedCoverage = TAP13Formatter.formatCoverage(coverage.getCoveragePerSprite());
        const coverageString = TAP13Formatter.extraToYAML({coverage: formattedCoverage});

        Whisker.outputRun.println([
            coverageString
        ].join('\n'));
    } else if (Whisker.tests[0].type === 'neuroevolution') { // Static NE Suite
        let coverage;
        try {
            await Whisker.scratch.vm.loadProject(Whisker.scratch.project);
            CoverageGenerator.prepareClasses({Thread});
            CoverageGenerator.prepareVM(Whisker.scratch.vm);
            const staticSuite = new StaticSuite();
            const properties = {};
            properties.projectName = Whisker.projectFileSelect.getName();
            properties.testName = Whisker.testFileSelect.getName();
            properties.acceleration = $('#acceleration-value').text();
            properties.seed = document.getElementById('seed').value;
            const csv = await staticSuite.execute(Whisker.scratch.vm, Whisker.scratch.project, Whisker.tests,
                properties);
            coverage = CoverageGenerator.getCoverage();
            CoverageGenerator.restoreClasses({Thread});
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

        const formattedCoverage = TAP13Formatter.formatCoverage(coverage.getCoveragePerSprite());
        const coverageString = TAP13Formatter.extraToYAML({coverage: formattedCoverage});

        Whisker.outputRun.println([
            coverageString
        ].join('\n'));
    } else { // Normal Static Suite
        for (let i = 0; i < Whisker.projectFileSelect.length(); i++) {
            const project = await Whisker.projectFileSelect.loadAsArrayBuffer(i);
            Whisker.outputRun.println(`# project: ${Whisker.projectFileSelect.getName(i)}`);
            Whisker.outputLog.println(`# project: ${Whisker.projectFileSelect.getName(i)}`);
            await _runTestsWithCoverage(Whisker.scratch.vm, project, Whisker.tests);
            Whisker.outputRun.println();
            Whisker.outputLog.println();
        }
    }
};

const initScratch = function () {
    Whisker.scratch = new Scratch(document.querySelector('#scratch-stage'));
};

const initComponents = function () {
    Whisker.outputRun = new Output($('#output-run')[0]);
    Whisker.outputRun.hide();
    Whisker.outputLog = new Output($('#output-log')[0]);
    Whisker.outputLog.hide();

    Whisker.testEditor = new TestEditor($('#test-editor')[0], loadTestsFromString);
    Whisker.testEditor.setDefaultValue();
    Whisker.testEditor.show();

    Whisker.projectFileSelect = new FileSelect($('#fileselect-project')[0],
        fileSelect => fileSelect.loadAsArrayBuffer()
            .then(project => Whisker.scratch.loadProject(project)));
    Whisker.testFileSelect = new FileSelect($('#fileselect-tests')[0],
        fileSelect => fileSelect.loadAsString()
            .then(string => loadTestsFromString(string)));
    Whisker.modelFileSelect = new FileSelect($('#fileselect-models')[0],
        fileSelect => fileSelect.loadAsString().then(string => loadModelFromString(string)));

    Whisker.testRunner = new TestRunner();
    Whisker.testRunner.on(TestRunner.TEST_LOG,
        (test, message) => Whisker.outputLog.println(`[${test.name}] ${message}`));
    Whisker.testRunner.on(TestRunner.TEST_ERROR, result => console.error(result.error));

    Whisker.testTable = new TestTable($('#test-table')[0], runTests, Whisker.testRunner);
    Whisker.testTable.setTests([]);
    Whisker.testTable.show();

    Whisker.modelTester = new ModelTester.ModelTester();

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

const initEvents = function () {
    $('#acceleration-factor')
        .on('slide', slideEvt => {
            $('#acceleration-value').text(slideEvt.value);
        })
        .on('change', clickEvt => {
            $('#acceleration-value').text(clickEvt.value.newValue);
        });
    $('#green-flag').on('click', () => {
        if (Whisker.projectFileSelect === undefined || Whisker.projectFileSelect.length() === 0) {
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
    });
    $('#reset').on('click', () => {
        $('#reset').tooltip('hide');
        if (Whisker.tests === undefined || Whisker.tests.length === 0) {
            showModal(i18next.t('test-execution'), i18next.t('no-tests'));
        } else if (Whisker.projectFileSelect === undefined || Whisker.projectFileSelect.length() === 0) {
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
        if (Whisker.inputRecorder.isRecording()) {
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
    $('#run-search')
        .click('click', () => {
            if (Whisker.projectFileSelect === undefined || Whisker.projectFileSelect.length() === 0) {
                showModal(i18next.t('test-generation'), i18next.t('no-project'));
            } else {
                $('#run-search').hide();
                $('#search-running').show();
                const tests = runSearch();
                tests.then(
                    result => {
                        loadTestsFromString(result).then();
                        _jumpTo('#test-table');
                        $('#run-search').show();
                        $('#search-running').hide();
                    }
                );
            }
        })
        .show();
    $('#search-running').hide();
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


const loadHeader = function () {
    _initLangSelect();
    localize('#header');
    if (window.location.href.includes('/html')) {
        $('#link').attr('href', '../index.html');
        $('#small-logo').attr('src', '../assets/whisker-text-logo.png');
        $('#banner').attr('src', '../assets/banner_slim.jpg');
    } else {
        $('#link').attr('href', 'index.html');
        $('#small-logo').attr('src', 'assets/whisker-text-logo.png');
        $('#banner').attr('src', 'assets/banner_slim.jpg');
    }
    /* Add border to header if it sticks to the top */
    $(() => {
        const stickyHeader = $('.sticky');
        const stickyHeaderPosition = stickyHeader.offset().top;
        $(window).scroll(() => {
            const scroll = $(window).scrollTop();
            if (scroll > stickyHeaderPosition + 1) {
                stickyHeader.addClass('scrolled');
                $('#small-logo').show();
            } else {
                stickyHeader.removeClass('scrolled');
                $('#small-logo').hide();
            }
        });
    });
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
        initScratch();
        initComponents();
        initEvents();
        toggleComponents();
    });

window.onload = function () {
    loadHeader();
    loadFooter();
};

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

const localize = locI18next.init(i18next, {
    selectorAttr: 'data-i18n', // selector for translating elements
    targetAttr: 'i18n-target',
    optionsAttr: 'i18n-options',
    useOptionsAttr: false,
    parseDefaultValueFromContent: true
});

i18next
    .init({
        whitelist: ['de', 'en'],
        nonExplicitWhitelist: true,
        lng: initialLanguage,
        fallbackLng: 'de',
        debug: false,
        ns: ['index', 'faq', 'contact', 'imprint', 'privacy', 'footer', 'header', 'modelEditor'],
        defaultNS: 'index',
        interpolation: {
            escapeValue: false
        },
        resources: {
            de: {
                index: indexDE,
                faq: faqDE,
                contact: contactDE,
                imprint: imprintDE,
                privacy: privacyDE,
                footer: footerDE,
                header: headerDE,
                modelEditor: modelEditorDE
            },
            en: {
                index: indexEN,
                faq: faqEN,
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

function _showRunIcon () {
    $('#run-tests-icon').show();
    $('#stop-tests-icon').hide();
}

function _showStopIcon () {
    $('#run-tests-icon').hide();
    $('#stop-tests-icon').show();
}

const _enableVMRelatedButtons = function () {
    $('.vm-related').prop('disabled', false);
};

const _disableVMRelatedButtons = function (exception) {
    $(`.vm-related:not(${exception})`).prop('disabled', true);
};

function _showAndJumpTo (elem) {
    $(elem).show();
    _jumpTo(elem);
}

function _jumpTo (elem) {
    location.href = '#'; // this line is required to work around a bug in WebKit (Chrome / Safari) according to stackoverflow
    location.href = elem;
    window.scrollBy(0, -100); // respect header size
}

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

const _initLangSelect = function () {
    const newLabel = document.createElement('label');
    let html = '<select id="lang-select">'; const lngs = ['de', 'en']; let i;
    for (i = 0; i < lngs.length; i++) {
        html += `<option value='${lngs[i]}' `;
        if ((initialLanguage != null && lngs[i] === initialLanguage) || lngs[i] === 'de') {
            html += 'selected';
        }
        html += ` data-i18n="${lngs[i]}">${i18next.t(lngs[i])}</option>`;
    }
    html += '</select>';
    newLabel.innerHTML = html;
    document.querySelector('#form-lang').appendChild(newLabel);
};

function _translateTestTableTooltips (oldLanguage, newLanguage) {
    const oldLangData = i18next.getDataByLanguage(oldLanguage);
    const oldIndexData = oldLangData.index;
    const newLangData = i18next.getDataByLanguage(newLanguage);
    const newIndexData = newLangData.index;
    $('.tooltip-sign-text').html(function () {
        _translateTooltip(this, oldIndexData, newIndexData);
    });
}

function _translateTooltip (tooltipElement, oldData, newData) {
    const key = _getKeyByValue(oldData, tooltipElement.innerHTML);
    tooltipElement.innerHTML = newData[key];
}

function _getKeyByValue (langData, value) {
    return Object.keys(langData).find(key => langData[key] === value);
}

function _updateLang () {
    localize('#body');
    $('[data-toggle="tooltip"]').tooltip();
    if (Whisker.testTable) {
        Whisker.testTable.hideTestDetails();
    }
}

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
    _updateFilenameLabels();
});

function _updateFilenameLabels () {
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
}

/* Add border to header if it sticks to the top */
$(() => {
    const stickyHeader = $('.sticky');
    const stickyHeaderPosition = stickyHeader.offset().top;
    $(window).scroll(() => {
        const scroll = $(window).scrollTop();
        if (scroll > stickyHeaderPosition + 1) {
            stickyHeader.addClass('scrolled');
            $('#small-logo').show();
        } else {
            stickyHeader.removeClass('scrolled');
            $('#small-logo').hide();
        }
    });
});


export {i18next as i18n};
