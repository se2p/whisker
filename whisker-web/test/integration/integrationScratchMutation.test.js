const {loadProject, openWhiskerPage} = require('../utils/whisker-gui');

const timeout = 20000;

async function getCSVResults() {
    const output = await page.$('#output-log .output-content');
    while (true) {
        const log = await (await output.getProperty('innerHTML')).jsonValue();
        if (log.includes('projectName')) {
            const logArray = log.trim().split('\n');
            const csvHeaderIndex = logArray.findIndex(logLine => logLine.includes('statementCoverage'));
            const csvHeader = logArray[csvHeaderIndex];
            const originalCSVArray = logArray[csvHeaderIndex + 1].split(',');
            const mutantCSVArray = logArray[csvHeaderIndex + 2].split(',');
            const coverageIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('statementCoverage'));
            const totalBlocksIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('statements'));
            return {
                originalTotal: originalCSVArray[totalBlocksIndex],
                originalCoverage: originalCSVArray[coverageIndex],
                mutantTotal: mutantCSVArray[totalBlocksIndex],
                mutantCoverage: mutantCSVArray[coverageIndex]
            };
        }
    }
}

beforeEach(async () => {
    await openWhiskerPage();
});

describe('Scratch Mutations', () => {
    test('Key-Replacement-Mutation sensing block', async () => {
        await (await page.$('#fileselect-tests')).uploadFile('test/integration/mutation/PressKeyTest.js');
        await page.evaluate(m => {
            document.querySelector('#container').mutators = m;
        }, ['KRM']);
        await loadProject('test/integration/mutation/KRM-Sensing.sb3');
        await (await page.$('#run-all-tests')).click();
        const {originalCoverage, mutantCoverage} = await getCSVResults();
        expect(Number(originalCoverage)).toBe(1);
        expect(Number(mutantCoverage)).toBe(0.67);
    }, timeout);

    test('Key-Replacement-Mutation hat block', async () => {
        await (await page.$('#fileselect-tests')).uploadFile('test/integration/mutation/PressKeyTest.js');
        await page.evaluate(m => {
            document.querySelector('#container').mutators = m;
        }, ['KRM']);
        await loadProject('test/integration/mutation/KRM-Hat.sb3');
        await (await page.$('#run-all-tests')).click();
        const {originalCoverage, mutantCoverage} = await getCSVResults();
        expect(Number(originalCoverage)).toBe(1);
        expect(Number(mutantCoverage)).toBe(0);
    }, timeout);

    test('Single-Block-Deletion-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile('test/integration/mutation/WaitTest.js');
        await page.evaluate(m => {
            document.querySelector('#container').mutators = m;
        }, ['SBD']);
        await loadProject('test/integration/mutation/SBD.sb3');
        await (await page.$('#run-all-tests')).click();
        const {originalTotal, mutantTotal} = await getCSVResults();
        expect(Number(originalTotal)).toBe(4);
        expect(Number(mutantTotal)).toBe(3);
    }, timeout);

    test('Script-Deletion-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile('test/integration/mutation/WaitTest.js');
        await page.evaluate(m => {
            document.querySelector('#container').mutators = m;
        }, ['SDM']);
        await loadProject('test/integration/mutation/SDM.sb3');
        await (await page.$('#run-all-tests')).click();
        const {originalTotal, mutantTotal} = await getCSVResults();
        expect(Number(originalTotal)).toBe(6);
        expect(Number(mutantTotal)).toBe(4);
    }, timeout);

    test('Arithmetic-Operator-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile('test/integration/mutation/WaitTest.js');
        await page.evaluate(m => {
            document.querySelector('#container').mutators = m;
        }, ['AOR']);
        await loadProject('test/integration/mutation/AOR.sb3');
        await (await page.$('#run-all-tests')).click();
        const {originalCoverage, mutantCoverage} = await getCSVResults();
        expect(Number(originalCoverage)).toBe(1);
        expect(Number(mutantCoverage)).toBe(0.8);
    }, timeout);

    test('Relational-Operator-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile('test/integration/mutation/WaitTest.js');
        await page.evaluate(m => {
            document.querySelector('#container').mutators = m;
        }, ['ROR']);
        await loadProject('test/integration/mutation/ROR.sb3');
        await (await page.$('#run-all-tests')).click();
        const {originalCoverage, mutantCoverage} = await getCSVResults();
        expect(Number(originalCoverage)).toBe(1);
        expect(Number(mutantCoverage)).toBe(0.75);
    }, timeout);

    test('Logical-Operator-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile('test/integration/mutation/WaitTest.js');
        await page.evaluate(m => {
            document.querySelector('#container').mutators = m;
        }, ['LOR']);
        await loadProject('test/integration/mutation/LOR.sb3');
        await (await page.$('#run-all-tests')).click();
        const {originalCoverage, mutantCoverage} = await getCSVResults();
        expect(Number(originalCoverage)).toBe(1);
        expect(Number(mutantCoverage)).toBe(0.75);
    }, timeout);

    test('Variable-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile('test/integration/mutation/WaitTest.js');
        await page.evaluate(m => {
            document.querySelector('#container').mutators = m;
        }, ['VRM']);
        await loadProject('test/integration/mutation/VRM.sb3');
        await (await page.$('#run-all-tests')).click();
        const {originalCoverage, mutantCoverage} = await getCSVResults();
        expect(Number(originalCoverage)).toBe(1);
        expect(Number(mutantCoverage)).toBe(0.8);
    }, timeout);

    test('Negate-Condition-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile('test/integration/mutation/WaitTest.js');
        await page.evaluate(m => {
            document.querySelector('#container').mutators = m;
        }, ['NCM']);
        await loadProject('test/integration/mutation/NCM.sb3');
        await (await page.$('#run-all-tests')).click();
        const {originalCoverage, mutantCoverage} = await getCSVResults();
        expect(Number(originalCoverage)).toBe(1);
        expect(Number(mutantCoverage)).toBe(0.75);
    }, timeout);

});
