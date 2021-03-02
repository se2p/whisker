const {$} = require('./web-libs');

import i18next from 'i18next';
import locI18next from "loc-i18next";
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

/* Replace this with the path of whisker's source for now. Will probably be published as a npm module later. */
const {CoverageGenerator, TestRunner, TAP13Listener, Search, TAP13Formatter} = require('whisker-main');

const Runtime = require('scratch-vm/src/engine/runtime');
const Thread = require('scratch-vm/src/engine/thread');

const TestTable = require('./components/test-table');
const TestEditor = require('./components/test-editor');
const Scratch = require('./components/scratch-stage');
const FileSelect = require('./components/file-select');
const Output = require('./components/output');
const InputRecorder = require('./components/input-recorder');

const {showModal, escapeHtml} = require('./utils.js');

const Whisker = window.Whisker = {};
window.$ = $;

const DEFAULT_ACCELERATION_FACTOR = 1;

const loadTestsFromString = function (string) {
    let tests;
    try {
        /* eslint-disable-next-line no-eval */
        tests = eval(`${string}; module.exports;`);
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

const runSearch = async function () {
    Whisker.scratch.stop();
    console.log('Whisker-Web: loading project');
    const project = await Whisker.projectFileSelect.loadAsArrayBuffer();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();
    await Whisker.scratch.vm.loadProject(project);
    const config = await Whisker.configFileSelect.loadAsString();
    const accelerationFactor = Number(document.querySelector('#acceleration-factor').value);
    return Whisker.search.run(Whisker.scratch.vm, Whisker.scratch.project, config, accelerationFactor);
};

const _runTestsWithCoverage = async function (vm, project, tests) {
    $('#green-flag').prop('disabled', true);
    $('#reset').prop('disabled', true);
    $('#run-all-tests').prop('disabled', true);
    $('#record').prop('disabled', true);

    let summary;
    let coverage;
    const accelerationFactor = Number(document.querySelector('#acceleration-factor').value);

    try {
        await Whisker.scratch.vm.loadProject(project);
        CoverageGenerator.prepareClasses({Thread});
        CoverageGenerator.prepareVM(vm);

        summary = await Whisker.testRunner.runTests(vm, project, tests, {accelerationFactor});
        coverage = CoverageGenerator.getCoverage();

        if (typeof window.messageServantCallback === 'function') {
            const coveredBlockIdsPerSprite =
                [...coverage.coveredBlockIdsPerSprite].map(elem => ({key: elem[0], values: [...elem[1]]}));
            const blockIdsPerSprite =
                [...coverage.blockIdsPerSprite].map(elem => ({key: elem[0], values: [...elem[1]]}));

            const serializeableCoverageObject = {coveredBlockIdsPerSprite, blockIdsPerSprite};
            window.messageServantCallback({serializeableCoverageObject, summary});
        }

        CoverageGenerator.restoreClasses({Thread});
    } finally {
        $('#green-flag').prop('disabled', false);
        $('#reset').prop('disabled', false);
        $('#run-all-tests').prop('disabled', false);
        $('#record').prop('disabled', false);
    }

    if (summary === null) {
        return;
    }

    const formattedSummary = TAP13Formatter.formatSummary(summary);
    const formattedCoverage = TAP13Formatter.formatCoverage(coverage.getCoveragePerSprite());

    const summaryString = TAP13Formatter.extraToYAML({summary: formattedSummary});
    const coverageString = TAP13Formatter.extraToYAML({coverage: formattedCoverage});

    Whisker.outputRun.println([
        summaryString,
        coverageString
    ].join('\n'));
};

const runTests = async function (tests) {
    Whisker.scratch.stop();
    const project = await Whisker.projectFileSelect.loadAsArrayBuffer();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();
    await _runTestsWithCoverage(Whisker.scratch.vm, project, tests);
};

const runAllTests = async function () {
    if (Whisker.tests === undefined || Whisker.tests.length === 0) {
        showModal(i18next.t("test-execution"), i18next.t("no-tests"));
        return;
    }

    Whisker.scratch.stop();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();
    for (let i = 0; i < Whisker.projectFileSelect.length(); i++) {
        const project = await Whisker.projectFileSelect.loadAsArrayBuffer(i);
        Whisker.outputRun.println(`# project: ${Whisker.projectFileSelect.getName(i)}`);
        Whisker.outputLog.println(`# project: ${Whisker.projectFileSelect.getName(i)}`);
        await _runTestsWithCoverage(Whisker.scratch.vm, project, Whisker.tests);
        Whisker.outputRun.println();
        Whisker.outputLog.println();
    }
};

const initScratch = function () {
    Whisker.scratch = new Scratch(document.querySelector('#scratch-stage'));

    $('#green-flag')
        .removeClass('btn-success')
        .addClass('btn-outline-success');
    $('#stop')
        .prop('disabled', true);

    Whisker.scratch.vm.on(Runtime.PROJECT_RUN_START, () => {
        $('#green-flag')
            .removeClass('btn-outline-success')
            .addClass('btn-success');
        $('#stop')
            .prop('disabled', false);
    });
    Whisker.scratch.vm.on(Runtime.PROJECT_RUN_STOP, () => {
        $('#green-flag')
            .removeClass('btn-success')
            .addClass('btn-outline-success');
        $('#stop')
            .prop('disabled', true);
    });
};

const initComponents = function () {
    Whisker.testTable = new TestTable($('#test-table')[0], runTests);
    Whisker.testTable.setTests([]);
    Whisker.testTable.show();

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

    Whisker.testRunner = new TestRunner();
    Whisker.testRunner.on(TestRunner.TEST_LOG,
        (test, message) => Whisker.outputLog.println(`[${test.name}] ${message}`));
    Whisker.testRunner.on(TestRunner.TEST_ERROR, result => console.error(result.error));

    Whisker.tap13Listener = new TAP13Listener(Whisker.testRunner, Whisker.outputRun.println.bind(Whisker.outputRun));

    Whisker.inputRecorder = new InputRecorder(Whisker.scratch);

    Whisker.search = new Search.Search(Whisker.scratch.vm);
    Whisker.configFileSelect = new FileSelect($('#fileselect-config')[0],
        fileSelect => fileSelect.loadAsArrayBuffer());

    document.querySelector('#acceleration-factor').value = DEFAULT_ACCELERATION_FACTOR;
};

const initEvents = function () {
    $('#green-flag').on('click', () => Whisker.scratch.greenFlag());
    $('#stop').on('click', () => {
        Whisker.testRunner.abort();
        Whisker.scratch.stop();
    });
    $('#reset').on('click', () => Whisker.scratch.reset());
    $('#run-all-tests').on('click', runAllTests);

    Whisker.inputRecorder.on('startRecording', () => {
        $('#record')
            .removeClass('btn-outline-danger')
            .addClass('btn-danger')
            .text('Stop Recording');
    });
    Whisker.inputRecorder.on('stopRecording', () => {
        $('#record')
            .removeClass('btn-danger')
            .addClass('btn-outline-danger')
            .text('Record Inputs');
    });

    $('#record').on('click', () => {
        if (Whisker.scratch.isInputEnabled()) {
            if (Whisker.inputRecorder.isRecording()) {
                Whisker.inputRecorder.stopRecording();
            } else {
                Whisker.inputRecorder.startRecording();
            }
        } else {
            showModal(i18next.t("inputs"), i18next.t("inputs-error") );
        }
    });

    $('#toggle-input').on('change', event => {
        if ($(event.target).is(':checked')) {
            Whisker.scratch.enableInput();
        } else {
            Whisker.scratch.disableInput();
        }
    });

    $('#toggle-advanced').on('change', event => {
        if ($(event.target).is(':checked')) {
            $(event.target)
                .parent()
                .addClass('active');
            $('#advanced-upload').show();
            $('#scratch-controls').show();
            $('#run-search').show();
        } else {
            $(event.target)
                .parent()
                .removeClass('active');
            $('#advanced-upload').hide();
            $('#scratch-controls').hide();
            $('#run-search').hide();
        }
    });

    $('#toggle-tap').on('change', event => {
        if ($(event.target).is(':checked')) {
            $(event.target)
                .parent()
                .addClass('active');
            $('#output-run').show();
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
            $('#output-log').show();
        } else {
            $(event.target)
                .parent()
                .removeClass('active');
            $('#output-log').hide();
        }
    });

    $('#run-search')
        .click('click', () => {
            const tests = runSearch();
            tests.then(
                result => {
                    loadTestsFromString(result);
                    // TODO: This text is used as a marker to tell servant
                    //       when the search is done. There must be a nicer way...
                    Whisker.outputRun.println('summary');
                },
            );
        });

    $('#fileselect-config').on('change', event => {
        $(event.target).parent().removeAttr('data-i18n');
        const fileName = $(this).val();
        $(this).next('.config-label').html(fileName);
    });

    $('#fileselect-project').on('change', event => {
        $(event.target).parent().removeAttr('data-i18n');
        const fileName = $(this).val();
        $(this).next('.project-label').html(fileName);
    });

    $('#fileselect-tests').on('change', event => {
        $(event.target).parent().removeAttr('data-i18n');
        const fileName = $(this).val();
        $(this).next('.tests-label').html(fileName);
    });
};

const toggleComponents = function () {
    if (window.localStorage) {
        const componentStates = localStorage.getItem('componentStates');
        if (componentStates) {
            const [input, accelerationFactor] = JSON.parse(componentStates);
            if (input) $('#toggle-input').click();
            if (accelerationFactor) document.querySelector('#acceleration-factor').value = accelerationFactor;
        }
    }
};

const hideAdvanced = function () {
    $('#advanced-upload').hide();
    $('#scratch-controls').hide();
    $('#run-search').hide();
}

$(document)
    .ready(() => {
        hideAdvanced();
        initScratch();
        initComponents();
        initEvents();
        toggleComponents();
    });

window.onbeforeunload = function () {
    if (window.localStorage) {
        const componentStates = [
            $('#toggle-input').is(':checked'),
            document.querySelector('#acceleration-factor').value
        ];
        window.localStorage.setItem('componentStates', JSON.stringify(componentStates));
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
    lng: 'de',
    fallbackLng: 'de',
    debug: true,
    ns: ['index', 'faq', 'contact', 'imprint', 'privacy'],
    defaultNS: 'index',
    interpolation: {
        escapeValue: false,
    },
    resources: {
        de: {
            index: indexDE,
            faq: faqDE,
            contact: contactDE,
            imprint: imprintDE,
            privacy: privacyDE
        },
        en: {
            index: indexEN,
            faq: faqEN,
            contact: contactEN,
            imprint: imprintEN,
            privacy: privacyEN
        }
    }
}, function () {
    updateContent();
}).then();

function updateContent() {
    localize('#body');
}

$('.lang-select').on('change', () => {
    const lng = $('.lang-select').val();
    i18next.changeLanguage(lng).then(updateContent());
});



















