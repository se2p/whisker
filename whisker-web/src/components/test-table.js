const {$} = require('../web-libs');
const index = require('../index');
const Test = require('whisker-main/src/test-runner/test.js');
const TestRunner = require('whisker-main/src/test-runner/test-runner.js');
const logger = require('../logger');

const FAIL_SIGN = '\u2717';
const SKIP_SIGN = '\u26A0';
const ERROR_SIGN = '\u26A0'; // same as skip, is just colored differently
const PASS_SIGN = '\u2713';
const TIMEOUT_SIGN = '\u231B';

/**
 * <div>
 *     <table></table>
 * </div>
 */
class TestTable {
    constructor(div, runSingleTest, testRunner) {
        this.div = div;
        this.table = $(div).find('table');
        this.dataTable = null;

        this.testRunner = testRunner;

        this._onRunStart = this.onRunStart.bind(this);
        this._onTestDone = this.onTestDone.bind(this);
        this._onRunCancel = this.onRunCancel.bind(this);

        testRunner.on(TestRunner.RUN_START, this._onRunStart);
        testRunner.on(TestRunner.RESET_TABLE, this._onRunStart);
        testRunner.on(TestRunner.RUN_CANCEL, this._onRunCancel);
        testRunner.on(TestRunner.TEST_PASS, this._onTestDone);
        testRunner.on(TestRunner.TEST_FAIL, this._onTestDone);
        testRunner.on(TestRunner.TEST_ERROR, this._onTestDone);
        testRunner.on(TestRunner.TEST_SKIP, this._onTestDone);

        window.Whisker.scratch.vm.on('BBT_TEST_STARTED',
            this.onBBTTestStarted.bind(this));
        window.Whisker.scratch.vm.on('BBT_TEST_FINISHED_NATURALLY',
            this.onBBTTestFinishedNaturally.bind(this));
        window.Whisker.scratch.vm.on('BBT_TEST_TIMEOUT',
            this.onBBTTestTimeout.bind(this));
        window.Whisker.scratch.vm.on('BBT_ERROR_OCCURRED',
            this.onBBTErrorOccurred.bind(this));
        window.Whisker.scratch.vm.on('PROJECT_RUN_STOP',
            this.onProjectRunStop.bind(this));
        window.Whisker.scratch.vm.on('BBT_ASSERTION_SUCCESS',
            this.onBBTAssertionSuccess.bind(this));

        this.table.on('click', '.toggle-details', event => {
            const row = this.dataTable.row($(event.target).closest('tr'));

            if (row.child.isShown()) {
                row.child.hide();
                $(event.target).find('.toggle-details-icon')
                    .removeClass('fa-minus')
                    .addClass('fa-plus');

            } else {
                const test = row.data();
                row.child(TestTable.prepareDescription(test)).show();
                $(event.target).find('.toggle-details-icon')
                    .removeClass('fa-plus')
                    .addClass('fa-minus');
            }
        });

        this.table.on('click', '.run-test', event => {

            if (window.Whisker.scratch.vm.runtime.testRunning) {
                logger.error('Cannot start a test while another is already running!');
                return;
            }

            const tr = $(event.target).closest('tr');
            const row = this.dataTable.row(tr);
            const test = row.data();
            runSingleTest(test);
        });
        this.table.on('click', '.debug-test', event => {
            const tr = $(event.target).closest('tr');
            const row = this.dataTable.row(tr);
            const testIndex = row.data().index - 1;
            const tests = window.Whisker.testsString;
            const props = this.getProps();
            const modelProps = this.getModelProps();
            window.Whisker.scratch.reset().then(() => {
                const project = window.Whisker.scratch.vm.toJSON();
                const url = 'https://scratch.fim.uni-passau.de';
                const debuggerWindow = window.open(`${url}/debugger`);
                const handleMessageEvent = e => {
                    if (e.origin === url && e.data === 'loaded') {
                        debuggerWindow.postMessage({testIndex, tests, props, modelProps, project}, '*');
                        window.removeEventListener('message', handleMessageEvent);
                    }
                };
                window.addEventListener('message', handleMessageEvent);
            });
        });
    }

    getProps() {
        const projectName = window.Whisker.projectFileSelect.getName();
        const accelerationFactor = 1;
        const seed = document.getElementById('seed').value;
        const setMutators = document.querySelector('#container').mutators;
        const mutators = !setMutators || setMutators === '' ? ['NONE'] : setMutators.split(', ');
        return {accelerationFactor, seed, projectName, mutators};
    }

    getModelProps() {
        let duration = Number(document.querySelector('#model-duration').value);
        if (duration) {
            duration = duration * 1000;
        }
        const repetitions = Number(document.querySelector('#model-repetitions').value);
        const caseSensitive = $('#model-case-sensitive').is(':checked');
        return {duration, repetitions, caseSensitive};
    }

    /**
     * @param {Test[]} tests .
     */
    onRunStart(tests) {
        if (this.testRunner.headless) {
            return;
        }

        if (tests) { // may be null for model test
            tests.forEach(test => this.showNewRun(test));
        }
    }

    /**
     * @param {TestResult} result .
     */
    onTestDone(result) {
        if (this.testRunner.headless) {
            return;
        }

        if (result.test) {
            const test = result.test;
            const status = result.status;
            test.isRunning = false;
            test.testResultClass = status;
            test.translatedTestResult = index.i18n.t(status);
            test.error = result.error;
            test.log = result.log;
            switch (status) {
            case Test.FAIL:
                test.testResultSign = FAIL_SIGN;
                break;
            case Test.SKIP:
                test.testResultSign = SKIP_SIGN;
                break;
            case Test.PASS:
                test.testResultSign = PASS_SIGN;
                break;
            case Test.ERROR:
                test.testResultSign = ERROR_SIGN;
            }
            this.updateTest(test);
        }
        if (result.modelResult) {
            // todo adapt for model
        }
    }

    /**
     * Update the test table to show the spinning icon
     * while the BBT test is running.
     *
     * @param {object} data Contains the ID of the BBT test.
     */
    onBBTTestStarted(data) {
        if (!window.Whisker.bbtTests) {
            return;
        }

        const test = window.Whisker.bbtTests.get(data.id);

        if (!test) {
            return;
        }

        this.updateTest(test);
    }

    /**
     * Update the test attributes to represent its result.
     *
     * @param {string} bbtTestID The ID of the BBT test.
     */
    onBBTTestFinishedNaturally(bbtTestID) {
        if (!window.Whisker.bbtTests) {
            return;
        }

        const test = window.Whisker.bbtTests.get(bbtTestID);

        if (!test) {
            return;
        }

        if (!test.isRunning) {
            // For timed-out tests, a BBT_FINISHED_NATURALLY event
            // is still emitted when the respective thread is retired, ignore.
            return;
        }

        test.isRunning = false;
        this.registerBBTTestResult(test);
    }

    /**
     * Update the test attributes to represent the timeout.
     *
     * @param {string} bbtTestID the ID of the BBT test
     */
    onBBTTestTimeout(bbtTestID) {
        if (!window.Whisker.bbtTests) {
            return;
        }

        const test = window.Whisker.bbtTests.get(bbtTestID);

        if (!test) {
            return;
        }

        test.isRunning = false;
        test.testResultSign = TIMEOUT_SIGN;
        test.testResultClass = Test.FAIL;
        test.translatedTestResult = index.i18n.t(Test.TIMEOUT);
        test.error = {
            name: index.i18n.t(Test.TIMEOUT)
        };

        const logMsg = `Block-Based Test "${test.name}": Test Result: Timeout!`;
        window.Whisker.outputLog.println(logMsg);
        window.Whisker.outputRun.println(logMsg);

        this.updateTest(test);
    }

    /**
     * Increment the error counter for the respective error that has occurred.
     *
     * @param {object} errorObject information about the error as emitted by the VM
     */
    onBBTErrorOccurred(errorObject) {
        if (!window.Whisker.bbtTests) {
            return;
        }

        const test = window.Whisker.bbtTests.get(errorObject.testId);

        if (!test) {
            return;
        }

        if (!test.bbtError) {
            test.bbtError = {};
        }

        if (errorObject.type in test.bbtError) {
            test.bbtError[errorObject.type] += 1;
        } else {
            test.bbtError[errorObject.type] = 1;
        }

        const logMsg = `Block-Based Test "${test.name}": Error: ${errorObject.type}`;
        window.Whisker.outputLog.println(logMsg);
        window.Whisker.outputRun.println(logMsg);
    }

    /**
     * Register test execution abortion for BBT tests.
     */
    onProjectRunStop() {
        if (!window.Whisker.bbtTests) {
            return;
        }

        window.Whisker.bbtTests.forEach(bbtTest => {

            if (bbtTest.isRunning) {
                bbtTest.isRunning = false;

                bbtTest.testResultSign = ERROR_SIGN;
                bbtTest.testResultClass = Test.ERROR;
                bbtTest.translatedTestResult = index.i18n.t(Test.ERROR);
                bbtTest.error = {
                    name: index.i18n.t(Test.ERROR)
                };

                const logMsg = `Block-Based Test "${bbtTest.name}" was aborted!`;
                window.Whisker.outputLog.println(logMsg);
                window.Whisker.outputRun.println(logMsg);

                this.updateTest(bbtTest);
            }
        });
    }

    /**
     * Increment the passing assertion counter.
     *
     * @param {object} data contains the test ID
     */
    onBBTAssertionSuccess(data) {
        if (!window.Whisker.bbtTests) {
            return;
        }

        const test = window.Whisker.bbtTests.get(data.testId);

        if (!test) {
            return;
        }

        if ('bbtPassingAssertionCount' in test) {
            test.bbtPassingAssertionCount += 1;
        } else {
            test.bbtPassingAssertionCount = 1;
        }
    }

    /**
     * Determines the test result and updates the data table.
     *
     * @param {object} test the test to be evaluated
     */
    registerBBTTestResult(test) {
        if (!window.Whisker.bbtTests || !test) {
            return;
        }

        if (test.error || test.bbtError) {
            test.testResultSign = FAIL_SIGN;
            test.testResultClass = Test.FAIL;
            test.translatedTestResult = index.i18n.t(Test.FAIL);
        } else {
            test.testResultSign = PASS_SIGN;
            test.testResultClass = Test.PASS;
            test.translatedTestResult = index.i18n.t(Test.PASS);
        }

        const logMsg = `Block-Based Test "${test.name}": Test Result: ${test.testResultClass}`;
        window.Whisker.outputLog.println(logMsg);
        window.Whisker.outputRun.println(logMsg);

        this.updateTest(test);
    }

    /**
     * @param {Test[]} tests .
     */
    onRunCancel(tests) {
        if (tests) {
            tests.forEach(test => this.resetRunDataAndShow(test));
        }
    }


    /**
     * @param {Test} test .
     */
    showNewRun(test) {
        this.resetRunData(test);
        test.isRunning = true;
        this.updateTest(test);
    }


    /**
     * @param {Test} test .
     */
    resetRunData(test) {
        test.isRunning = false;
        test.testResultClass = null;
        test.translatedTestResult = null;
        test.error = null;
        test.log = null;
    }


    /**
     * @param {Test} test .
     */
    resetRunDataAndShow(test) {
        this.resetRunData(test);
        this.updateTest(test);
    }


    /**
     * @param {Test} test .
     */
    updateTest(test) {
        const tests = this.dataTable.data();
        tests[test.index - 1] = test;
        this.setTests(tests);
    }

    updateAfterAbort() {
        const tests = this.dataTable.data();
        for (const i of Object.keys(tests)) {
            if (tests[i].isRunning) {
                tests[i].isRunning = false;
            }
        }
        this.setTests(tests);
    }

    /**
     * @param {object} tests    Either an array or an object with indexes as keys and tests as entries.
     *                          In preprocessing steps the tests might get some more fields:
     *                          - index: Unique ID to locate the test in the data table // TODO is this always deterministic?
     *                          - isRunning: true if the test is currently running
     *                          - testResultClass: the result status of the test run used for css styling
     *                          - translatedTestResult: the translated tooltip hint for the test result
     *                          - error: if the test run resulted in an error, it is stored here
     *                          - log: if the test run resulted in log messages, they are stored here
     */
    setTests(tests) {
        if (this.dataTable) {
            this.dataTable.destroy();
        }

        this.dataTable = this.table.DataTable({
            createdRow: function (row, data, _dataIndex) {
                $(row).addClass(data.testResultClass);
            },
            data: TestTable.prepareTests(tests),
            columns: [
                {
                    orderable: false,
                    data: null,
                    defaultContent:
                        '<button class="btn btn-sm btn-xs btn-outline-secondary toggle-details">' +
                        '<i class="toggle-details-icon fas fa-plus"></i></button>',
                    width: '0.5em'
                },
                {
                    data: 'index',
                    className: 'text-center',
                    width: '1.5em'
                },
                {
                    data: 'name',
                    width: '40%'
                },
                {
                    data: data => data.categories.join(', '),
                    width: '30%'
                },
                {
                    data: data => data,
                    render: function (data, _type, _full) {
                        if (!data.isRunning && data.translatedTestResult && data.testResultSign) {
                            return `<div class="tooltip-sign">${data.testResultSign}<span class="tooltip-sign-text">${data.translatedTestResult}</span></div>`;
                        } else if (data.isRunning) {
                            return '<span class="fas fa-circle-notch fa-spin result-spinner"></span>';
                        }
                        return '-';

                    },
                    defaultContent: '-',
                    width: '30%'
                },
                {
                    orderable: false,
                    data: null,
                    defaultContent:
                        '<button class="btn btn-sm btn-xs btn-outline-secondary run-test vm-related">' +
                        '<i class="fas fa-play"></i></button>',
                    width: '0.5em'
                },
                {
                    orderable: false,
                    data: null,
                    defaultContent:
                        '<button class="btn btn-sm btn-xs btn-outline-secondary debug-test vm-related">' +
                        '<i class="fas fa-bug"></i></button>',
                    width: '0.5em'
                }
            ],
            order: [],

            paging: false,
            pageLength: 5,
            lengthChange: false,
            pagingType: 'simple',

            autoWidth: false,
            dom: '<"row"<"col-sm-12 col-md-6"l><f>>' +
                 '<"row"<"col-sm-12"tr>>' +
                 '<"row"<"col-sm-12 col-md-5"><"col-sm-12 col-md-7"p>>',

            search: {
                smart: true
            },
            language: {
                search: '&#x1F50E;',
                emptyTable: '-'
            }

        });
    }

    show() {
        $(this.div).show();
    }

    hide() {
        $(this.div).hide();
    }

    /**
     * @param {Test[]} tests .
     * @return {Test[]} .
     */
    static prepareTests(tests) {
        let idx = 1;
        return tests.map(test => {
            test.index = idx++;
            return test;
        });
    }

    /**
     * @param {Test} test .
     * @return {string} .
     */
    static prepareDescription(test) {
        const description = index.i18n.t('description');
        let result = `<table class="child-table"> <tbody> <tr> <td>${description}</td><td>${test.description}</td> </tr>`;
        const name = 'name';
        const msg = 'message';
        const expected = 'expected';
        const operator = 'operator';
        const actual = 'actual';
        const excludedProperties = ['generatedMessage', 'stack', msg, name, expected, operator, actual];
        const translatedProperties = [msg, name, expected, operator, actual];

        function addRowIfPropertyPresent(prop) {
            if (Object.prototype.hasOwnProperty.call(test.error, prop)) {
                if (translatedProperties.includes(prop)) {
                    const translatedProp = index.i18n.t(`error-${prop}`);
                    result += `<td>${translatedProp}</td><td>${test.error[prop]}</td>\n</tr>`;

                } else {
                    result += `<td>${prop}</td><td>${test.error[prop]}</td>\n</tr>`;
                }
            }
        }

        if (test.type === 'BBT' &&
            'testResultSign' in test && test.testResultSign !== null) {

            result += `<td>${index.i18n.t('passing-assertion-count')}</td>
                       <td>${test.bbtPassingAssertionCount}</td>\n</tr>`;
        }

        if (test.type === 'BBT' &&
            'bbtError' in test && test.bbtError !== null) {

            for (const [key, value] of Object.entries(test.bbtError)) {
                result += `<td>${index.i18n.t(key)}</td>
                       <td>${value}</td>\n</tr>`;
            }
        }

        if (test.error) {
            addRowIfPropertyPresent(name);
            addRowIfPropertyPresent(msg);
            addRowIfPropertyPresent(expected);
            addRowIfPropertyPresent(operator);
            addRowIfPropertyPresent(actual);

            for (const prop in test.error) {
                if (!(excludedProperties.includes(prop))) {
                    result += `<td>${prop}</td><td>${test.error[prop]}</td>\n</tr>`;
                }
            }
        }

        if (Object.prototype.hasOwnProperty.call(test, 'log') && test.log.length) {
            const log = index.i18n.t('log');
            result += `<td>${log}</td><td>${test.log}</td>\n</tr>`;
        }

        result += `</tbody> </table>`;
        return result;
    }

    hideTestDetails() {
        if (this.dataTable) {
            // The "array-callback-return" eslint rule creates a false positive: We are not using Array.prototype.every,
            // but rather DataTables.CellMethods.prototype.every.
            /* eslint-disable-next-line array-callback-return */
            this.dataTable.rows().every(function (_rowIdx, _tableLoop, _rowLoop) {
                // The every() function binds `this` to the current row, which makes the use of `this` inside this
                // function valid -> Disable "no-invalid-this" rule temporarily.
                /* eslint-disable no-invalid-this */

                if (this.child.isShown()) {
                    this.child.hide();
                }

                /* eslint-enable no-invalid-this */
            });

            [...document.querySelectorAll('.toggle-details-icon')].forEach(icon => {
                icon.classList.remove('fa-minus');
                icon.classList.add('fa-plus');
            });
        }
    }
}

module.exports = TestTable;
