const fileUrl = require('file-url');

const timeout = process.env.SLOWMO ? 100000 : 90000;
const ACCELERATION = 10;

async function loadProject(scratchPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    const toggle = await page.$('#toggle-advanced');
    await toggle.evaluate(t => t.click());
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, ACCELERATION);
}

async function getLogAfterSearch() {
    const output = await page.$('#output-log .output-content');
    while (true) {
        const log = await (await output.getProperty('innerHTML')).jsonValue();
        if (log.includes('uncoveredBlocks')) {
            const csvHeaderIndex = log.split('\n').findIndex(logLine => logLine.includes('projectName'));
            const uncoveredBlocksLog = log.split('\n').slice(0, csvHeaderIndex).join('\n');
            return JSON.parse(uncoveredBlocksLog);
        }
        if (log.includes('empty project')) {
            return 'empty project';
        }
    }
}

beforeEach(async () => {
    await jestPuppeteer.resetBrowser();
    page = await browser.newPage();
    page.on('error', (msg) => console.error(msg.text()))
        .on('pageerror', async (err) => {
            console.error(err.message);
            await page.close(); // Not very graceful, but immediately shuts the test down. There must be a nicer way?
            return Promise.reject(err);
        });
    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});
    await (await page.$('#fileselect-config')).uploadFile("test/integration/testConfigs/defaultMIO.json");
});


describe('Corner cases handling', () => {
    test('Test empty project', async () => {
        await loadProject('test/integration/emptyProject/EmptyProject.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log).toBe('empty project');
    }, timeout);

    test('Test code without event handlers', async () => {
        await loadProject('test/integration/onlyDeadCode/OnlyDeadCodeTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log).toBe('empty project');
    }, timeout);
});

describe('Basic event handling', () => {
    test('Test text typing functionality', async () => {
        await loadProject('test/integration/typeTextEvent/TypeTextEventTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test text seeding functionality', async () => {
        await loadProject('test/integration/typeTextEvent_MultipleAnswers/TypeTextEvent_MultipleAnswersTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);


    test('Test Sprite clicking functionality', async () => {
        await loadProject('test/integration/spriteClickEvent/SpriteClickTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);


    test('Test key down functionality', async () => {
        await loadProject('test/integration/keyDownEvent/KeyDownEventTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test key press functionality', async () => {
        await loadProject('test/integration/keyPressEvent/KeyPressEventTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test mouse down functionality', async () => {
        await loadProject('test/integration/mouseDownEvent/MouseDownEventTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test mouse move functionality', async () => {
        await loadProject('test/integration/mouseMoveEvent/MouseMoveEventTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test mouse move functionality with goTo MousePointer-Block', async () => {
        await loadProject('test/integration/mouseMoveEvent/GoTo-MousePointer.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test mouse move functionality with trigger block being hidden inside another block', async () => {
        await loadProject('test/integration/mouseMoveEvent/MouseMoveAsBlockInput.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test stage clicking functionality', async () => {
        await loadProject('test/integration/stageClickEvent/StageClickedTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test clicking on clone', async () => {
        await loadProject('test/integration/cloneClickTest/ClickOnCloneTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test moving mouse to sprite', async () => {
        await loadProject('test/integration/touchingMousePointer/TouchingMousePointerTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test moving mouse to and from', async () => {
        await loadProject('test/integration/mouseMoveDistance/MouseMoveDistanceTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test wait', async () => {
        await loadProject('test/integration/waitEvent/WaitEventTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test Draw with PenBlock', async () => {
        await loadProject('test/integration/penBlock/Draw.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test Drag Sprite to another Sprite', async () => {
        await loadProject('test/integration/dragSpriteEvent/DragSpriteToSpriteTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test Drag Sprite to Color', async () => {
        // Drag one sprite to a color. Implemented using a "touchingColor" block.
        await loadProject('test/integration/dragSpriteEvent/DragSpriteToColorTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test Drag Sprite to Color 2', async () => {
        // Drag one sprite to a color. Implemented using "colorTouchingColor" block.
        await loadProject('test/integration/dragSpriteEvent/DragSpriteToColorTest2.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test Drag Sprite to Edge', async () => {
        await loadProject('test/integration/dragSpriteEvent/DragSpriteToEdgeTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test SoundEvent triggered by hatBlock', async () => {
        await loadProject('test/integration/soundEvent/SoundEventHat.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test SoundEvent triggered by sensing Block comparing against equal', async () => {
        await loadProject('test/integration/soundEvent/SoundEventSensingEqual.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test SoundEvent triggered by sensing Block comparing against greater than', async () => {
        await loadProject('test/integration/soundEvent/SoundEventSensingGreater.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test SoundEvent triggered by hatBlock comparing against lower than', async () => {
        await loadProject('test/integration/soundEvent/SoundEventSensingLower.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test if a broadcast event has been sent in the previous step and therefore activated a thread with a matching hat', async () => {
        await loadProject('test/integration/hatBlockSpecialHandling/ExecutedHatsCheckBroadcast.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test if a backdrop event has been sent in the previous step and therefore activated a thread with a matching hat', async () => {
        await loadProject('test/integration/hatBlockSpecialHandling/ExecutedHatsCheckBackdrop.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test if a clone event has been sent in the previous step and therefore activated a thread with a matching hat', async () => {
        await loadProject('test/integration/hatBlockSpecialHandling/ExecutedHatsCheckClone.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);
});

describe('Multiple event handling', () => {
    test('Test clicking on script multiple times', async () => {
        await loadProject('test/integration/spriteClickEvent_Multiple/SpriteClickEvent_MultipleTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);


    test('Test multiple key presses', async () => {
        await loadProject('test/integration/keyPressEvent_Multiple/KeyPressEvent_MultipleTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);

    test('Test multiple stage clicks', async () => {
        await loadProject('test/integration/stageClickEvent_Multiple/StageClickEvent_MultipleTest.sb3')
        await (await page.$('#run-search')).click();
        const log = await getLogAfterSearch();
        await (await page.$('#run-all-tests')).click();
        await expect(log.uncoveredBlocks.length).toBe(0);
    }, timeout);
});

