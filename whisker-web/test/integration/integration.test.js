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

describe('Test text typing functionality', () => {
    test('Can type', async () => {
        await loadProject('test/integration/typeTextEvent/TypeTextEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);
});


describe('Test text seeding functionality', () => {
    test('Can use seeded strings', async () => {
        await loadProject('test/integration/typeTextEvent_MultipleAnswers/TypeTextEvent_MultipleAnswersTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);
});


describe('Test Sprite clicking functionality', () => {
    test('Can click', async () => {
        await loadProject('test/integration/spriteClickEvent/SpriteClickTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);
});


describe('Test key down functionality', () => {
    test('Can press key down', async () => {
        await loadProject('test/integration/keyDownEvent/KeyDownEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);
});

describe('Test key press functionality', () => {
    test('Can press key', async () => {
        await loadProject('test/integration/keyPressEvent/KeyPressEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);
});

describe('Test mouse down functionality', () => {
    test('Can do mouse down', async () => {
        await loadProject('test/integration/mouseDownEvent/MouseDownEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);
});

describe('Test mouse move functionality', () => {
    test('Can move mouse', async () => {
        await loadProject('test/integration/mouseMoveEvent/MouseMoveEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");

    }, timeout);
});

describe('Test stage clicking functionality', () => {
    test('Can click stage', async () => {
        await loadProject('test/integration/stageClickEvent/StageClickedTest.sb3')
        debugger;
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        expect(coverage).toBe("1.00");
    }, timeout);
});

