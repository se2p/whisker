const fileUrl = require('file-url');

const timeout = process.env.SLOWMO ? 70000 : 80000;
const ACCELERATION = 10;

async function loadProject (scratchPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    await (await page.$('#toggle-advanced')).click();
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, ACCELERATION);
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
    await (await page.$('#fileselect-config')).uploadFile("test/integration/testConfigs/fitnessTests.json");
});


describe('Fitness tests',  ()=>{
    test('Test touching color branch distance', async () => {
        await loadProject('test/integration/branchDistance/TouchingColorDistance.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const longerDistanceBranchDistance = log.uncoveredBlocks[0].BranchDistance;
        const shorterDistanceBranchDistance = log.uncoveredBlocks[1].BranchDistance;
        await expect(longerDistanceBranchDistance).toBeGreaterThan(shorterDistanceBranchDistance);
    }, timeout);

    test('Test edge touching branch distance', async () => {
        await loadProject('test/integration/branchDistance/TouchingEdgeDistance.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        await expect(log.uncoveredBlocks.length === 2);
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const longerDistanceBranchDistance = log.uncoveredBlocks[0].BranchDistance;
        const shorterDistanceBranchDistance = log.uncoveredBlocks[1].BranchDistance;
        await expect(longerDistanceBranchDistance).toBeGreaterThan(0);
        await expect(shorterDistanceBranchDistance).toBeGreaterThan(0);
        await expect(longerDistanceBranchDistance).toBeGreaterThan(shorterDistanceBranchDistance);
    }, timeout);

    test('Test if then distance', async () => {
        await loadProject('test/integration/branchDistance/IfThenDistance.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test if else distance', async () => {
        await loadProject('test/integration/branchDistance/IfElseDistance.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test if then else distance', async () => {
        await loadProject('test/integration/branchDistance/IfThenElseDistance.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test wait until distance', async () => {
        await loadProject('test/integration/branchDistance/WaitUntilDistance.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test repeat until distance', async () => {
        await loadProject('test/integration/branchDistance/RepeatUntilDistance.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test repeat until distance', async () => {
        await loadProject('test/integration/branchDistance/RepeatUntilTrueDistance.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(1);
    }, timeout);

    test('Test repeat until distance with multiple loop iterations', async () => {
        await loadProject('test/integration/branchDistance/BranchDistanceLoopIterations.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(10);
    }, timeout);

    test('Test repeat until distance with multiple loop iterations, with increasing distances', async () => {
        await loadProject('test/integration/branchDistance/BranchDistanceLoopIterations_Increasing.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(10);
    }, timeout);

    test('Test repeat until distance for approach level', async () => {
        await loadProject('test/integration/branchDistance/RepeatUntilApproachLevel1.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        await expect(log.uncoveredBlocks.length).toBe(2);
        let blockNum = 1;
        if (log.uncoveredBlocks[0].block.startsWith("{o`8=`86ZNH.D7Lu(*GS")) {
            blockNum = 0;
        }
        const approachLevel  = log.uncoveredBlocks[blockNum].ApproachLevel;
        await expect(approachLevel).toBe(1);
        const branchDistance = log.uncoveredBlocks[blockNum].BranchDistance;
        await expect(branchDistance).toBe(1);
    }, timeout);


    test('Test nested if approach level', async () => {
        await loadProject('test/integration/branchDistance/NestedIf.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(1);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test impossible repeat', async () => {
        await loadProject('test/integration/branchDistance/ImpossibleRepeatTimes.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(1);
    }, timeout);

    test('Test impossible to leave repeat', async () => {
        await loadProject('test/integration/branchDistance/ImpossibleRepeatTimes_False.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const approachLevel  = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(10);
    }, timeout);

    test('Test CFG distance', async () => {
        await loadProject('test/integration/cfgDistance/MoveWithConditions.sb3')
        await (await page.$('#run-search')).click();
        await waitForSearchCompletion();
        const log = await readFitnessLog();
        const cfg1 = log.uncoveredBlocks[0].CFGDistance;
        const cfg2 = log.uncoveredBlocks[1].CFGDistance;
        await expect(cfg1).toBe(Number.MAX_VALUE) && expect(cfg2).toBe(Number.MAX_VALUE);
    }, timeout);
});
