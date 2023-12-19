const fileUrl = require('file-url');
const path = require("path");
const fs = require("fs");

// FIXME: this global variable is actually defined in jest.config.js, but for some reason it is "undefined" here.
const URL = "dist/index.html";

const timeout = 20000;
const ACCELERATION = 10;

async function loadProject(scratchPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    const projectTab = await page.$('#tabProject');
    await projectTab.evaluate(t => t.click());
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, ACCELERATION);
}

async function getCSVResults() {
    const output = await page.$('#output-log .output-content');
    while (true) {
        const log = await (await output.getProperty('innerHTML')).jsonValue();
        if (log.includes('projectName')) {
            const logArray = log.trim().split('\n');
            const csvHeaderIndex = logArray.findIndex(logLine => logLine.includes('coverage'));
            const csvHeader = logArray[csvHeaderIndex];
            const originalCSVArray = logArray[csvHeaderIndex + 1].split(',');
            const mutantCSVArray = logArray[csvHeaderIndex + 2].split(',');
            const coverageIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('covered'));
            const totalBlocksIndex = csvHeader.split(',').findIndex(headerLine => headerLine.includes('totalBlocks'));
            return {
                originalTotal: originalCSVArray[totalBlocksIndex],
                originalCovered: originalCSVArray[coverageIndex],
                mutantTotal: mutantCSVArray[totalBlocksIndex],
                mutantCovered: mutantCSVArray[coverageIndex]
            };
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
});


describe('Scratch Mutations', () => {
    test('Key-Replacement-Mutation sensing block', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/PressSpaceTest.js");
        await page.evaluate(m => document.querySelector('#container').mutators = m, ["KRM"]);
        await loadProject('test/integration/mutation/KRM-Sensing.sb3')
        await (await page.$('#run-all-tests')).click();
        const {originalCovered, mutantCovered} = await getCSVResults();
        expect(Number(originalCovered)).toBe(3);
        expect(Number(mutantCovered)).toBe(2);
    }, timeout);

    test('Key-Replacement-Mutation hat block', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/PressSpaceTest.js");
        await page.evaluate(m => document.querySelector('#container').mutators = m, ["KRM"]);
        await loadProject('test/integration/mutation/KRM-Hat.sb3')
        await (await page.$('#run-all-tests')).click();
        const {originalCovered, mutantCovered} = await getCSVResults();
        expect(Number(originalCovered)).toBe(2);
        expect(Number(mutantCovered)).toBe(0);
    }, timeout);

    test('Single-Block-Deletion-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await page.evaluate(m => document.querySelector('#container').mutators = m, ["SBD"]);
        await loadProject('test/integration/mutation/SBD.sb3')
        await (await page.$('#run-all-tests')).click();
        const {originalTotal, mutantTotal} = await getCSVResults();
        expect(Number(originalTotal)).toBe(4);
        expect(Number(mutantTotal)).toBe(3);
    }, timeout);

    test('Script-Deletion-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await page.evaluate(m => document.querySelector('#container').mutators = m, ["SDM"]);
        await loadProject('test/integration/mutation/SDM.sb3')
        await (await page.$('#run-all-tests')).click();
        const {originalTotal, mutantTotal} = await getCSVResults();
        expect(Number(originalTotal)).toBe(6);
        expect(Number(mutantTotal)).toBe(4);
    }, timeout);

    test('Arithmetic-Operator-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await page.evaluate(m => document.querySelector('#container').mutators = m, ["AOR"]);
        await loadProject('test/integration/mutation/AOR.sb3')
        await (await page.$('#run-all-tests')).click();
        const {originalCovered, mutantCovered} = await getCSVResults();
        expect(Number(originalCovered)).toBe(5);
        expect(Number(mutantCovered)).toBe(4);
    }, timeout);

    test('Relational-Operator-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await page.evaluate(m => document.querySelector('#container').mutators = m, ["ROR"]);
        await loadProject('test/integration/mutation/ROR.sb3')
        await (await page.$('#run-all-tests')).click();
        const {originalCovered, mutantCovered} = await getCSVResults();
        expect(Number(originalCovered)).toBe(4);
        expect(Number(mutantCovered)).toBe(3);
    }, timeout);

    test('Logical-Operator-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await page.evaluate(m => document.querySelector('#container').mutators = m, ["LOR"]);
        await loadProject('test/integration/mutation/LOR.sb3')
        await (await page.$('#run-all-tests')).click();
        const {originalCovered, mutantCovered} = await getCSVResults();
        expect(Number(originalCovered)).toBe(4);
        expect(Number(mutantCovered)).toBe(3);
    }, timeout);

    test('Variable-Replacement-Mutation', async () => {
        await (await page.$('#fileselect-tests')).uploadFile("test/integration/mutation/WaitTest.js");
        await page.evaluate(m => document.querySelector('#container').mutators = m, ["VRM"]);
        await loadProject('test/integration/mutation/VRM.sb3')
        await (await page.$('#run-all-tests')).click();
        const {originalCovered, mutantCovered} = await getCSVResults();
        expect(Number(originalCovered)).toBe(5);
        expect(Number(mutantCovered)).toBe(4);
    }, timeout);

});

