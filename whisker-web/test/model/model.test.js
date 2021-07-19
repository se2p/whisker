const fileUrl = require('file-url');

const timeout = process.env.SLOWMO ? 500000 : 300000;
const ACCELERATION = 10;

async function loadProject (scratchPath, modelPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    await (await page.$('#fileselect-models')).uploadFile(modelPath);

    await (await page.$('#toggle-advanced')).click();
    await page.evaluate(factor => document.querySelector('#acceleration-factor').value = factor, ACCELERATION);
}

async function readModelErrors () {
    const coverageOutput = await page.$('#output-run .output-content');
    let coverageLog = '';

    let errorsInModel;
    let failsInModel;
    let modelCoverage;

    while (true) {
        const currentCoverageLog = await (await coverageOutput.getProperty('innerHTML')).jsonValue();
        coverageLog = currentCoverageLog;

        if (currentCoverageLog.includes('summary')) {
            var re = /errors_in_model: (\d)+/i;
            var matches_array = currentCoverageLog.match(re);
            errorsInModel = matches_array[1];

            re = /fails_in_model: (\d)+/i;
            matches_array = currentCoverageLog.match(re);
            failsInModel = matches_array[1];

            re = /modelCoverage:\n(.)*combined: (\d+\.\d+)/i;
            matches_array = currentCoverageLog.match(re);
            modelCoverage = matches_array[2];
            break;
        }

        await page.waitForTimeout(1000);
    }

    return {errorsInModel, failsInModel, modelCoverage};
}

beforeEach(async() => {
    await jestPuppeteer.resetBrowser();
    page = await browser.newPage();
    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});
});

// Tests for events during a step with a listener in check utility
describe('Model fruitcatcher tests', () => {
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

    test('move event listener', async () => {
        await loadProject('test/model/scratch-programs/MoveEvent.sb3',
            'test/model/model-jsons/MoveEvent.json');
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
});
