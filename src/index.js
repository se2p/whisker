const {$} = require('./web-libs');

const {TestRunner, TAP13Listener} = require('../../whisker-test');
const Runtime = require('scratch-vm/src/engine/runtime');

const TestTable = require('./components/test-table');
const TestEditor = require('./components/test-editor');
const Scratch = require('./components/scratch-stage');
const FileSelect = require('./components/file-select');
const Output = require('./components/output');

const Whisker = window.Whisker = {};
window.$ = $;

const loadTestsFromString = function (string) {
    /* eslint-disable-next-line no-eval */
    let tests = eval(`${string}; module.exports;`);
    tests = TestRunner.convertTests(tests);
    Whisker.testEditor.setValue(string);
    Whisker.testTable.setTests(tests);
    return tests;
};

const runTests = async function (tests) {
    Whisker.scratch.stop();
    const project = await Whisker.projectFileSelect.loadAsArrayBuffer();
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();
    return await Whisker.testRunner.runTests(Whisker.scratch.vm, project, tests);
};

const runAllTests = async function () {
    Whisker.scratch.stop();
    const tests = loadTestsFromString(await Whisker.testFileSelect.loadAsString());
    Whisker.outputRun.clear();
    Whisker.outputLog.clear();
    for (let i = 0; i < Whisker.projectFileSelect.length(); i++) {
        const project = await Whisker.projectFileSelect.loadAsArrayBuffer(i);
        Whisker.outputRun.println(`#project: ${Whisker.projectFileSelect.getName(i)}`);
        await Whisker.testRunner.runTests(Whisker.scratch.vm, project, tests);
        Whisker.outputRun.println();
    }
};

const initScratch = function () {
    Whisker.scratch = new Scratch($('#scratch-stage'));

    $('#green-flag')
        .removeClass('btn-success')
        .addClass('btn-outline-success');
    $('#stop').prop('disabled', true);

    Whisker.scratch.vm.on(Runtime.PROJECT_RUN_START, () => {
        $('#green-flag')
            .removeClass('btn-outline-success')
            .addClass('btn-success');
        $('#stop').prop('disabled', false);
    });
    Whisker.scratch.vm.on(Runtime.PROJECT_RUN_STOP, () => {
        $('#green-flag')
            .removeClass('btn-success')
            .addClass('btn-outline-success');
        $('#stop').prop('disabled', true);
    });
};

const initComponents = function () {
    Whisker.testTable = new TestTable($('#test-table'), runTests);
    Whisker.testTable.setTests([]);

    Whisker.outputRun = new Output($('#output-run'));
    Whisker.outputLog = new Output($('#output-log'));

    Whisker.testEditor = new TestEditor($('#test-editor'), loadTestsFromString);
    Whisker.testEditor.setDefaultValue();

    Whisker.projectFileSelect = new FileSelect($('#fileselect-project'),
        fileSelect => fileSelect.loadAsArrayBuffer().then(project => Whisker.scratch.loadProject(project)));
    Whisker.testFileSelect = new FileSelect($('#fileselect-tests'),
        fileSelect => fileSelect.loadAsString().then(string => loadTestsFromString(string)));

    Whisker.testRunner = new TestRunner();
    Whisker.testRunner.on(TestRunner.TEST_LOG,
        (test, message) => Whisker.outputLog.println(`[${test.name}] ${message}`));
    Whisker.testRunner.on(TestRunner.TEST_ERROR, result => console.log(result.error));

    Whisker.tap13Listener = new TAP13Listener(Whisker.testRunner, Whisker.outputRun.println.bind(Whisker.outputRun));
};

const initEvents = function () {
    $('#green-flag').on('click', () => Whisker.scratch.greenFlag());
    $('#stop').on('click', () => Whisker.scratch.stop());
    $('#reset').on('click', () => Whisker.scratch.reset());
    $('#run-all-tests').on('click', runAllTests);

    $('#toggle-input') .on('change', event => {
        if ($(event.target).is(':checked')) {
            Whisker.scratch.enableInput();
        } else {
            Whisker.scratch.disableInput();
        }
    });

    $('#toggle-tests').on('change', event => {
        if ($(event.target).is(':checked')) {
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

    $('#toggle-editor').on('change', event => {
        if ($(event.target).is(':checked')) {
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

    $('#toggle-output').on('change', event => {
        if ($(event.target).is(':checked')) {
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
};

const toggleComponents = function () {
    if (window.localStorage) {
        console.log('Restoring which components are displayed.');
        const componentStates = localStorage.getItem('componentStates');
        if (componentStates) {
            const [input, tests, editor, output] = JSON.parse(componentStates);
            if (input) $('#toggle-input').click();
            if (tests) $('#toggle-tests').click();
            if (editor) $('#toggle-editor').click();
            if (output) $('#toggle-output').click();
        }
    }
};

$(document).ready(() => {
    initScratch();
    initComponents();
    initEvents();
    toggleComponents();
});

window.onbeforeunload = function () {
    if (window.localStorage) {
        console.log('Saving which components are displayed.');
        const componentStates = [
            $('#toggle-input').is(':checked'),
            $('#toggle-tests').is(':checked'),
            $('#toggle-editor').is(':checked'),
            $('#toggle-output').is(':checked')
        ];
        window.localStorage.setItem('componentStates', JSON.stringify(componentStates));
    }
};
