const fileUrl = require('file-url');

const timeout = process.env.SLOWMO ? 1000000 : 900000;
const ACCELERATION = 10;

async function loadProject(scratchPath, modelPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    await (await page.$('#fileselect-models')).uploadFile(modelPath);
    await page.evaluate(m => document.querySelector('#container').mutators = m, '');
    const toggle = await page.$('#toggle-advanced');
    await toggle.evaluate(t => t.click());
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, ACCELERATION);
}

async function readModelErrors() {
    const coverageOutput = await page.$('#output-run .output-content');
    const errorsInModelR = /errors_in_model: (\d)+/i;
    const failsInModelR = /fails_in_model: (\d)+/i;
    const modelCoverageR = /modelCoverage:\n(.)*combined: (\d+\.\d+)/i;

    while (true) {
        const log = await (await coverageOutput.getProperty('innerHTML')).jsonValue();
        if (log.includes('summary')) {
            return {
                errorsInModel: log.match(errorsInModelR)[1],
                failsInModel: log.match(failsInModelR)[1],
                modelCoverage: log.match(modelCoverageR)[2]
            };
        }
    }
}

beforeEach(async () => {
    await jestPuppeteer.resetBrowser();
    page = await browser.newPage();
    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});
});

// Tests for events during a step with a listener in check utility
describe('Model tests on multiple events per step', () => {
    test('color event listener', async () => {
        await loadProject('test/model/scratch-programs/ColorEvent.sb3',
            'test/model/model-jsons/ColorEvent.json');
        await (await page.$('#run-all-tests')).click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        await expect(modelCoverage).toBe("1.00");
    }, timeout);

    test('Sprite touching event listener', async () => {
        await loadProject('test/model/scratch-programs/SpriteTouchingEvent.sb3',
            'test/model/model-jsons/SpriteTouchingEvent.json');
        await (await page.$('#run-all-tests')).click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        await expect(modelCoverage).toBe("1.00");
    }, timeout);

    test('move event listener (change)', async () => {
        await loadProject('test/model/scratch-programs/MoveEvent.sb3',
            'test/model/model-jsons/MoveEventChange.json');
        await (await page.$('#run-all-tests')).click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        await expect(modelCoverage).toBe("1.00");
    }, timeout);

    test('move event listener (comp)', async () => {
        await loadProject('test/model/scratch-programs/MoveEvent.sb3',
            'test/model/model-jsons/MoveEventComp.json');
        await (await page.$('#run-all-tests')).click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        await expect(modelCoverage).toBe("1.00");
    }, timeout);

    test('move event listener (expr)', async () => {
        await loadProject('test/model/scratch-programs/MoveEvent.sb3',
            'test/model/model-jsons/MoveEventExpr.json');
        await (await page.$('#run-all-tests')).click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        await expect(modelCoverage).toBe("1.00");
    }, timeout);

    test('move event listener (function)', async () => {
        await loadProject('test/model/scratch-programs/MoveEvent.sb3',
            'test/model/model-jsons/MoveEventFunction.json');
        await (await page.$('#run-all-tests')).click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        await expect(modelCoverage).toBe("1.00");
    }, timeout);

    test('output event listener', async () => {
        await loadProject('test/model/scratch-programs/OutputEvent.sb3',
            'test/model/model-jsons/OutputEvent.json');
        await (await page.$('#run-all-tests')).click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        await expect(modelCoverage).toBe("1.00");
    }, timeout);

    test('variable change event listener', async () => {
        await loadProject('test/model/scratch-programs/VariableEvent.sb3',
            'test/model/model-jsons/VariableEvent.json');
        await (await page.$('#run-all-tests')).click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        await expect(modelCoverage).toBe("1.00");
    }, timeout);

    test('visual change event listeners', async () => {
        await loadProject('test/model/scratch-programs/BackgroundChange.sb3',
            'test/model/model-jsons/BackgroundChange.json');
        await (await page.$('#run-all-tests')).click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        await expect(modelCoverage).toBe("1.00");
    }, timeout);

    test('visual change event listeners 2', async () => {
        await loadProject('test/model/scratch-programs/VisualEvents.sb3',
            'test/model/model-jsons/VisualEvents.json');
        await (await page.$('#run-all-tests')).click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        await expect(modelCoverage).toBe("1.00");
    }, timeout);

    jest.setTimeout(100000);
    test('fruitcatcher with random model input', async () => {
        await loadProject('test/model/scratch-programs/fruitcatcher.sb3',
            'test/model/model-jsons/fruitcatcher-random-fruit.json');
        await page.evaluate(factor => document.querySelector('#model-duration').value = factor, 33);
        await page.evaluate(factor => document.querySelector('#model-repetitions').value = factor, 8);

        await (await page.$('#run-all-tests')).click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        // as there are not enough repetitions (for shorter pipeline) only test for coverage > 0.9.
        await expect(Number.parseInt(modelCoverage)).toBeGreaterThan(0.9);
    })
});
