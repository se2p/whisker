const fileUrl = require('file-url');

const timeout = process.env.SLOWMO ? 30000 : 10000;

async function loadProject (scratchPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    await (await page.$('#toggle-output')).click();
    await (await page.$('#toggle-editor')).click();
    await page.evaluate(factor => document.querySelector('#acceleration-factor').value = factor, ACCELERATION);
}

async function waitForSearchCompletion () {
    const coverageOutput = await page.$('#output-run .output-content');

    while (true) {
        const currentCoverageLog = await (await coverageOutput.getProperty('innerHTML')).jsonValue();
        if (currentCoverageLog.includes('summary')) {
            break;
        }
    }
}

/**
 * Reads the coverage and log field until the summary is printed into the coverage field, indicating that the test
 * run is over.
 */
async function readCoverageOutput () {
    const coverageOutput = await page.$('#output-run .output-content');
    let coverageLog = '';

    while (true) {
        const currentCoverageLog = await (await coverageOutput.getProperty('innerHTML')).jsonValue();
        coverageLog = currentCoverageLog;

        if (currentCoverageLog.includes('combined:')) {
            var re = /combined: (\d+\.\d+)/i;
            var matches_array = currentCoverageLog.match(re);
            return matches_array[1];
        }
        if (currentCoverageLog.includes('summary')) {
            break;
        }

        await page.waitForTimeout(1000);
    }

    return coverageLog;
}

beforeEach(async() => {
    await (await page.$('#fileselect-config')).uploadFile("../config/default.json");
});

beforeAll(async () => {
    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});
});


describe('Test text typing functionality', () => {
    test('Can type', async () => {
        await loadProject('test/integration/typeTextEvent/TypeTextEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);
});
