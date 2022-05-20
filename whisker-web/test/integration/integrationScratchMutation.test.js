const fileUrl = require('file-url');

const timeout = process.env.SLOWMO ? 100000 : 90000;
const ACCELERATION = 10;

async function loadProject(scratchPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    const toggle = await page.$('#toggle-advanced');
    await toggle.evaluate(t => t.click());
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, ACCELERATION);
}

async function getCSVResults() {
    const output = await page.$('#output-log .output-content');
    while (true) {
        const log = await (await output.getProperty('innerHTML')).jsonValue();
        if (log.includes('projectName')) {
            const logArray = log.split('\n');
            const csvHeaderIndex = logArray.findIndex(logLine => logLine.includes('coverage'));
            const csvHeader = logArray[csvHeaderIndex];
            const rowCSVArray = logArray[csvHeaderIndex + 1].split(',');
            const coverageIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('coverage'));
            const totalBlocksIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('totalBlocks'));
            return [rowCSVArray[coverageIndex], rowCSVArray[totalBlocksIndex]];
        }
    }
}

async function setUp() {
    await jestPuppeteer.resetBrowser();
    page = await browser.newPage();
    page.on('error', (msg) => console.error(msg.text()))
        .on('pageerror', async (err) => {
            console.error(err.message);
            await page.close(); // Not very graceful, but immediately shuts the test down. There must be a nicer way?
            return Promise.reject(err);
        });
    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});
}

beforeEach(async () => {
    await setUp();
});


describe('Scratch Mutations', () => {
    test('Key-Replacement-Mutation sensing block', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/PressSpaceTest.js");
        await loadProject('test/integration/mutation/KRM-Sensing.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageOriginal] = await getCSVResults();
        expect(Number(coverageOriginal)).toBe(1);

        await setUp();
        await page.evaluate(m => document.querySelector('#container').mutators = m, "KRM");
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/PressSpaceTest.js");
        await loadProject('test/integration/mutation/KRM-Sensing.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageMutant] = await getCSVResults();
        expect(Number(coverageMutant)).toBeLessThan(1);
    }, timeout);

    test('Key-Replacement-Mutation hat block', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/PressSpaceTest.js");
        await loadProject('test/integration/mutation/KRM-Hat.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageOriginal] = await getCSVResults();
        expect(Number(coverageOriginal)).toBe(1);

        await setUp();
        await page.evaluate(m => document.querySelector('#container').mutators = m, "KRM");
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/PressSpaceTest.js");
        await loadProject('test/integration/mutation/KRM-Hat.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageMutant] = await getCSVResults();
        expect(Number(coverageMutant)).toBeLessThan(1);
    }, timeout);

    test('Single-Block-Deletion-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/SBD.sb3')
        await (await page.$('#run-all-tests')).click();
        const [, totalOriginal] = await getCSVResults();
        expect(Number(totalOriginal)).toBe(4);

        await setUp();
        await page.evaluate(m => document.querySelector('#container').mutators = m, "SBD");
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/SBD.sb3')
        await (await page.$('#run-all-tests')).click();
        const [, totalMutant] = await getCSVResults();
        expect(Number(totalMutant)).toBe(3);
    }, timeout);

    test('Script-Deletion-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/SDM.sb3')
        await (await page.$('#run-all-tests')).click();
        const [, totalOriginal] = await getCSVResults();
        expect(Number(totalOriginal)).toBe(6);

        await setUp();
        await page.evaluate(m => document.querySelector('#container').mutators = m, "SDM");
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/SDM.sb3')
        await (await page.$('#run-all-tests')).click();
        const [, totalMutant] = await getCSVResults();
        expect(Number(totalMutant)).toBe(4);
    }, timeout);

    test('Arithmetic-Operator-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/AOR.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageOriginal] = await getCSVResults();
        expect(Number(coverageOriginal)).toBe(1);

        await setUp();
        await page.evaluate(m => document.querySelector('#container').mutators = m, "AOR");
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/AOR.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageMutant] = await getCSVResults();
        expect(Number(coverageMutant)).toBeLessThan(1);
    }, timeout);

    test('Relational-Operator-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/ROR.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageOriginal] = await getCSVResults();
        expect(Number(coverageOriginal)).toBe(1);

        await setUp();
        await page.evaluate(m => document.querySelector('#container').mutators = m, "ROR");
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/ROR.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageMutant] = await getCSVResults();
        expect(Number(coverageMutant)).toBeLessThan(1);
    }, timeout);

    test('Logical-Operator-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/LOR.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageOriginal] = await getCSVResults();
        expect(Number(coverageOriginal)).toBe(1);

        await setUp();
        await page.evaluate(m => document.querySelector('#container').mutators = m, "LOR");
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/LOR.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageMutant] = await getCSVResults();
        expect(Number(coverageMutant)).toBeLessThan(1);
    }, timeout);

    test('Variable-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/VRM.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageOriginal] = await getCSVResults();
        expect(Number(coverageOriginal)).toBe(1);

        await setUp();
        await page.evaluate(m => document.querySelector('#container').mutators = m, "VRM");
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await loadProject('test/integration/mutation/VRM.sb3')
        await (await page.$('#run-all-tests')).click();
        const [coverageMutant] = await getCSVResults();
        expect(Number(coverageMutant)).toBeLessThan(1);
    }, timeout);

});

