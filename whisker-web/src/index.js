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

const Test = require('whisker-main/src/test-runner/test')
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
const accSlider = $("#acceleration-factor").slider();

const LANGUAGE_OPTION = "lng";
const initialParams = new URLSearchParams(window.location.search); // This is only valid for initialization and has to be retrieved again afterwards
const initialLanguage = initialParams.get(LANGUAGE_OPTION); // This is only valid for initialization and has to be retrieved again afterwards

const loadTestsFromString = async function (string) {
    const config = await Whisker.configFileSelect.loadAsString();
    if (config.toLowerCase().includes('neuroevolution')){
        const tests = `${string}`;
        Whisker.tests = tests;
        Whisker.testEditor.setValue(string);
        return tests;
    }
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

const runSearch = async function () {
    accSlider.slider('disable');
    Whisker.scratch.stop();
    const projectName = Whisker.projectFileSelect.getName();
    const configName =
        Whisker.configFileSelect.hasName() ?
            Whisker.configFileSelect.getName() :
            'default.json';
    console.log(`Whisker-Web: loading project ${projectName}`);
    const project = await Whisker.projectFileSelect.loadAsArrayBuffer();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();
    await Whisker.scratch.vm.loadProject(project);
    const config = await Whisker.configFileSelect.loadAsString();
    const template = await Whisker.templateFileSelect.loadAsString();
    const accelerationFactor = $('#acceleration-value').text();
    const res = await Whisker.search.run(Whisker.scratch.vm, Whisker.scratch.project, projectName, config, configName,
        accelerationFactor, template);
    Whisker.outputLog.print(res[1]);
    accSlider.slider('enable');
    return res[0];
};

const _runTestsWithCoverage = async function (vm, project, tests) {
    $('#green-flag').prop('disabled', true);
    $('#reset').prop('disabled', true);
    let running = i18next.t("running");
    $('#run-all-tests').prop('disabled', true).text(running);
    $('#record').prop('disabled', true);

    let summary;
    let coverage;
    accSlider.slider('disable');
    const accelerationFactor = $('#acceleration-value').text();

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
        let runTests = i18next.t("tests")
        $('#run-all-tests').prop('disabled', false).text(runTests);
        $('#record').prop('disabled', false);
        accSlider.slider('enable');
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
    } else if (Whisker.projectFileSelect === undefined || Whisker.projectFileSelect.length() === 0) {
        showModal(i18next.t("test-execution"), i18next.t("no-project"));
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

    Whisker.testTable = new TestTable($('#test-table')[0], runTests, Whisker.testRunner);
    Whisker.testTable.setTests([]);
    Whisker.testTable.show();

    Whisker.tap13Listener = new TAP13Listener(Whisker.testRunner, Whisker.outputRun.println.bind(Whisker.outputRun));

    Whisker.inputRecorder = new InputRecorder(Whisker.scratch);

    Whisker.search = new Search.Search(Whisker.scratch.vm);
    Whisker.configFileSelect = new FileSelect($('#fileselect-config')[0],
        fileSelect => fileSelect.loadAsArrayBuffer());
    Whisker.templateFileSelect = new FileSelect($('#fileselect-template')[0],
        fileSelect => fileSelect.loadAsArrayBuffer());

    accSlider.slider('setValue', DEFAULT_ACCELERATION_FACTOR);
    $('#acceleration-value').text(DEFAULT_ACCELERATION_FACTOR);
}

const initEvents = function () {
    $("#acceleration-factor")
        .on('slide', function (slideEvt) { $("#acceleration-value").text(slideEvt.value);})
        .on('change', function (clickEvt) { $("#acceleration-value").text(clickEvt.value.newValue);});
    $('#green-flag').on('click', () => {
        if (Whisker.projectFileSelect === undefined || Whisker.projectFileSelect.length() === 0) {
            showModal(i18next.t("test-generation"), i18next.t("no-project"));
        } else {
            Whisker.scratch.greenFlag();
        }
    });
    $('#stop').on('click', () => {
        Whisker.testRunner.abort();
        Whisker.scratch.stop();
    });
    $('#reset').on('click', () => {
        if (Whisker.tests === undefined || Whisker.tests.length === 0) {
            showModal(i18next.t("test-execution"), i18next.t("no-tests"));
        } else if (Whisker.projectFileSelect === undefined || Whisker.projectFileSelect.length() === 0) {
            showModal(i18next.t("test-execution"), i18next.t("no-project"));
        } else {
            Whisker.scratch.reset().then();
        }
    });
    $('#run-all-tests').on('click', runAllTests);
    Whisker.inputRecorder.on('startRecording', () => {
        $('#record')
            .removeClass('btn-outline-danger')
            .addClass('btn-danger')
            .text(i18next.t("stop-record"));
    });
    Whisker.inputRecorder.on('stopRecording', () => {
        $('#record')
            .removeClass('btn-danger')
            .addClass('btn-outline-danger')
            .text(i18next.t("start-record"));
    });
    $('#record').on('click', () => {
        if (Whisker.scratch.isInputEnabled()) {
            if (Whisker.inputRecorder.isRecording()) {
                Whisker.inputRecorder.stopRecording();
            } else {
                Whisker.inputRecorder.startRecording();
            }
        } else {
            showModal(i18next.t("inputs"), i18next.t("inputs-error"));
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
            $('#scratch-controls').show();
            location.href = "#"; // this line is required to work around a bug in WebKit (Chrome / Safari) according to stackoverflow
            location.href = '#scratch-controls'
        } else {
            $(event.target)
                .parent()
                .removeClass('active');
            $('#scratch-controls').hide();
        }
    });
    $('#toggle-tap').on('change', event => {
        if ($(event.target).is(':checked')) {
            $(event.target)
                .parent()
                .addClass('active');
            $('#output-run').show();
            location.href = "#"; // this line is required to work around a bug in WebKit (Chrome / Safari) according to stackoverflow
            location.href = '#output-run'
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
            location.href = "#"; // this line is required to work around a bug in WebKit (Chrome / Safari) according to stackoverflow
            location.href = '#output-log'
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
                showModal(i18next.t("test-generation"), i18next.t("no-project"));
            } else {
                const tests = runSearch();
                tests.then(
                    result => {
                        loadTestsFromString(result);
                        // TODO: This text is used as a marker to tell servant
                        //       when the search is done. There must be a nicer way...
                        Whisker.outputRun.println('summary');
                        location.href = "#"; // this line is required to work around a bug in WebKit (Chrome / Safari) according to stackoverflow
                        location.href = '#test-table'
                    },
                );
            }
        });
    _addFileListeners();
};

const _addFileListeners = function () {
    $('#fileselect-config').on('change', event => {
        const fileName = Whisker.configFileSelect.getName();
        $(event.target).parent().removeAttr('data-i18n').attr('title', fileName);
        const label = document.querySelector('#fileselect-config').parentElement.getElementsByTagName("label")[0];
        _showTooltipIfTooLong(label, event);
    });
    $('#fileselect-project').on('change', event => {
        const fileName = Whisker.projectFileSelect.getName();
        $(event.target).parent().removeAttr('data-i18n').attr('title', fileName);
        const label = document.querySelector('#fileselect-project').parentElement.getElementsByTagName("label")[0];
        _showTooltipIfTooLong(label, event);
    });
    $('#fileselect-tests').on('change', event => {
        const fileName = Whisker.testFileSelect.getName();
        $(event.target).parent().removeAttr('data-i18n').attr('title', fileName);
        const label = document.querySelector('#fileselect-tests').parentElement.getElementsByTagName("label")[0];
        _showTooltipIfTooLong(label, event);
    });
    $('#fileselect-template').on('change', event => {
        const fileName = Whisker.templateFileSelect.getName();
        $(event.target).parent().removeAttr('data-i18n').attr('title', fileName);
        const label = document.querySelector('#fileselect-template').parentElement.getElementsByTagName("label")[0];
        _showTooltipIfTooLong(label, event);
    });
}

const _showTooltipIfTooLong = function (label, event) {
    $(event.target).parent().tooltip('dispose');
    if (label.scrollWidth > label.offsetWidth) {
        $(event.target).parent().tooltip({animation: true});
        setTimeout(() => {
            $(event.target).parent().tooltip('hide')
        }, 2000);
    }
}

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

const hideAdvanced = function () {
    $('#scratch-controls').hide();
}

const initLangSelect = function () {
    const newLabel = document.createElement('label');
    let html = '<select id="lang-select">', lngs = ["de", "en"], i;
    for (i = 0; i < lngs.length; i++) {
        html += "<option value='" + lngs[i] + "' ";
        if ((initialLanguage != null && lngs[i] === initialLanguage) || lngs[i] === 'de') {
            html += "selected";
        }
        html += " data-i18n=\"" + lngs[i] + "\">" + i18next.t(lngs[i]) + "</option>";
    }
    html += '</select>';
    newLabel.innerHTML = html;
    document.querySelector('#form-lang').appendChild(newLabel);
}

$(document)
    .ready(() => {
        initLangSelect();
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
            accSlider.slider('getValue')
        ];
        window.localStorage.setItem('componentStates', JSON.stringify(componentStates));
    }
    return ""; // Creates a popup warning that informs the user about potential loss of data (project, tests, etc.)
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
    $('[data-toggle="tooltip"]').tooltip();
    if (Whisker.testTable) {
        Whisker.testTable.hideTestDetails();
    }
    _updateFilenameLabels();
}

function _updateFilenameLabels() {
    if (Whisker.projectFileSelect && Whisker.projectFileSelect.hasName()) {
        $('#project-label').html(Whisker.projectFileSelect.getName());
    }
    if (Whisker.testFileSelect && Whisker.testFileSelect.hasName()) {
        $('#tests-label').html(Whisker.testFileSelect.getName());
    }
    if (Whisker.configFileSelect && Whisker.configFileSelect.hasName()) {
        $('#config-label').html(Whisker.configFileSelect.getName());
    }
    if (Whisker.templateFileSelect && Whisker.templateFileSelect.hasName()) {
        $('#template-label').html(Whisker.templateFileSelect.getName());
    }
}

function _translateTestTableTooltips(oldLanguage, newLanguage) {
    const oldLangData = i18next.getDataByLanguage(oldLanguage);
    const oldIndexData = oldLangData.index;
    const newLangData = i18next.getDataByLanguage(newLanguage);
    const newIndexData = newLangData.index;
    $('.tooltip-sign-text').html(function () {
        _translateTooltip(this, oldIndexData, newIndexData);
    });
}

function _translateTooltip(tooltipElement, oldData, newData) {
    const key = _getKeyByValue(oldData, tooltipElement.innerHTML);
    tooltipElement.innerHTML = newData[key];
}

function _getKeyByValue(langData, value) {
    return Object.keys(langData).find(key => langData[key] === value);
}

$('#form-lang').on('change', () => {
    $('[data-toggle="tooltip"]').tooltip('dispose');
    const lng = $('#lang-select').val();
    _translateTestTableTooltips(i18next.language, lng); // This has to be executed before the current language is changed
    const params = new URLSearchParams(window.location.search);
    params.set(LANGUAGE_OPTION, lng);
    window.history.pushState('', '', '?' + params.toString());
    i18next.changeLanguage(lng).then(updateContent());
});

$('.nav-link').on('click', event => {
    const lng = $('#lang-select').val();
    const href = event.target.getAttribute('href');
    if (href) {
        location.href = href + '?lng=' + lng;
        event.preventDefault();
    }
});

export {i18next as i18n};














