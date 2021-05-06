const fileUrl = require('file-url');

const timeout = process.env.SLOWMO ? 30000 : 20000;

async function loadProject (scratchPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    await (await page.$('#toggle-advanced')).click();
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

        if (currentCoverageLog.includes("combined: NaN (0/0)")) {
            return "1.00"; // TODO: How much coverage should there be if there are no blocks?
        }

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


/**
 * Reads the distances of fitness, approach level, and branch distance from #output-log
 */
async function readFitnessLog () {
    const output = await page.$('#output-log .output-content');
    while (true) {
        const log = await (await output.getProperty('innerHTML')).jsonValue();
        if (log.includes('uncoveredBlocks')) {
            return JSON.parse(log);
        }
    }
}

beforeEach(async() => {
    await jestPuppeteer.resetBrowser();
    page = await browser.newPage();
    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});
    await (await page.$('#fileselect-config')).uploadFile("../config/integrationtestMIO.json");
});


describe('Corner cases handling', () => {
    test('Test empty project', async () => {
        await loadProject('test/integration/emptyProject/EmptyProject.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");

    }, timeout);

    test('Test code without event handlers', async () => {
        await loadProject('test/integration/onlyDeadCode/OnlyDeadCodeTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("0.00");

    }, timeout);
});

describe('Basic event handling', () => {
    test('Test text typing functionality', async () => {
        await loadProject('test/integration/typeTextEvent/TypeTextEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");

    }, timeout);

    test('Test text seeding functionality', async () => {
        await loadProject('test/integration/typeTextEvent_MultipleAnswers/TypeTextEvent_MultipleAnswersTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");

    }, timeout);


    test('Test Sprite clicking functionality', async () => {
        await loadProject('test/integration/spriteClickEvent/SpriteClickTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");

    }, timeout);


    test('Test key down functionality', async () => {
        await loadProject('test/integration/keyDownEvent/KeyDownEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");

    }, timeout);

    test('Test key press functionality', async () => {
        await loadProject('test/integration/keyPressEvent/KeyPressEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");

    }, timeout);

    test('Test mouse down functionality', async () => {
        await loadProject('test/integration/mouseDownEvent/MouseDownEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");

    }, timeout);

    test('Test mouse move functionality', async () => {
        await loadProject('test/integration/mouseMoveEvent/MouseMoveEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");

    }, timeout);

    test('Test stage clicking functionality', async () => {
        await loadProject('test/integration/stageClickEvent/StageClickedTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");
    }, timeout);

    test('Test clicking on clone', async () => {
        await loadProject('test/integration/cloneClickTest/ClickOnCloneTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");
    }, timeout);

    test('Test wait', async () => {
        await loadProject('test/integration/waitEvent/WaitEventTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");
    }, timeout);
});

describe('Multiple event handling', () => {
    test('Test clicking on script multiple times', async () => {
        await loadProject('test/integration/spriteClickEvent_Multiple/SpriteClickEvent_MultipleTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");
    }, timeout);


    test('Test multiple key presses', async () => {
        await loadProject('test/integration/keyPressEvent_Multiple/KeyPressEvent_MultipleTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");
    }, timeout);

    test('Test multiple stage clicks', async () => {
        await loadProject('test/integration/stageClickEvent_Multiple/StageClickEvent_MultipleTest.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        await (await page.$('#run-all-tests')).click();
        let coverage = await readCoverageOutput();
        await expect(coverage).toBe("1.00");
    }, timeout);
});

describe('Fitness tests',  ()=>{
    test('Test touching color branch distance', async () => {
        await loadProject('test/integration/branchDistance/TouchingColorDistance.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        let log = await readFitnessLog();
        let longerDistanceBranchDistance = log.uncoveredBlocks[0].BranchDistance;
        let shorterDistanceBranchDistance = log.uncoveredBlocks[1].BranchDistance;
        await expect(longerDistanceBranchDistance).toBeGreaterThan(shorterDistanceBranchDistance);
    }, timeout);

    test('Test CFG distance', async () => {
        await loadProject('test/integration/cfgDistance/MoveWithConditions.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        let log = await readFitnessLog();
        let cfg1 = log.uncoveredBlocks[0].CFGDistance;
        let cfg2 = log.uncoveredBlocks[1].CFGDistance;
        await expect(cfg1).toBe(1) && expect(cfg2).toBe(2);
    }, timeout);
});
