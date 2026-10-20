const {openSearchTab, openWhiskerPage, uploadFile, waitForLog} = require('../utils/whisker-gui');

const timeout = 120000;

async function getOutputLogWhenBBTTestsAreDone(clearLogAfterFinished = false) {
    const log = await waitForLog('#output-log .output-content', 'Block-Based Tests have finished!');
    if (clearLogAfterFinished) {
        await page.$eval('#output-log .output-content', element => {
            element.innerHTML = '';
        });
    }
    return log;
}

beforeEach(async () => {
    await openWhiskerPage();
    await openSearchTab();

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

        await uploadFile('#fileselect-project', projectWithBBTs);
        await uploadFile('#fileselect-tests', projectWithBBTs);
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

        await uploadFile('#fileselect-tests', 'test/integration/blockBasedTesting/batchEval/bbt-batcheval-solution.sb3');

        const projects = [
            'test/integration/blockBasedTesting/batchEval/bbt-batcheval-correct-submission.sb3',
            'test/integration/blockBasedTesting/batchEval/bbt-batcheval-wrong-submission.sb3',
            'test/integration/blockBasedTesting/batchEval/bbt-batcheval-cheating-submission.sb3'
        ];

        const logs = [];

        for (const project of projects) {
            await uploadFile('#fileselect-project', project);
            await openSearchTab();
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

        await uploadFile('#fileselect-project', projectPath);
        await uploadFile('#fileselect-tests', projectPath);

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
