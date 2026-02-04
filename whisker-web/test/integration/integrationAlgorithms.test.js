const fileUrl = require('file-url');
const path = require('path');
const fs = require('fs');

// FIXME: this global variable is actually defined in jest.config.js, but for some reason it is "undefined" here.
const URL = 'dist/index.html';

const timeout = 50000;
const ACCELERATION = Infinity;

async function loadProject(scratchPath) {
    const projectSelection = await page.$('#fileselect-project');
    await projectSelection.uploadFile(scratchPath);
    const projectTab = await page.$('#tabProject');
    await projectTab.evaluate(t => t.click());
    const toggleExtendedView = await page.$('#extendedView');
    await toggleExtendedView.evaluate(t => t.click());
    await page.evaluate(factor => {
        document.querySelector('#acceleration-value').innerText = factor;
    }, ACCELERATION);
}

async function getUncoveredBlocks() {
    const output = await page.$('#output-log .output-content');
    while (true) {
        const log = await (await output.getProperty('innerHTML')).jsonValue();
        if (log.includes('uncoveredBlocks')) {
            const csvHeaderIndex = log.split('\n').findIndex(logLine => logLine.includes('projectName'));
            const uncoveredBlocksLog = log.split('\n').slice(0, csvHeaderIndex)
                .join('\n');
            return JSON.parse(uncoveredBlocksLog);
        }
        if (log.includes('empty project')) {
            return 'empty project';
        }
    }
}

async function getCoverage() {
    const output = await page.$('#output-log .output-content');
    while (true) {
        const log = await (await output.getProperty('innerHTML')).jsonValue();
        if (log.includes('projectName')) {
            const csvHeader = log.split('\n').find(logLine => logLine.includes('statementCoverage'));
            const row = log.split('\n').find(logLine => logLine.includes('FruitCatching.sb3,'));
            const statCovIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('statementCoverage'));
            const branchCovIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('branchCoverage'));
            return [Number(row.split(',')[statCovIndex]), Number(row.split(',')[branchCovIndex])];
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
    const prettifyPath = path.resolve(__dirname, '../../dist/includes/prettify.js');
    if (fs.existsSync(prettifyPath)) {
        fs.unlinkSync(prettifyPath);
    }

    await jestPuppeteer.resetBrowser();
    page = await browser.newPage();
    page.on('error', msg => console.error(msg.text()))
        .on('pageerror', async err => {
            console.error(err.message);
            await page.close(); // Not very graceful, but immediately shuts the test down. There must be a nicer way?
            return Promise.reject(err);
        });
    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});
});

describe('Algorithms', () => {
    // We test for coverages of >= 0.35.
    // If we obtain this amount of coverage, the algorithms execute without throwing an error.
    // Testing for higher coverage values involves randomness and requires longer running tests.

    test('MIO Optimising for Statement Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/mioStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MIO Optimising for Branch Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/mioBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MOSA Optimising for Statement Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/mosaStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MOSA Optimising for Branch Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/mosaBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('Neatest Optimising for Statement Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/neatestStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.35);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.35);
    }, timeout);

    test('Neatest Optimising for Branch Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/neatestBranch.json');
        await loadProject('test/integration/networkSuites/SimpleFruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.35);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.35);
    }, timeout);

    test('MosaNeatest Optimising for Statement Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/mosaNeatestStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MosaNeatest Optimising for Branch Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/mosaNeatestBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MioNeatest Optimising for Statement Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/mioNeatestStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MioNeatest Optimising for Branch Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/mioNeatestBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('NewsdNeatest Optimising for Statement Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/newsdNeatestStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('NewsdNeatest Optimising for Branch Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/newsdNeatestBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('DQL Optimising for Statement Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/dqlStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.35);
    }, timeout);

    test('DQL Optimising for Branch Coverage', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/dqlBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.35);
    }, timeout);
});

describe('LocalSearch', () => {
    test('Test ExtensionLocalSearch without Branches', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/extensionLocalSearchMOSA.json');
        await loadProject('test/integration/localSearch/ExtensionTest.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const log = await getUncoveredBlocks();
        expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test ExtensionLocalSearch with repeat until block', async () => {
        await (await page.$('#fileselect-config')).uploadFile('test/integration/testConfigs/extensionLocalSearchMOSA.json');
        await loadProject('test/integration/localSearch/ExtensionRepeatUntilTest.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const log = await getUncoveredBlocks();
        expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);
});
