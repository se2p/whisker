const fileUrl = require('file-url');
const path = require("path");
const fs = require("fs");

// FIXME: this global variable is actually defined in jest.config.js, but for some reason it is "undefined" here.
const URL = "dist/index.html";

const timeout = 30000;
const ACCELERATION = 10;

async function loadProject(scratchPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    const projectTab = await page.$('#tabProject');
    await projectTab.evaluate(t => t.click());
    const toggleExtendedView = await page.$('#extendedView');
    await toggleExtendedView.evaluate(t => t.click());
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, ACCELERATION);
}

/**
 * Reads the distances of fitness, approach level, and branch distance from #output-log
 */
async function readFitnessLog() {
    const output = await page.$('#output-log .output-content');
    while (true) {
        const outputContent = await output.getProperty('innerHTML');
        const log = await outputContent.jsonValue();
        if (log.includes('uncoveredBlocks')) {
            const csvHeaderIndex = log.split('\n').findIndex(logLine => logLine.includes('projectName'));
            const uncoveredBlocksLog = log.split('\n').slice(0, csvHeaderIndex).join('\n');
            return JSON.parse(uncoveredBlocksLog);
        }
    }
}

/**
 * Checks approachLevel, branchDistance and CFG-Distance for executionHaltingBlocks.
 * @returns {Promise<void>}
 */
async function checkFitnessValuesForExecutionHaltingBlocks() {
    const runSearch = await page.$('#run-search');
    await runSearch.evaluate(t => t.click());
    let log = await readFitnessLog();
    while (log.uncoveredBlocks[0] === undefined) {
        log = await readFitnessLog();
    }
    const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
    await expect(approachLevel).toBe(0);
    const branchDistance = log.uncoveredBlocks[0].BranchDistance;
    await expect(branchDistance).toBeLessThanOrEqual(1);
    await expect(branchDistance).toBeGreaterThan(0);
    const CFGDistance = log.uncoveredBlocks[0].CFGDistance;
    await expect(CFGDistance).toBe(Number.MAX_VALUE);
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
    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});
    await (await page.$('#fileselect-config')).uploadFile("test/integration/testConfigs/fitnessTests.json");
});


describe('Fitness tests', () => {
    test('Test touching color branch distance', async () => {
        await loadProject('test/integration/branchDistance/TouchingColorDistance.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const longerDistanceBranchDistance = log.uncoveredBlocks[0].BranchDistance;
        const shorterDistanceBranchDistance = log.uncoveredBlocks[1].BranchDistance;
        await expect(longerDistanceBranchDistance).toBeGreaterThan(shorterDistanceBranchDistance);

        const stageDiameter = Math.hypot(360, 480);

        // The smallest distance between the two sprites is 41 pixels, the biggest distance is 156 pixels.
        // Branch distance should be somewhere in between.
        await expect(shorterDistanceBranchDistance).toBeGreaterThanOrEqual(41 / stageDiameter);
        await expect(shorterDistanceBranchDistance).toBeLessThanOrEqual(156 / stageDiameter);

        // The smallest distance between the two sprites is 120 pixels, the biggest distance is 411 pixels.
        // Branch distance should be somewhere in between.
        await expect(longerDistanceBranchDistance).toBeGreaterThanOrEqual(120 / stageDiameter);
        await expect(longerDistanceBranchDistance).toBeLessThanOrEqual(411 / stageDiameter);
    }, timeout);

    test('Test color touching color branch distance', async () => {
        await loadProject('test/integration/branchDistance/ColorTouchingColorDistance.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const {uncoveredBlocks} = await readFitnessLog();

        // The distance between the purple and red rectangle (longer, they do not touch), and
        // the distance between the purple and green rectangle (shorter, they do not touch).
        const longerDistanceBranchDistance = uncoveredBlocks[0].BranchDistance;
        const shorterDistanceBranchDistance = uncoveredBlocks[1].BranchDistance;
        await expect(longerDistanceBranchDistance).toBeGreaterThan(shorterDistanceBranchDistance);

        const stageDiameter = Math.hypot(360, 480);

        // The smallest distance between the two sprites is 41 pixels, the biggest distance is 156 pixels.
        // Branch distance should be somewhere in between.
        await expect(shorterDistanceBranchDistance).toBeGreaterThanOrEqual(41 / stageDiameter);
        await expect(shorterDistanceBranchDistance).toBeLessThanOrEqual(156 / stageDiameter);

        // The smallest distance between the two sprites is 120 pixels, the biggest distance is 411 pixels.
        // Branch distance should be somewhere in between.
        await expect(longerDistanceBranchDistance).toBeGreaterThanOrEqual(120 / stageDiameter);
        await expect(longerDistanceBranchDistance).toBeLessThanOrEqual(411 / stageDiameter);

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
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
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
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test if else distance', async () => {
        await loadProject('test/integration/branchDistance/IfElseDistance.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test if then else distance', async () => {
        await loadProject('test/integration/branchDistance/IfThenElseDistance.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test wait until distance', async () => {
        await loadProject('test/integration/branchDistance/WaitUntilDistance.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test repeat until distance', async () => {
        await loadProject('test/integration/branchDistance/RepeatUntilDistance.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test repeat until distance', async () => {
        await loadProject('test/integration/branchDistance/RepeatUntilTrueDistance.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(1);
    }, timeout);

    test('Test repeat until distance with multiple loop iterations', async () => {
        await loadProject('test/integration/branchDistance/BranchDistanceLoopIterations.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(10);
    }, timeout);

    test('Test repeat until distance with multiple loop iterations, with increasing distances', async () => {
        await loadProject('test/integration/branchDistance/BranchDistanceLoopIterations_Increasing.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(10);
    }, timeout);

    test('Test repeat until distance for approach level', async () => {
        await loadProject('test/integration/branchDistance/RepeatUntilApproachLevel1.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
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
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(1);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(42);
    }, timeout);

    test('Test impossible repeat', async () => {
        await loadProject('test/integration/branchDistance/ImpossibleRepeatTimes.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(1);
    }, timeout);

    test('Test impossible to leave repeat', async () => {
        await loadProject('test/integration/branchDistance/ImpossibleRepeatTimes_False.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const approachLevel = log.uncoveredBlocks[0].ApproachLevel;
        await expect(approachLevel).toBe(0);
        const branchDistance = log.uncoveredBlocks[0].BranchDistance;
        await expect(branchDistance).toBe(9);
    }, timeout);

    test('Test CFG distance when branch distance !== 0', async () => {
        await loadProject('test/integration/cfgDistance/NestedConditions.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const [controlWaitBlock1, controlWaitBlock2] = log.uncoveredBlocks.filter(b => b.block.endsWith("control_wait"));
        const controlStopBlock = log.uncoveredBlocks.filter(b => b.block.endsWith("control_stop"))[0];
        const controlIfBlock = log.uncoveredBlocks.filter(b => b.block.endsWith("control_if"))[0];
        await expect(controlWaitBlock1.CFGDistance).toBe(Number.MAX_VALUE);
        await expect(controlWaitBlock2.CFGDistance).toBe(Number.MAX_VALUE);
        await expect(controlStopBlock.CFGDistance).toBe(Number.MAX_VALUE);
        await expect(controlIfBlock.CFGDistance).toBe(Number.MAX_VALUE);
    }, timeout);

    test('Test CFG distance when branch distance == 0', async () => {
        await loadProject('test/integration/cfgDistance/CFGDistanceWithDefineHack.sb3')
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await readFitnessLog();
        const moveStepsBlock = log.uncoveredBlocks.filter(b => b.block.endsWith("motion_movesteps"))[0];
        expect(moveStepsBlock.CFGDistance).toBe(1);
        const looksSayBlock = log.uncoveredBlocks.filter(b => b.block.endsWith("looks_say"))[0];
        expect(looksSayBlock.CFGDistance).toBe(2);
        const motionTurnLeftBlock = log.uncoveredBlocks.filter(b => b.block.endsWith("motion_turnleft"))[0];
        expect(motionTurnLeftBlock.CFGDistance).toBe(3);
    }, timeout);

    test('Test branchDistance for execution halting wait', async () => {
        await loadProject('test/integration/branchDistance/ExecutionHalting-Wait.sb3')
        await checkFitnessValuesForExecutionHaltingBlocks();
    }, timeout);

    test('Test branchDistance for execution halting say for seconds blocks', async () => {
        await loadProject('test/integration/branchDistance/ExecutionHalting-SayForSeconds.sb3')
        await checkFitnessValuesForExecutionHaltingBlocks();
    }, timeout);

    test('Test branchDistance for execution halting think for seconds blocks', async () => {
        await loadProject('test/integration/branchDistance/ExecutionHalting-ThinkForSeconds.sb3')
        await checkFitnessValuesForExecutionHaltingBlocks();
    }, timeout);

    test('Test branchDistance for execution halting glide to (x,y) blocks', async () => {
        await loadProject('test/integration/branchDistance/ExecutionHalting-GlideToXY.sb3')
        await checkFitnessValuesForExecutionHaltingBlocks();
    }, timeout);

    test('Test branchDistance for execution halting glide to blocks', async () => {
        await loadProject('test/integration/branchDistance/ExecutionHalting-GlideTo.sb3')
        await checkFitnessValuesForExecutionHaltingBlocks();
    }, timeout);

    test('Test branchDistance for execution play sound until done blocks', async () => {
        await loadProject('test/integration/branchDistance/ExecutionHalting-PlaySoundUntilDone.sb3')
        await checkFitnessValuesForExecutionHaltingBlocks();
    }, timeout);

    test('Test branchDistance for execution halting text2speech blocks', async () => {
        await loadProject('test/integration/branchDistance/ExecutionHalting-Text2Speech.sb3')
        await checkFitnessValuesForExecutionHaltingBlocks();
    }, timeout);
});
