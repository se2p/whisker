const fileUrl = require('file-url');
const path = require("path");
const fs = require("fs");

// FIXME: this global variable is actually defined in jest.config.js, but for some reason it is "undefined" here.
const URL = "dist/index.html";

const timeout = 25000;
const ACCELERATION = Infinity;

async function loadProject(scratchPath, modelPath, userModelOrTest) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath);
    await (await page.$('#fileselect-models')).uploadFile(modelPath);
    if (userModelOrTest === null) {
        await page.evaluate(factor => document.querySelector('#model-duration').value = factor, 35);
    } else {
        await (await page.$('#fileselect-tests')).uploadFile(userModelOrTest);
    }
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
describe('Model tests', () => {

    const table = [
        ['color event listener', 'ColorEvent', 'ColorEvent', 0, 0, 1.00, null],
        ['Sprite touching event listener', 'SpriteTouchingEvent', 'SpriteTouchingEvent', 0, 0, 1.00, null],
        ['move event listener (change)', 'MoveEvent', 'MoveEventChange', 0, 0, 1.00, null],
        ['move event listener (comp)', 'MoveEvent', 'MoveEventComp', 0, 0, 1.00, null],
        ['move event listener (expr)', 'MoveEvent', 'MoveEventExpr', 0, 0, 1.00, null],
        ['move event listener (function)', 'MoveEvent', 'MoveEventFunction', 0, 0, 1.00, null],
        ['output event listener', 'OutputEvent', 'OutputEvent', 0, 0, 1.00, null],
        ['variable change event listener', 'VariableEvent', 'VariableEvent', 0, 0, 1.00, null],
        ['visual change event listener', 'BackgroundChange', 'BackgroundChange', 0, 0, 1.00, null],
        ['visual change event listener 2', 'VisualEvents', 'VisualEvents', 0, 0, 1.00, null],
        ['any key pressed test', 'AnyKeyPressed', 'AnyKeyPressed', 0, 0, 1.00, 'test/model/user-model-jsons/AnyKeyPressed-userModel.json'],
        ['fruitcatcher game test', 'Fruitcatcher', 'Fruitcatcher', 0, 0, 0.95, 'test/model/user-model-jsons/Fruitcatcher-userModel.json'],
        ["fruitcatcher with dynamic inputs", "Fruitcatcher", "Fruitcatcher", 0, 0, 0.7, "test/integration/networkSuites/FruitCatchingMultiLabel.json"],
        // during a test with 40 runs, the coverage reached was \in {0.76, 0.8, 0.89, 0.93}, so 0.7 should not be flaky
        ["fruitcatcher with static inputs", "Fruitcatcher", "Fruitcatcher", 0, 0, 0.97, "test/model/FruitCatching-manual_small.js"],
        // the lowest coverage value for fruit catcher should be 79/83 = 0.9518..., so 0.95 should not be flaky
    ]

    it.each(table)('%s', async (name, projectFileName, modelFileName, errors, fails, coverage, testOrModel) => {
        const programPath = `test/model/scratch-programs/${projectFileName}.sb3`;
        const modelPath = `test/model/model-jsons/${modelFileName}.json`;
        await loadProject(programPath, modelPath, testOrModel);
        const seed = Date.now();
        await page.evaluate((seed) => document.querySelector('#seed').value = seed, seed);
        await (await page.$('#run-all-tests')).click();

        const {errorsInModel, failsInModel, modelCoverage, loggedOutput} = await readModelErrors();
        if (errorsInModel + failsInModel > errors + fails || modelCoverage < coverage) {
            console.log("Used seed:", seed);
            console.log(loggedOutput);
        }
        expect(errorsInModel).toBe(errors);
        expect(failsInModel).toBe(fails);
        expect(modelCoverage).toBeGreaterThanOrEqual(coverage);
    }, timeout);

});
