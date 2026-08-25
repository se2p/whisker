const {loadProject, openWhiskerPage} = require('../utils/whisker-gui');

const timeout = 50000;

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
    await openWhiskerPage();
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
