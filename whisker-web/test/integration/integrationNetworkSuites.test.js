const {loadProject, openWhiskerPage, uploadFile, waitForLog} = require('../utils/whisker-gui');

const timeout = 50000;

async function getLogAfterSearch() {
    const log = await waitForLog('#output-log .output-content', ['projectName', 'empty project'], timeout - 3000);
    if (log.includes('empty project')) return 'empty project';
    const csvHeader = log.split('\n').find(logLine => logLine.includes('testStatementCoverage'));
    const row = log.split('\n').find(logLine => !logLine.includes('testStatementCoverage'));
    const statCovIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('testStatementCoverage'));
    const branchCovIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('testBranchCoverage'));
    return [row.split(',')[statCovIndex], row.split(',')[branchCovIndex]];
}

beforeEach(async () => {
    await openWhiskerPage();
    await loadProject('test/integration/networkSuites/FruitCatching.sb3');
});

describe('Test Dynamic Network Suites', () => {
    jest.setTimeout(timeout);
    test('Dynamic Suite FruitCatching with multi-label classification network', async () => {
        await uploadFile('#fileselect-tests', 'test/integration/networkSuites/FruitCatchingMultiLabel.json');
        await (await page.$('#run-all-tests')).click();
        const [statCov, branchCov] = await getLogAfterSearch();
        expect(Number(statCov)).toBeGreaterThanOrEqual(0.6);
        expect(Number(branchCov)).toBeGreaterThanOrEqual(0.6);
    }, timeout);

    test('Dynamic Suite FruitCatching with multi-class classification network', async () => {
        await uploadFile('#fileselect-tests', 'test/integration/networkSuites/FruitCatchingMultiClass.json');
        await (await page.$('#run-all-tests')).click();
        const [statCov, branchCov] = await getLogAfterSearch();
        expect(Number(statCov)).toBeGreaterThanOrEqual(0.6);
        expect(Number(branchCov)).toBeGreaterThanOrEqual(0.6);
    }, timeout);
});
