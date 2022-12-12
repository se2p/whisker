const fileUrl = require('file-url');
const path = require("path");
const fs = require("fs");

// FIXME: this global variable is actually defined in jest.config.js, but for some reason it is "undefined" here.
const URL = "dist/index.html";

const timeout = 50000;
const ACCELERATION = 10;

async function loadProject(scratchPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    const projectTab = await page.$('#tabProject');
    await projectTab.evaluate(t => t.click());
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, ACCELERATION);
}

async function getLogAfterSearch() {
    const output = await page.$('#output-log .output-content');
    while (true) {
        const log = await (await output.getProperty('innerHTML')).jsonValue();
        if (log.includes('projectName')) {
            const csvHeader = log.split('\n').find(logLine => logLine.includes('totalCoveredStatements'));
            const row = log.split('\n').find(logLine => !logLine.includes('totalCoveredStatements'));
            const coverageIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('totalCoveredStatements'));
            return row.split(',')[coverageIndex];
        }
        if (log.includes('empty project')) {
            return 'empty project';
        }
    }
}

beforeEach(async () => {
    // The prettify.js file keeps running into a null exception when puppeteer opens a new page.
    // Since this is a purely visual feature and does not harm the test execution in any way,
    // we simply remove the file when calling the servant.
    const prettifyPath = path.resolve(__dirname, "../../dist/includes/prettify.js");
    if (fs.existsSync(prettifyPath)) {
        fs.unlinkSync(prettifyPath)
    }

    await jestPuppeteer.resetBrowser();
    page = await browser.newPage();
    page.on('error', (msg) => console.error(msg.text()))
        .on('pageerror', async (err) => {
            console.error(err.message);
            await page.close(); // Not very graceful, but immediately shuts the test down. There must be a nicer way?
            return Promise.reject(err);
        });
    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});
    await loadProject('test/integration/networkSuites/FruitCatching.sb3')
});


describe('Test Dynamic Network Suites', () => {
    jest.setTimeout(timeout);
    test('Dynamic Suite FruitCatching', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/networkSuites/FruitCatchingDynamic.json");
        await (await page.$('#run-all-tests')).click();
        const coveredBlocks = await getLogAfterSearch();
        expect(Number(coveredBlocks)).toBeGreaterThanOrEqual(38);
    }, timeout);
});

