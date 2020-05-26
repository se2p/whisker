const {$} = require('./web-libs');

/* Replace this with the path of whisker's source for now. Will probably be published as a npm module later. */
const {CoverageGenerator, TestRunner, TAP13Listener, Search} = require('../../whisker-main');

const Runtime = require('scratch-vm/src/engine/runtime');
const Thread = require('scratch-vm/src/engine/thread');

const TestTable = require('./components/test-table');
const TestEditor = require('./components/test-editor');
const Scratch = require('./components/scratch-stage');
const FileSelect = require('./components/file-select');
const Output = require('./components/output');
const InputRecorder = require('./components/input-recorder');

const Whisker = window.Whisker = {};
window.$ = $;

const SCRATCH_VM_FREQUENCY = 30;

const loadTestsFromString = function (string) {
    let tests;
    try {
        /* eslint-disable-next-line no-eval */
        tests = eval(`${string}; module.exports;`);
    } catch (err) {
        console.error(err);
        /* eslint-disable-next-line no-alert */
        alert(`An error occurred while parsing the test code:\n${err}`);
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

    const frequency = Number(document.querySelector('#scratch-vm-frequency').value);
    Whisker.search.run(Whisker.scratch.vm, Whisker.scratch.project, config, frequency);
    Whisker.outputRun.println('summary');
};

const _runTestsWithCoverage = async function (vm, project, tests) {
    await Whisker.scratch.vm.loadProject(project);
    CoverageGenerator.prepareThread(Thread);
    CoverageGenerator.prepare(vm);

    const frequency = Number(document.querySelector('#scratch-vm-frequency').value);
    const summary = await Whisker.testRunner.runTests(vm, project, tests, {frequency, CoverageGenerator});
    const coverage = CoverageGenerator.getCoverage();

    CoverageGenerator.restoreThread(Thread);

    const formattedSummary = TAP13Listener.formatSummary(summary);
    const formattedCoverage = TAP13Listener.formatCoverage(coverage.getCoveragePerSprite());

    const summaryString = TAP13Listener.extraToYAML({summary: formattedSummary});
    const coverageString = TAP13Listener.extraToYAML({coverage: formattedCoverage});

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

    Whisker.outputRun = new Output($('#output-run')[0]);
    Whisker.outputLog = new Output($('#output-log')[0]);

    Whisker.testEditor = new TestEditor($('#test-editor')[0], loadTestsFromString);
    Whisker.testEditor.setDefaultValue();

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

    document.querySelector('#scratch-vm-frequency').value = SCRATCH_VM_FREQUENCY;
};

const initEvents = function () {
    $('#green-flag')
        .on('click', () => Whisker.scratch.greenFlag());
    $('#stop')
        .on('click', () => Whisker.scratch.stop());
    $('#reset')
        .on('click', () => Whisker.scratch.reset());
    $('#run-all-tests')
        .on('click', runAllTests);

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

    $('#record')
        .on('click', event => {
            if (Whisker.inputRecorder.isRecording()) {
                Whisker.inputRecorder.stopRecording();
            } else {
                Whisker.inputRecorder.startRecording();
            }
        });

    $('#toggle-tests')
        .on('change', event => {
            if ($(event.target)
                .is(':checked')) {
                $(event.target)
                    .parent()
                    .addClass('active');
                Whisker.testTable.show();
            } else {
                $(event.target)
                    .parent()
                    .removeClass('active');
                Whisker.testTable.hide();
            }
        });

    $('#toggle-editor')
        .on('change', event => {
            if ($(event.target)
                .is(':checked')) {
                $(event.target)
                    .parent()
                    .addClass('active');
                Whisker.testEditor.show();
            } else {
                $(event.target)
                    .parent()
                    .removeClass('active');
                Whisker.testEditor.hide();
            }
        });

    $('#toggle-output')
        .on('change', event => {
            if ($(event.target)
                .is(':checked')) {
                $(event.target)
                    .parent()
                    .addClass('active');
                Whisker.outputRun.show();
                Whisker.outputLog.show();
            } else {
                $(event.target)
                    .parent()
                    .removeClass('active');
                Whisker.outputRun.hide();
                Whisker.outputLog.hide();
            }
        });

    $('#run-search')
        .click('click', event => {
            runSearch();
        });
};

const toggleComponents = function () {
    if (window.localStorage) {
        const componentStates = localStorage.getItem('componentStates');
        if (componentStates) {
            const [input, tests, editor, output, scratchVMFrequency] = JSON.parse(componentStates);
            if (input) {
                $('#toggle-input')
                    .click();
            }
            if (tests) {
                $('#toggle-tests')
                    .click();
            }
            if (editor) {
                $('#toggle-editor')
                    .click();
            }
            if (output) {
                $('#toggle-output')
                    .click();
            }
            if (scratchVMFrequency) document.querySelector('#scratch-vm-frequency').value = scratchVMFrequency;
        }
    }
};

$(document)
    .ready(() => {
        initScratch();
        initComponents();
        initEvents();
        toggleComponents();
    });

window.onbeforeunload = function () {
    if (window.localStorage) {
        const componentStates = [
            $('#toggle-input')
                .is(':checked'),
            $('#toggle-tests')
                .is(':checked'),
            $('#toggle-editor')
                .is(':checked'),
            $('#toggle-output')
                .is(':checked'),
            document.querySelector('#scratch-vm-frequency').value
        ];
        window.localStorage.setItem('componentStates', JSON.stringify(componentStates));
    }
};
