const fileUrl = require('file-url');
const exp = require("constants");

const timeout = process.env.SLOWMO ? 70000 : 80000;
const ACCELERATION = 10;

async function loadProject(scratchPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    const toggle = await page.$('#toggle-advanced');
    await toggle.evaluate(t => t.click());
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, ACCELERATION);
}

/**
 * Reads the distances of fitness, approach level, and branch distance from #output-log
 */
async function readFitnessLog() {
    const output = await page.$('#output-log .output-content');
    while (true) {
        const log = await (await output.getProperty('innerHTML')).jsonValue();
        if (log.includes('uncoveredBlocks')) {
            const csvHeaderIndex = log.split('\n').findIndex(logLine => logLine.includes('projectName'));
            const uncoveredBlocksLog = log.split('\n').slice(0, csvHeaderIndex).join('\n');
            return JSON.parse(uncoveredBlocksLog);
        }
    }
}

beforeEach(async () => {
    await jestPuppeteer.resetBrowser();
    page = await browser.newPage();
    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});
    await (await page.$('#fileselect-config')).uploadFile("test/integration/testConfigs/fitnessTests.json");
});


describe('Fitness tests', () => {
    test('Test touching color branch distance', async () => {
        await loadProject('test/integration/branchDistance/TouchingColorDistance.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const longerDistanceBranchDistance = log.uncoveredBlocks[0].BranchDistance;
        const shorterDistanceBranchDistance = log.uncoveredBlocks[1].BranchDistance;
        await expect(longerDistanceBranchDistance).toBeGreaterThan(shorterDistanceBranchDistance);
    }, timeout);

    test('Test color touching color branch distance', async () => {
        await loadProject('test/integration/branchDistance/ColorTouchingColorDistance.sb3')
        await (await page.$('#run-search')).click();
        const {uncoveredBlocks} = await readFitnessLog();

        // The distance between the purple and red rectangle (longer, they do not touch), and
        // the distance between the purple and green rectangle (shorter, they do not touch).
        const longerDistanceBranchDistance = uncoveredBlocks[0].BranchDistance;
        const shorterDistanceBranchDistance = uncoveredBlocks[1].BranchDistance;
        await expect(longerDistanceBranchDistance).toBeGreaterThan(shorterDistanceBranchDistance);

        // The purple and yellow rectangle do touch, but the purple rectangle does not contain the color red. So this
        // block always returns false, and the true distance is always 1.
        const trueDistance = uncoveredBlocks[2].BranchDistance;
        await expect(trueDistance).toBe(1);

        // The purple and yellow rectangle already touch, the false distance must always be 1.
        const falseDistance = uncoveredBlocks[3].BranchDistance;
        await expect(falseDistance).toBe(1);
    }, timeout);

    test('Test edge touching branch distance', async () => {
        await loadProject('test/integration/branchDistance/TouchingEdgeDistance.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        await expect(log.uncoveredBlocks.length === 2);
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
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
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test if else distance', async () => {
        await loadProject('test/integration/branchDistance/IfElseDistance.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test if then else distance', async () => {
        await loadProject('test/integration/branchDistance/IfThenElseDistance.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test wait until distance', async () => {
        await loadProject('test/integration/branchDistance/WaitUntilDistance.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test repeat until distance', async () => {
        await loadProject('test/integration/branchDistance/RepeatUntilDistance.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test repeat until distance', async () => {
        await loadProject('test/integration/branchDistance/RepeatUntilTrueDistance.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(1);
    }, timeout);

    test('Test repeat until distance with multiple loop iterations', async () => {
        await loadProject('test/integration/branchDistance/BranchDistanceLoopIterations.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(10);
    }, timeout);

    test('Test repeat until distance with multiple loop iterations, with increasing distances', async () => {
        await loadProject('test/integration/branchDistance/BranchDistanceLoopIterations_Increasing.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(10);
    }, timeout);

    test('Test repeat until distance for approach level', async () => {
        await loadProject('test/integration/branchDistance/RepeatUntilApproachLevel1.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        await expect(log.uncoveredBlocks.length).toBe(2);
        let blockNum = 1;
        if (log.uncoveredBlocks[0].block.startsWith("{o`8=`86ZNH.D7Lu(*GS")) {
            blockNum = 0;
        }
        const approachLevel = log.uncoveredBlocks[blockNum].ApproachLevel;
        await expect(approachLevel).toBe(1);
        const branchDistance = log.uncoveredBlocks[blockNum].BranchDistance;
        await expect(branchDistance).toBe(1);
    }, timeout);


    test('Test nested if approach level', async () => {
        await loadProject('test/integration/branchDistance/NestedIf.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(1);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test impossible repeat', async () => {
        await loadProject('test/integration/branchDistance/ImpossibleRepeatTimes.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(1);
    }, timeout);

    test('Test impossible to leave repeat', async () => {
        await loadProject('test/integration/branchDistance/ImpossibleRepeatTimes_False.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(9);
    }, timeout);

    test('Test CFG distance when approach level = 0', async () => {
        await loadProject('test/integration/cfgDistance/MoveWithConditions.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const cfg1 = log.uncoveredBlocks[0].CFGDistance;
        const cfg2 = log.uncoveredBlocks[1].CFGDistance;
        await expect(cfg1).toBe(Number.MAX_VALUE) && expect(cfg2).toBe(Number.MAX_VALUE);
    }, timeout);

    test('Test CFG distance when approach level != 0', async () => {
        await loadProject('test/integration/cfgDistance/NestedConditions.sb3')
        await (await page.$('#run-search')).click();
        const log = await readFitnessLog();
        const [controlWaitBlock1, controlWaitBlock2] = log.uncoveredBlocks.filter(b => b.block.endsWith("control_wait"));
        const controlStopBlock = log.uncoveredBlocks.filter(b => b.block.endsWith("control_stop"))[0];
        const controlIfBlock = log.uncoveredBlocks.filter(b => b.block.endsWith("control_if"))[0];
        await expect(controlWaitBlock1.CFGDistance).toBe(1);
        await expect(controlWaitBlock2.CFGDistance).toBe(2);
        await expect(controlStopBlock.CFGDistance).toBe(3);
        await expect(controlIfBlock.CFGDistance).toBe(3);
    }, timeout);
});
