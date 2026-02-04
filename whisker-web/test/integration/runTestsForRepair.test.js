const fileUrl = require('file-url');
const path = require('path');
const fs = require('fs');
const {getLineNumber} = require('whisker-main/src/util/get-line-number');

// FIXME: this global variable is actually defined in jest.config.js, but for some reason it is "undefined" here.
const URL = 'dist/index.html';

const ACCELERATION = Infinity;

async function loadProjectAndTests(scratchPath, testPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    await (await page.$('#fileselect-tests')).uploadFile(testPath);
    const projectTab = await page.$('#tabProject');
    await projectTab.evaluate(t => t.click());
    const toggleExtendedView = await page.$('#extendedView');
    await toggleExtendedView.evaluate(t => t.click());
    await page.evaluate(factor => {
        document.querySelector('#acceleration-value').innerText = factor;
    }, ACCELERATION);
}

const expected = {
    testa: {
        name: 'testa',
        exportedName: 'testa',
        description: 'bla',
        status: 'pass',
        error: null,
        assertions: [{
            line: 5,
            covered: ['greenFlag', 'a', 'a1', 'a2'],
            coveredCumulative: ['greenFlag', 'a', 'a1', 'a2'],
            status: 'pass',
            passCount: 2
        }],
        assumptions: [],
        covered: ['greenFlag', 'a', 'a1', 'a2'],
        level: 'block'
    },
    testb: {
        name: 'testb',
        exportedName: 'testb',
        description: 'blub',
        status: 'fail',
        error: {
            type: 'AssertionError',
            stack: 14,
            line: 14,
            operator: 'ok',
            actual: false,
            expected: true,
            message: ''
        },
        assertions: [{
            line: 14,
            covered: ['greenFlag', 'b', 'b1', 'b2'],
            coveredCumulative: ['greenFlag', 'b', 'b1', 'b2'],
            status: 'fail',
            passCount: 1
        }],
        assumptions: [],
        covered: ['greenFlag', 'b', 'b1', 'b2'],
        level: 'block'
    },
    testc: {
        name: 'testc',
        exportedName: 'testc',
        description: 'blubber',
        status: 'error',
        error: {
            type: 'Error',
            stack: 22,
            line: 22,
            message: 'something unexpected happened'
        },
        assertions: [],
        assumptions: [],
        covered: ['greenFlag', 'c', 'c1', 'c3'],
        level: 'block'
    },
    testabc: {
        name: 'testabc',
        exportedName: 'testabc',
        description: 'nix',
        status: 'skip',
        error: {
            type: 'AssumptionError',
            stack: 34,
            line: 34,
            operator: 'ok',
            actual: false,
            expected: true,
            message: ''
        },
        assertions: [
            {
                line: 28,
                covered: ['greenFlag', 'a', 'a1', 'a2'],
                coveredCumulative: ['greenFlag', 'a', 'a1', 'a2'],
                status: 'pass',
                passCount: 1
            }
        ],
        assumptions: [
            {
                line: 31,
                covered: ['b', 'b1', 'b2'],
                coveredCumulative: ['greenFlag', 'a', 'a1', 'a2', 'b', 'b1', 'b2'],
                status: 'pass',
                passCount: 1
            },
            {
                line: 34,
                covered: ['c', 'c1', 'c3'],
                coveredCumulative: ['greenFlag', 'a', 'a1', 'a2', 'b', 'b1', 'b2', 'c', 'c1', 'c3'],
                status: 'fail',
                passCount: 0
            }
        ],
        covered: ['greenFlag', 'a', 'a1', 'a2', 'b', 'b1', 'b2', 'c', 'c1', 'c3'],
        level: 'block'
    },
    testConsecutiveAssertions: {
        name: 'testConsecutiveAssertions',
        exportedName: 'consecutive assertions',
        description: 'coverage must not be cleared between consecutive assertions',
        status: 'pass',
        error: null,
        assertions: [
            {
                line: 40,
                covered: ['greenFlag', 'a', 'a1', 'a2'],
                coveredCumulative: ['greenFlag', 'a', 'a1', 'a2'],
                status: 'pass',
                passCount: 1
            },
            {
                line: 41,
                covered: ['greenFlag', 'a', 'a1', 'a2'],
                coveredCumulative: ['greenFlag', 'a', 'a1', 'a2'],
                status: 'pass',
                passCount: 1
            }
        ],
        assumptions: [],
        covered: ['greenFlag', 'a', 'a1', 'a2'],
        level: 'block'
    },
    all: {
        name: 'all',
        exportedName: 'all',
        description: 'all assertion must only pass if all nested assertions pass',
        status: 'fail',
        error: {
            type: 'AssertionError',
            stack: 62,
            line: 62,
            operator: 'all',
            actual: [{
                actual: 1,
                expected: 2,
                line: 70,
                message: '',
                operator: '==',
                stack: 70,
                type: 'AssertionError'
            }],
            expected: [],
            message: ''
        },
        assertions: [
            {
                line: 55,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'pass',
                passCount: 1
            },
            {
                line: 58,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'pass',
                passCount: 1
            },
            {
                line: 64,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'pass',
                passCount: 1
            },
            {
                line: 67,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'pass',
                passCount: 1
            },
            {
                line: 70,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'fail',
                passCount: 0
            }
        ],
        assumptions: [],
        covered: [
            'greenFlag'
        ],
        level: 'block'
    },
    any: {
        name: 'any',
        exportedName: 'any',
        description: 'any assertion must only fail if no assertions pass',
        status: 'fail',
        error: {
            type: 'AssertionError',
            stack: 88,
            line: 88,
            operator: 'any',
            actual: [
                {
                    actual: true,
                    expected: false,
                    line: 90,
                    message: '',
                    operator: 'not',
                    stack: 90,
                    type: 'AssertionError'
                },
                {
                    actual: false,
                    expected: true,
                    line: 93,
                    message: '',
                    operator: 'ok',
                    stack: 93,
                    type: 'AssertionError'
                },
                {
                    actual: 1,
                    expected: 2,
                    line: 96,
                    message: '',
                    operator: '==',
                    stack: 96,
                    type: 'AssertionError'
                }],
            expected: [],
            message: '. . '
        },
        assertions: [
            {
                line: 78,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'fail',
                passCount: 0
            },
            {
                line: 81,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'fail',
                passCount: 0
            },
            {
                line: 84,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'pass',
                passCount: 1
            },
            {
                line: 90,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'fail',
                passCount: 0
            },
            {
                line: 93,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'fail',
                passCount: 0
            },
            {
                line: 96,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'fail',
                passCount: 0
            }
        ],
        assumptions: [],
        covered: ['greenFlag'],
        level: 'block'
    },
    anyEmpty: {
        name: 'anyEmpty',
        exportedName: 'anyEmpty',
        description: 'empty "any" assertion fails',
        status: 'fail',
        error: {
            actual: [],
            expected: [],
            line: 102,
            message: '',
            operator: 'any',
            stack: 102,
            type: 'AssertionError'
        },
        assertions: [],
        assumptions: [],
        covered: [
            'greenFlag'
        ],
        level: 'block'
    },
    anyAll: {
        name: 'anyAll',
        exportedName: 'anyAll',
        description: 'tests deeply nested "all" and "any" assertions',
        status: 'fail',
        error: {
            actual: [
                {
                    actual: [
                        {
                            actual: false,
                            expected: true,
                            line: 140,
                            message: '',
                            operator: 'ok',
                            stack: 140,
                            type: 'AssertionError'
                        }
                    ],
                    expected: [],
                    line: 138,
                    message: '',
                    operator: 'any',
                    stack: 138,
                    type: 'AssertionError'
                }
            ],
            expected: [],
            line: 126,
            message: '',
            operator: 'all',
            stack: 126,
            type: 'AssertionError'
        },
        assertions: [
            {
                line: 110,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'pass',
                passCount: 1
            },
            {
                line: 113,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'pass',
                passCount: 1
            },
            {
                line: 120,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'fail',
                passCount: 0
            },
            {
                line: 130,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'pass',
                passCount: 1
            },
            {
                line: 133,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'pass',
                passCount: 1
            },
            {
                line: 140,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'fail',
                passCount: 0
            }
        ],
        assumptions: [],
        covered: [
            'greenFlag'
        ],
        level: 'block'
    },
    each: {
        name: 'each',
        exportedName: 'each',
        description: 'test with assert.each',
        status: 'fail',
        error: {
            actual: [
                {
                    actual: 3,
                    expected: 3,
                    line: 149,
                    message: '',
                    operator: '<',
                    stack: 149,
                    type: 'AssertionError'
                }
            ],
            expected: [],
            line: 148,
            message: '',
            operator: 'each',
            stack: 148,
            type: 'AssertionError'
        },
        assertions: [
            {
                line: 149,
                covered: ['greenFlag'],
                coveredCumulative: ['greenFlag'],
                status: 'fail',
                passCount: 2
            }
        ],
        assumptions: [],
        covered: [
            'greenFlag'
        ],
        level: 'block'
    }
};

describe.each(Object.entries(expected))('Test execution traces', (name, trace) => {
    let traces = null;

    beforeAll(async () => {
        // The prettify.js file keeps running into a null exception when puppeteer opens a new page.
        // Since this is a purely visual feature and does not harm the test execution in any way,
        // we simply remove the file when calling the servant.
        const prettifyPath = path.resolve(__dirname, '../../dist/includes/prettify.js');
        if (fs.existsSync(prettifyPath)) {
            fs.unlinkSync(prettifyPath);
        }

        await jestPuppeteer.resetBrowser();
        page = await browser.newPage();
        await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});

        await loadProjectAndTests('test/fixtures/project.json', 'test/fixtures/tests.js');
        const result = (await page.evaluate(() => window.Whisker.runTestsForRepair()));

        // Comparing the entire stack trace is infeasible, because line numbers change when the source code is changed,
        // and paths are usually different on different machines. Thus, we map the stack traces to line numbers.
        function mapStackTraceToLineNumber(o) {
            if (typeof o !== 'object') {
                return;
            }

            if (o === null) {
                return;
            }

            for (const [key, value] of Object.entries(o)) {
                if (key === 'stack') {
                    o[key] = getLineNumber(value);
                } else {
                    mapStackTraceToLineNumber(value);
                }
            }
        }

        mapStackTraceToLineNumber(result.traces);

        traces = {};

        for (const t of result.traces) {
            traces[t.name] = t;
        }
    });

    test(name, () => {
        expect(traces[name]).toEqual(trace);
    });
});
