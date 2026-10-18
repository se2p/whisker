const {loadProject, openWhiskerPage, uploadFile, waitForLog} = require('../utils/whisker-gui');
const fs = require('fs');

const timeout = 120000;
const seedRandomSource = fs.readFileSync(require.resolve('seed-random'), 'utf8');

async function runDqlSearch() {
    // Seed 1 fixes the initial policy used by these coverage checks.
    // TensorFlow's initializers use Math.random rather than Whisker's RNG.
    await page.addScriptTag({content: `(function () {
        const module = {exports: {}};
        ${seedRandomSource}
        module.exports(1, {global: true});
        document.querySelector('#seed').value = '1';
        window.Whisker.scratch.vm.seed(1);
        document.querySelector('#run-search').click();
    })();`});
}

async function getUncoveredBlocks() {
    const log = await waitForLog('#output-log .output-content', ['uncoveredBlocks', 'empty project']);
    if (log.includes('empty project')) return 'empty project';
    const csvHeaderIndex = log.split('\n').findIndex(logLine => logLine.includes('projectName'));
    const uncoveredBlocksLog = log.split('\n').slice(0, csvHeaderIndex)
        .join('\n');
    return JSON.parse(uncoveredBlocksLog);
}

async function getCoverage() {
    const log = await waitForLog('#output-log .output-content', ['projectName', 'empty project']);
    if (log.includes('empty project')) return 'empty project';
    const csvHeader = log.split('\n').find(logLine => logLine.includes('statementCoverage'));
    const row = log.split('\n').find(logLine => logLine.includes('FruitCatching.sb3,'));
    const statCovIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('statementCoverage'));
    const branchCovIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('branchCoverage'));
    const evaluationsIndex = csvHeader.split(',').indexOf('evaluations');
    return [Number(row.split(',')[statCovIndex]), Number(row.split(',')[branchCovIndex]),
        Number(row.split(',')[evaluationsIndex])];
}

beforeEach(async () => {
    await openWhiskerPage();
});

describe('Algorithms', () => {
    // We test for coverages of >= 0.35.
    // If we obtain this amount of coverage, the algorithms execute without throwing an error.
    // Testing for higher coverage values involves randomness and requires longer running tests.

    test('MIO Optimising for Statement Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/mioStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MIO Optimising for Branch Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/mioBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MOSA Optimising for Statement Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/mosaStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MOSA Optimising for Branch Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/mosaBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('Neatest Optimising for Statement Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/neatestStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.35);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.35);
    }, timeout);

    test('Neatest Optimising for Branch Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/neatestBranch.json');
        await loadProject('test/integration/networkSuites/SimpleFruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.35);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.35);
    }, timeout);

    test('MosaNeatest Optimising for Statement Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/mosaNeatestStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MosaNeatest Optimising for Branch Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/mosaNeatestBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MioNeatest Optimising for Statement Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/mioNeatestStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('MioNeatest Optimising for Branch Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/mioNeatestBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('NewsdNeatest Optimising for Statement Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/newsdNeatestStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('NewsdNeatest Optimising for Branch Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/newsdNeatestBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const [statCoverage, branchCoverage] = await getCoverage();
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.4);
    }, timeout);

    test('DQL Optimising for Statement Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/dqlStatement.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        await runDqlSearch();
        const [statCoverage, branchCoverage, evaluations] = await getCoverage();
        expect(evaluations).toBeGreaterThanOrEqual(1);
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.35);
    }, timeout);

    test('DQL Optimising for Branch Coverage', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/dqlBranch.json');
        await loadProject('test/integration/networkSuites/FruitCatching.sb3');
        await runDqlSearch();
        const [statCoverage, branchCoverage, evaluations] = await getCoverage();
        expect(evaluations).toBeGreaterThanOrEqual(1);
        expect(statCoverage).toBeGreaterThanOrEqual(0.4);
        expect(branchCoverage).toBeGreaterThanOrEqual(0.35);
    }, timeout);
});

describe('LocalSearch', () => {
    test('Test ExtensionLocalSearch without Branches', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/extensionLocalSearchMOSA.json');
        await loadProject('test/integration/localSearch/ExtensionTest.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const log = await getUncoveredBlocks();
        expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test ExtensionLocalSearch with repeat until block', async () => {
        await uploadFile('#fileselect-config', 'test/integration/testConfigs/extensionLocalSearchMOSA.json');
        await loadProject('test/integration/localSearch/ExtensionRepeatUntilTest.sb3');
        const runSearchButton = await page.$('#run-search');
        await runSearchButton.evaluate(b => b.click());
        const log = await getUncoveredBlocks();
        expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);
});
