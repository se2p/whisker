const {loadProject, openWhiskerPage, sleep, uploadFile, waitForLog} = require('../utils/whisker-gui');

const timeout = 30000;

async function getLogAfterSearch() {
    const log = await waitForLog('#output-log .output-content', ['uncoveredBlocks', 'empty project'], timeout - 3000);
    if (log.includes('empty project')) return 'empty project';
    const csvHeaderIndex = log.split('\n').findIndex(logLine => logLine.includes('projectName'));
    const uncoveredBlocksLog = log.split('\n').slice(0, csvHeaderIndex)
        .join('\n');
    return JSON.parse(uncoveredBlocksLog);
}

beforeEach(async () => {
    await openWhiskerPage();
    await uploadFile('#fileselect-config', 'test/integration/testConfigs/random.json');
});

describe('Corner cases handling', () => {
    test('Test empty project', async () => {
        await loadProject('test/integration/emptyProject/EmptyProject.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log).toBe('empty project');
    }, timeout);

    test('Test code without event handlers', async () => {
        await loadProject('test/integration/onlyDeadCode/OnlyDeadCodeTest.sb3');
        await sleep(500);
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log).toBe('empty project');
    }, timeout);
});

describe('Basic event handling', () => {
    test('Test text typing functionality', async () => {
        await loadProject('test/integration/typeTextEvent/TypeTextEventTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test text seeding functionality', async () => {
        await loadProject('test/integration/typeTextEvent_MultipleAnswers/TypeTextEvent_MultipleAnswersTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test Sprite clicking functionality', async () => {
        await loadProject('test/integration/spriteClickEvent/SpriteClickTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test key down functionality', async () => {
        await loadProject('test/integration/keyDownEvent/KeyDownEventTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test key press functionality', async () => {
        await loadProject('test/integration/keyPressEvent/KeyPressEventTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test mouse down functionality', async () => {
        await loadProject('test/integration/mouseDownEvent/MouseDownEventTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test mouse move functionality', async () => {
        await loadProject('test/integration/mouseMoveEvent/MouseMoveEventTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test mouse move functionality with goTo MousePointer-Block', async () => {
        await loadProject('test/integration/mouseMoveEvent/GoTo-MousePointer.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test mouse move functionality with trigger block being hidden inside another block', async () => {
        await loadProject('test/integration/mouseMoveEvent/MouseMoveAsBlockInput.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test stage clicking functionality', async () => {
        await loadProject('test/integration/stageClickEvent/StageClickedTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test clicking on clone', async () => {
        await loadProject('test/integration/cloneClickTest/ClickOnCloneTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test moving mouse to sprite', async () => {
        await loadProject('test/integration/touchingMousePointer/TouchingMousePointerTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test moving mouse to and from', async () => {
        await loadProject('test/integration/mouseMoveDistance/MouseMoveDistanceTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test wait', async () => {
        await loadProject('test/integration/waitEvent/WaitEventTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test Draw with PenBlock', async () => {
        await loadProject('test/integration/penBlock/Draw.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test Drag Sprite to another Sprite', async () => {
        await loadProject('test/integration/dragSpriteEvent/DragSpriteToSpriteTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test Drag Sprite to Color', async () => {
        // Drag one sprite to a color. Implemented using a "touchingColor" block.
        await loadProject('test/integration/dragSpriteEvent/DragSpriteToColorTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test Drag Sprite to Color 2', async () => {
        // Drag one sprite to a color. Implemented using "colorTouchingColor" block.
        await loadProject('test/integration/dragSpriteEvent/DragSpriteToColorTest2.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test Drag Sprite to Edge', async () => {
        await loadProject('test/integration/dragSpriteEvent/DragSpriteToEdgeTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test SoundEvent triggered by hatBlock', async () => {
        await loadProject('test/integration/soundEvent/SoundEventHat.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test SoundEvent triggered by sensing Block comparing against equal', async () => {
        await loadProject('test/integration/soundEvent/SoundEventSensingEqual.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test SoundEvent triggered by sensing Block comparing against greater than', async () => {
        await loadProject('test/integration/soundEvent/SoundEventSensingGreater.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test SoundEvent triggered by hatBlock comparing against lower than', async () => {
        await loadProject('test/integration/soundEvent/SoundEventSensingLower.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test TypeNumberEvent required to provide answers', async () => {
        await loadProject('test/integration/numberEvent/TypeNumberEvent.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test if a broadcast event has been sent in the previous step and therefore activated a thread with a matching hat', async () => {
        await loadProject('test/integration/hatBlockSpecialHandling/ExecutedHatsCheckBroadcast.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test if a backdrop event has been sent in the previous step and therefore activated a thread with a matching hat', async () => {
        await loadProject('test/integration/hatBlockSpecialHandling/ExecutedHatsCheckBackdrop.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test if a clone event has been sent in the previous step and therefore activated a thread with a matching hat', async () => {
        await loadProject('test/integration/hatBlockSpecialHandling/ExecutedHatsCheckClone.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);
});

describe('Multiple event handling', () => {
    test('Test clicking on script multiple times', async () => {
        await loadProject('test/integration/spriteClickEvent_Multiple/SpriteClickEvent_MultipleTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test multiple key presses', async () => {
        await loadProject('test/integration/keyPressEvent_Multiple/KeyPressEvent_MultipleTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test multiple stage clicks', async () => {
        await loadProject('test/integration/stageClickEvent_Multiple/StageClickEvent_MultipleTest.sb3');
        const runSearch = await page.$('#run-search');
        await runSearch.evaluate(t => t.click());
        const log = await getLogAfterSearch();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);
});
