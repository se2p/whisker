const {$} = require('../web-libs');
const index = require('../index');
const Test = require('whisker-main/src/test-runner/test.js');
const TestRunner = require('whisker-main/src/test-runner/test-runner.js');
/**
 * <div>
 *     <table></table>
 * </div>
 */
class TestTable {
    constructor (div, runTests, testRunner) {
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
            const tr = $(event.target).closest('tr');
            const row = this.dataTable.row(tr);
            const test = row.data();
            runTests([test]);
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

    getProps () {
        const projectName = window.Whisker.projectFileSelect.getName();
        const accelerationFactor = 1;
        const seed = document.getElementById('seed').value;
        const setMutators = document.querySelector('#container').mutators;
        const mutators = !setMutators || setMutators === '' ? ['NONE'] : setMutators.split(', ');
        return {accelerationFactor, seed, projectName, mutators};
    }

    getModelProps () {
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
    onRunStart (tests) {
        if (tests) { // may be null for model test
            tests.forEach(test => this.showNewRun(test));
        }
    }

    /**
     * @param {TestResult} result .
     */
    onTestDone(result) {
        const failSign = '\u2717';
        const skipSign = '\u26A0';
        const errorSign = '\u26A0'; // same as skip, is just colored differently
        const passSign = '\u2713';
        if (result.test) {
            let test = result.test;
            let status = result.status;
            test.isRunning = false;
            test.testResultClass = status;
            test.translatedTestResult = index.i18n.t(status);
            test.error = result.error;
            test.log = result.log;
            switch (status) {
                case Test.FAIL:
                    test.testResultSign = failSign;
                    break;
                case Test.SKIP:
                    test.testResultSign = skipSign;
                    break;
                case Test.PASS:
                    test.testResultSign = passSign;
                    break;
                case Test.ERROR:
                    test.testResultSign = errorSign;
            }
            this.updateTest(test);
        }
        if (result.modelResult) {
           // todo adapt for model
        }
    }

    /**
     * @param {Test[]} tests .
     */
    onRunCancel (tests) {
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
    updateTest (test) {
        let tests = this.dataTable.data();
        tests[test.index - 1] = test;
        this.setTests(tests);
    }

    updateAfterAbort() {
        let tests = this.dataTable.data();
        for (const index of Object.keys(tests)) {
            if (tests[index].isRunning) {
                tests[index].isRunning = false;
            }
        }
        this.setTests(tests);
    }

    /**
     * @param {Object} tests    Either an array or an object with indexes as keys and tests as entries.
     *                          In preprocessing steps the tests might get some more fields:
     *                          - index: Unique ID to locate the test in the data table // TODO is this always deterministic?
     *                          - isRunning: true if the test is currently running
     *                          - testResultClass: the result status of the test run used for css styling
     *                          - translatedTestResult: the translated tooltip hint for the test result
     *                          - error: if the test run resulted in an error, it is stored here
     *                          - log: if the test run resulted in log messages, they are stored here
     */
    setTests (tests) {
        if (this.dataTable) {
            this.dataTable.destroy();
        }

        this.dataTable = this.table.DataTable({
            createdRow: function (row, data, dataIndex) {
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
                    render: function (data, type, full) {
                        if (!data.isRunning && data.translatedTestResult && data.testResultSign) {
                            return '<div class="tooltip-sign">' + data.testResultSign + '<span class="tooltip-sign-text">' + data.translatedTestResult + '</span></div>';
                        } else if (data.isRunning) {
                            return '<span class="fas fa-circle-notch fa-spin result-spinner"></span>';
                        } else {
                            return '-';
                        }
                    },
                    defaultContent: '-',
                    width: "30%"
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
            },

        });
    }

    show () {
        $(this.div).show();
    }

    hide () {
        $(this.div).hide();
    }

    /**
     * @param {Test[]} tests .
     * @return {Test[]} .
     */
    static prepareTests (tests) {
        let index = 1;
        return tests.map(test => {
            test.index = index++;
            return test;
        });
    }

    /**
     * @param {Test} test .
     * @return {string} .
     */
    static prepareDescription(test) {
        let description = index.i18n.t("description");
        let result = `<table class="child-table"> <tbody> <tr> <td>${description}</td><td>${test.description}</td> </tr>`;
        let name = "name";
        let msg = "message";
        let expected = "expected";
        let operator = "operator";
        let actual = "actual";
        let excludedProperties = ["generatedMessage", "stack", msg, name, expected, operator, actual];
        let translatedProperties = [msg, name, expected, operator, actual];

        function addRowIfPropertyPresent(prop) {
            if (test.error.hasOwnProperty(prop)) {
                if (translatedProperties.includes(prop)) {
                    let translatedProp = index.i18n.t("error-" + prop);
                    result += `<td>${translatedProp}</td><td>${test.error[prop]}</td>\n</tr>`;

                } else {
                    result += `<td>${prop}</td><td>${test.error[prop]}</td>\n</tr>`;
                }
            }
        }

        if (test.error) {
            addRowIfPropertyPresent(name);
            addRowIfPropertyPresent(msg);
            addRowIfPropertyPresent(expected);
            addRowIfPropertyPresent(operator);
            addRowIfPropertyPresent(actual);

            for (let prop in test.error) {
                if (!(excludedProperties.includes(prop))) {
                    result += `<td>${prop}</td><td>${test.error[prop]}</td>\n</tr>`;
                }
            }
        }

        if (test.hasOwnProperty("log") && test.log.length) {
            let log = index.i18n.t("log");
            result += `<td>${log}</td><td>${test.log}</td>\n</tr>`;
        }

        result += `</tbody> </table>`;
        return result;
    }

    hideTestDetails() {
        if (this.dataTable) {
            this.dataTable.rows().every(function (rowIdx, tableLoop, rowLoop) {
                if (this.child.isShown()) {
                    this.child.hide();
                }
            });
            [...document.querySelectorAll('.toggle-details-icon')].forEach(function(icon) {
                icon.classList.remove('fa-minus');
                icon.classList.add('fa-plus');
            });
        }
    }
}

module.exports = TestTable;
