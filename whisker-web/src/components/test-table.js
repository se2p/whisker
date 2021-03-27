const {$} = require('../web-libs');

/**
 * <div>
 *     <table></table>
 * </div>
 */
class TestTable {
    constructor (div, runTests) {
        this.div = div;
        this.table = $(div).find('table');
        this.dataTable = null;

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
    }

    updateTest (test) {
        let tests = this.dataTable.data();
        tests[test.index - 1] = test;
        this.setTests(tests);
    }

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
                    width: '50%'
                },
                {
                    data: data => data.categories.join(', '),
                    width: '30%'
                },
                {
                    data: data => data,
                    render: function (data, type, full, meta) {
                        if (data.testResult && data.testResultSign) {
                            return '<div class="tooltip-sign">' + data.testResultSign + '<span class="tooltip-sign-text">' + data.testResult + '</span></div>';
                        } else {
                            return '-';
                        }
                    },
                    defaultContent: '-',
                    width: "15%"
                },
                {
                    orderable: false,
                    data: null,
                    defaultContent:
                        '<button class="btn btn-sm btn-xs btn-outline-secondary run-test">' +
                        '<i class="fas fa-play"></i></button>',
                    width: '0.5em'
                }
            ],
            order: [],

            paging: false,
            pageLength: 5,
            lengthChange: false,
            pagingType: 'simple',

            autoWidth: false,
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
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
        let result = `<table class="child-table"> <tbody> <tr> <td colspan="2">${test.description}</td> </tr>`;
        let irrelevantProperties = ["generatedMessage", "stack"];
        if (test.error) {
            for (let prop in test.error) {
                if (!(irrelevantProperties.includes(prop))) {
                    result += `<td>${prop}</td><td>${test.error[prop]}</td>\n</tr>`;
                }
            }
        }
        result += `</tbody> </table>`;
        return result;
    }
}

module.exports = TestTable;
