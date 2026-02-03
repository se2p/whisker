const fileUrl = require('file-url');
const path = require('path');
const fs = require('fs');

// FIXME: this global variable is actually defined in jest.config.js, but for some reason it is "undefined" here.
const URL = 'dist/index.html';

const timeout = 30000;

async function getOutputLogWhenBBTTestsAreDone(clearLogAfterFinished = false) {
    const output = await page.$('#output-log .output-content');

    while (true) {
        const log = await (await output.getProperty('innerHTML')).jsonValue();

        if (log.includes('Block-Based Tests have finished!')) {

            if (clearLogAfterFinished) {
                await page.$eval('#output-log .output-content', logElement => {
                    logElement.innerHTML = '';
                });
            }

            return log;
        }

        await new Promise(_ => setTimeout(_, 250));
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

    // prevent fancybox tooltip from opening
    await page.evaluate(() => {
        const tooltipLink = document.getElementById('project-contains-bbts-tooltip-link');
        const dummyLink = document.createElement('a');
        dummyLink.setAttribute('id', 'project-contains-bbts-tooltip-link');
        tooltipLink.replaceWith(dummyLink);
    });
});

describe('Block-Based Tests Integration', () => {

    test('A small testing project that contains 4 Block-Based Tests (~6sec)', async () => {

        const projectWithBBTs = 'test/integration/blockBasedTesting/bbt-tests.sb3';

        await (await page.$('#fileselect-project')).uploadFile(projectWithBBTs);
        await (await page.$('#fileselect-tests')).uploadFile(projectWithBBTs);
        await (await page.$('#tabProject')).click();
        await (await page.$('#run-all-tests')).click();
        const outputLog = await getOutputLogWhenBBTTestsAreDone();

        const expectedLog =
            '# project: bbt-tests.sb3\n' +
            '4 Block-Based Tests found in project!\n' +
            'Block-Based Test "timeout-1-sec": Test Result: Timeout!\n' +
            'Block-Based Test "timeout-default": Test Result: Timeout!\n' +
            'Block-Based Test "3-fail-1-pass": Error: ASSERTION_MISSING_CONDITION\n' +
            'Block-Based Test "3-fail-1-pass": Error: ASSERTION_NOT_EQUAL\n' +
            'Block-Based Test "3-fail-1-pass": Error: ASSERTION_VALUE_LESS_OR_EQUAL\n' +
            'Block-Based Test "3-fail-1-pass": Test Result: fail\n' +
            'Block-Based Test "3-pass": Test Result: pass\n' +
            'Block-Based Tests have finished!\n' +
            '\n';

        expect(outputLog).toEqual(expectedLog);
    }, timeout);


    test('Batch Evaluation', async () => {

        await (await page.$('#fileselect-tests')).uploadFile('test/integration/blockBasedTesting/batchEval/bbt-batcheval-solution.sb3');

        const projects = [
            'test/integration/blockBasedTesting/batchEval/bbt-batcheval-correct-submission.sb3',
            'test/integration/blockBasedTesting/batchEval/bbt-batcheval-wrong-submission.sb3',
            'test/integration/blockBasedTesting/batchEval/bbt-batcheval-cheating-submission.sb3'
        ];

        const logs = [];

        for (const project of projects) {
            await (await page.$('#tabUpload')).click();
            await (await page.$('#fileselect-project')).uploadFile(project);
            await (await page.$('#tabProject')).click();
            await (await page.$('#run-all-tests')).click();
            logs.push(await getOutputLogWhenBBTTestsAreDone(true));
        }

        const expectedLog =
            [
                '# project: bbt-batcheval-correct-submission.sb3\n' +
                '1 Block-Based Tests found in project!\n' +
                'Block-Based Test "move 50 steps on green flag click": Test Result: pass\n' +
                'Block-Based Tests have finished!\n' +
                '\n',

                '# project: bbt-batcheval-wrong-submission.sb3\n' +
                '1 Block-Based Tests found in project!\n' +
                'Block-Based Test "move 50 steps on green flag click": Error: CONDITION_IS_FALSE\n' +
                'Block-Based Test "move 50 steps on green flag click": Test Result: fail\n' +
                'Block-Based Tests have finished!\n' +
                '\n',

                '# project: bbt-batcheval-cheating-submission.sb3\n' +
                '1 Block-Based Tests found in project!\n' +
                'Block-Based Test "move 50 steps on green flag click": Error: CONDITION_IS_FALSE\n' +
                'Block-Based Test "move 50 steps on green flag click": Test Result: fail\n' +
                'Block-Based Tests have finished!\n' +
                '\n'
            ];

        expect(logs).toEqual(expectedLog);

    }, timeout);

    test('Test seeding', async () => {

        const logs = [];

        // This project contains a single test that compares a random number to a hardcoded value.
        const projectPath = 'test/integration/blockBasedTesting/bbt-test-seed-98765.sb3';

        await (await page.$('#fileselect-project')).uploadFile(projectPath);
        await (await page.$('#fileselect-tests')).uploadFile(projectPath);

        await (await page.$('#tabProject')).click();

        // no seed
        await (await page.$('#run-all-tests')).click();
        logs.push(await getOutputLogWhenBBTTestsAreDone(true));

        // wrong seed (333)
        await page.$eval('#seed', seedInput => {
            seedInput.value = '333';
        });
        await (await page.$('#run-all-tests')).click();
        logs.push(await getOutputLogWhenBBTTestsAreDone(true));

        // correct seed (98765)
        await page.$eval('#seed', seedInput => {
            seedInput.value = '98765';
        });
        await (await page.$('#run-all-tests')).click();
        logs.push(await getOutputLogWhenBBTTestsAreDone(true));


        const expectedLog =
            [
                // no seed
                '# project: bbt-test-seed-98765.sb3\n' +
                '1 Block-Based Tests found in project!\n' +
                'Block-Based Test "Check if random number equals hardcoded value": Error: ASSERTION_NOT_EQUAL\n' +
                'Block-Based Test "Check if random number equals hardcoded value": Test Result: fail\n' +
                'Block-Based Tests have finished!\n' +
                '\n',

                // wrong seed (333)
                '# project: bbt-test-seed-98765.sb3\n' +
                '1 Block-Based Tests found in project!\n' +
                'Block-Based Test "Check if random number equals hardcoded value": Error: ASSERTION_NOT_EQUAL\n' +
                'Block-Based Test "Check if random number equals hardcoded value": Test Result: fail\n' +
                'Block-Based Tests have finished!\n' +
                '\n',

                // correct seed (98765)
                '# project: bbt-test-seed-98765.sb3\n' +
                '1 Block-Based Tests found in project!\n' +
                'Block-Based Test "Check if random number equals hardcoded value": Test Result: pass\n' +
                'Block-Based Tests have finished!\n' +
                '\n'
            ];

        expect(logs).toEqual(expectedLog);

    }, timeout);

});
