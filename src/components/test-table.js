const {$} = require('../web-libs');

/**
 * <div>
 *     <table></table>
 * </div>
 */
class TestTable {
    constructor (div, runTests) {
        this.div = $(div)[0];
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

    setTests (tests) {
        if (this.dataTable) {
            this.dataTable.destroy();
        }

        this.dataTable = this.table.DataTable({
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
                    width: '60%'
                },
                {
                    data: data => data.categories.join(', '),
                    width: '30%'
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
                emptyTable: 'No tests loaded'
            }
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
    static prepareDescription (test) {
        return '' +
`<table class="child-table">
    <tbody>
        <tr>
            <td>Description:</td>
            <td>${test.description}</td>
        </tr>
        <tr>
            <td>Categories:</td>
            <td>${test.categories.length === 0 ? 'N/A' : test.categories.join(', ')}</td>
        </tr>
    </tbody>
</table>`;
    }
}

module.exports = TestTable;
