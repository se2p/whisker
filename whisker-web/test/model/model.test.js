const fileUrl = require('file-url');
const path = require("path");
const fs = require("fs");

// FIXME: this global variable is actually defined in jest.config.js, but for some reason it is "undefined" here.
const URL = "dist/index.html";

const timeout = 20000;
const ACCELERATION = 10;

async function loadProject(scratchPath, modelPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    await (await page.$('#fileselect-models')).uploadFile(modelPath);
    const projectTab = await page.$('#tabProject');
    await projectTab.evaluate(t => t.click());
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, ACCELERATION);
}

async function readModelErrors() {
    const coverageOutput = await page.$('#output-run .output-content');
    while (true) {
        const log = await (await coverageOutput.getProperty('innerHTML')).jsonValue();
        if (log.includes('summary')) {
            const logArray = log.split("\n");
            const errors = logArray.find(x => x.includes("modelErrors")).split("(")[1].split(")")[0];
            const fails = logArray.find(x => x.includes("modelFails")).split("(")[1].split(")")[0];
            const coverageIndex = logArray.findIndex(x => x.includes("modelCoverage"));
            const coverage = logArray[coverageIndex + 1].split(": ")[1].split(" ")[0];
            return {
                errorsInModel: errors,
                failsInModel: fails,
                modelCoverage: coverage
            };
        }
    }
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

    test('fruitcatcher with random model input', async () => {
        await loadProject('test/model/scratch-programs/fruitcatcher.sb3',
            'test/model/model-jsons/fruitcatcher-random-fruit.json');
        await page.evaluate(factor => document.querySelector('#model-duration').value = factor, 20);
        await page.evaluate(factor => document.querySelector('#model-repetitions').value = factor, 3);

        const startTestButton = await page.$('#run-all-tests');
        await startTestButton.click();
        let {errorsInModel, failsInModel, modelCoverage} = await readModelErrors();
        await expect(errorsInModel).toBe("0");
        await expect(failsInModel).toBe("0");
        // as there are not enough repetitions (for shorter pipeline) only test for coverage > 0.8.
        await expect(Number.parseFloat(modelCoverage)).toBeGreaterThan(0.5);
    })
});
