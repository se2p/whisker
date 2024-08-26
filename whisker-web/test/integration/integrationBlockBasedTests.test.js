const fileUrl = require('file-url');
const path = require("path");
const fs = require("fs");

// FIXME: this global variable is actually defined in jest.config.js, but for some reason it is "undefined" here.
const URL = "dist/index.html";

const timeout = 30000;

async function loadProjectAndSwitchToProjectTab(scratchPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    const projectTab = await page.$('#tabProject');
    await projectTab.evaluate(t => t.click());
}

async function getOutputLogWhenBBTTestsAreDone() {
    const output = await page.$('#output-log .output-content');

    while (true) {
        const log = await (await output.getProperty('innerHTML')).jsonValue();

        if (log.includes('Block-Based Tests have finished!')) {
            return log;
        }

        await new Promise(_ => setTimeout(_, 250));
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

describe('Block-Based Tests', () => {

    test('A small testing project that contains 4 Block-Based Tests (~6sec)', async () => {
        await loadProjectAndSwitchToProjectTab('test/integration/blockBasedTesting/bbt-tests.sb3');
        await (await page.$('#run-all-tests')).click();
        const outputLog = await getOutputLogWhenBBTTestsAreDone();

        const expectedLog =
            "# project: bbt-tests.sb3\n" +
            "4 Block-Based Tests found in project!\n" +
            "Block-Based Test \"timeout-1-sec\": Test Result: Timeout!\n" +
            "Block-Based Test \"timeout-default\": Test Result: Timeout!\n" +
            "Block-Based Test \"3-fail-1-pass\": Error: ASSERTION_MISSING_CONDITION\n" +
            "Block-Based Test \"3-fail-1-pass\": Error: ASSERTION_NOT_EQUAL\n" +
            "Block-Based Test \"3-fail-1-pass\": Error: ASSERTION_VALUE_LESS_OR_EQUAL\n" +
            "Block-Based Test \"3-fail-1-pass\": Test Result: fail\n" +
            "Block-Based Test \"3-pass\": Test Result: pass\n" +
            "Block-Based Tests have finished!\n" +
            "\n";

        expect(outputLog).toEqual(expectedLog);
    }, timeout);

});
