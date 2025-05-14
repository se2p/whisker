const fileUrl = require('file-url');
const path = require("path");
const fs = require("fs");

// FIXME: this global variable is actually defined in jest.config.js, but for some reason it is "undefined" here.
const URL = "dist/index.html";

const timeout = 20000;
const ACCELERATION = Infinity;

async function loadProject(scratchPath, modelPath) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    await (await page.$('#fileselect-models')).uploadFile(modelPath);
    const projectTab = await page.$('#tabProject');
    await projectTab.evaluate(t => t.click());
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, ACCELERATION);
}

async function readModelErrors() {
    const errorWhenUploadingModelStart = `MODEL: [
      {
        "code": "invalid_type",
        "expected": "number",
        "received": "string",
        "path": [`;


    const coverageOutput = await page.$('#output-run .output-content');
    while (true) {
        const log = await (await coverageOutput.getProperty('innerHTML')).jsonValue();
        if (log.includes('summary')) {
            const logArray = log.split("\n");

            // Delete all lines from the log up until the summary
            for (let i = 0; i < logArray.length; i++) {
                if (logArray[i].includes("summary")) {
                    break;
                }

                logArray[i] = "";
            }

            const errors = logArray.find(x => x.includes("modelErrors")).split("(")[1].split(")")[0];
            const fails = logArray.find(x => x.includes("modelFails")).split("(")[1].split(")")[0];
            const coverageIndex = logArray.findIndex(x => x.includes("modelCoverage"));
            const coverage = logArray[coverageIndex + 1].split(": ")[1].split(" ")[0];
            return {
                errorsInModel: parseInt(errors),
                failsInModel: parseInt(fails),
                modelCoverage: parseFloat(coverage),
                loggedOutput: logArray.filter(s => s !== "").join("\n")
            };
        } else if (log.includes('"ZodError"') || log.indexOf(errorWhenUploadingModelStart) !== -1) {
            throw new Error(`Could not parse the model. Message:\n${log}`);
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

    const table = [
        ['color event listener', 'ColorEvent', 'ColorEvent', 0, 0, 1.00],
        ['Sprite touching event listener', 'SpriteTouchingEvent', 'SpriteTouchingEvent', 0, 0, 1.00],
        ['move event listener (change)', 'MoveEvent', 'MoveEventChange', 0, 0, 1.00],
        ['move event listener (comp)', 'MoveEvent', 'MoveEventComp', 0, 0, 1.00],
        ['move event listener (expr)', 'MoveEvent', 'MoveEventExpr', 0, 0, 1.00],
        ['move event listener (function)', 'MoveEvent', 'MoveEventFunction', 0, 0, 1.00],
        ['output event listener', 'OutputEvent', 'OutputEvent', 0, 0, 1.00],
        ['variable change event listener', 'VariableEvent', 'VariableEvent', 0, 0, 1.00],
        ['visual change event listener', 'BackgroundChange', 'BackgroundChange', 0, 0, 1.00],
        ['visual change event listener 2', 'VisualEvents', 'VisualEvents', 0, 0, 1.00],
        ['any key pressed test', 'AnyKeyPressed', 'AnyKeyPressed', 0, 0, 1.00],
        ['fruitcatcher game test', 'fruitcatcher', 'fruitcatcher', 0, 0, 1.00]
    ]

    it.each(table)('%s', async (name, projectFileName, modelFileName, errors, fails, coverage) => {
        await loadProject(`test/model/scratch-programs/${projectFileName}.sb3`,
            `test/model/model-jsons/${modelFileName}.json`);
        await page.evaluate(factor => document.querySelector('#model-duration').value = factor, 35);
        await page.evaluate(factor => document.querySelector('#model-repetitions').value = factor, 1);
        await (await page.$('#run-all-tests')).click();
        const {errorsInModel, failsInModel, modelCoverage, loggedOutput} = await readModelErrors();
        if (errorsInModel + failsInModel > errors + fails) {
            console.log(loggedOutput);
        }
        expect(errorsInModel).toBe(errors);
        expect(failsInModel).toBe(fails);
        expect(modelCoverage).toBeGreaterThanOrEqual(coverage);
    }, timeout);
});
