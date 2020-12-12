const fileUrl = require('file-url');

const timeout = process.env.SLOWMO ? 30000 : 20000;

async function loadProject (scratchPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    await (await page.$('#toggle-output')).click();
    await (await page.$('#toggle-editor')).click();
    await page.evaluate(factor => document.querySelector('#acceleration-factor').value = factor, ACCELERATION);
}

async function waitForSearchCompletion () {
    const coverageOutput = await page.$('#output-run .output-content');

    while (true) {
        const currentCoverageLog = await (await coverageOutput.getProperty('innerHTML')).jsonValue();
        if (currentCoverageLog.includes('summary')) {
            break;
        }
    }
}

/**
 * Reads the coverage and log field until the summary is printed into the coverage field, indicating that the test
 * run is over.
 */
async function readCoverageOutput () {
    const coverageOutput = await page.$('#output-run .output-content');
    let coverageLog = '';

    while (true) {
        const currentCoverageLog = await (await coverageOutput.getProperty('innerHTML')).jsonValue();
        coverageLog = currentCoverageLog;

        if (currentCoverageLog.includes('combined:')) {
            var re = /combined: (\d+\.\d+)/i;
            var matches_array = currentCoverageLog.match(re);
            return matches_array[1];
        }
        if (currentCoverageLog.includes('summary')) {
            break;
        }

        await page.waitForTimeout(1000);
    }

    return coverageLog;
}

beforeEach(async() => {
    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});
    await (await page.$('#fileselect-config')).uploadFile("../config/integrationtest.json");
});

describe('Basic event handling', () => {
    test('Test text typing functionality', async () => {
        await loadProject('test/integration/typeTextEvent/TypeTextEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);

    test('Test text seeding functionality', async () => {
        await loadProject('test/integration/typeTextEvent_MultipleAnswers/TypeTextEvent_MultipleAnswersTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);


    test('Test Sprite clicking functionality', async () => {
        await loadProject('test/integration/spriteClickEvent/SpriteClickTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);


    test('Test key down functionality', async () => {
        await loadProject('test/integration/keyDownEvent/KeyDownEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);

    test('Test key press functionality', async () => {
        await loadProject('test/integration/keyPressEvent/KeyPressEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);

    test('Test mouse down functionality', async () => {
        await loadProject('test/integration/mouseDownEvent/MouseDownEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);

    test('Test mouse move functionality', async () => {
        await loadProject('test/integration/mouseMoveEvent/MouseMoveEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);

    test('Test stage clicking functionality', async () => {
        await loadProject('test/integration/stageClickEvent/StageClickedTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");
    }, timeout);

    test('Test clicking on script multiple times', async () => {
        await loadProject('test/integration/spriteClickEvent_Multiple/SpriteClickEvent_MultipleTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");
    }, timeout);


    test('Test multiple key presses', async () => {
        await loadProject('test/integration/keyPressEvent_Multiple/KeyPressEvent_MultipleTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");
    }, timeout);

    test('Test multiple stage clicks', async () => {
        await loadProject('test/integration/stageClickEvent_Multiple/StageClickEvent_MultipleTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");
    }, timeout);
});
