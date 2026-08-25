const {openWhiskerPage, setAcceleration, uploadFile} = require('../utils/whisker-gui');

// Unlike the other suites, model tests either upload a test file or fall back to a fixed model
// duration, so they compose the GUI helpers themselves instead of using the shared loadProject.
async function loadProject(scratchPath, modelPath, userModelOrTest) {
    await uploadFile('#fileselect-project', scratchPath);
    if (modelPath) {
        await uploadFile('#fileselect-models', modelPath);
    }
    if (userModelOrTest === null) {
        await page.evaluate(factor => {
            document.querySelector('#model-duration').value = factor;
        }, 35);
    } else {
        await uploadFile('#fileselect-tests', userModelOrTest);
    }
    await setAcceleration();
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
            const logArray = log.split('\n');

            // Delete all lines from the log up until the summary
            for (let i = 0; i < logArray.length; i++) {
                if (logArray[i].includes('summary')) {
                    break;
                }

                logArray[i] = '';
            }

            expect(log.includes('modelErrors')).toBe(true);
            const errors = logArray.find(x => x.includes('modelErrors')).split('(')[1].split(')')[0];
            const fails = logArray.find(x => x.includes('modelFails')).split('(')[1].split(')')[0];
            const coverageIndex = logArray.findIndex(x => x.includes('modelCoverage'));
            expect(coverageIndex).not.toBe(-1);
            const coverage = logArray[coverageIndex + 1].split(': ')[1].split(' ')[0];
            return {
                errorsInModel: parseInt(errors, 10),
                failsInModel: parseInt(fails, 10),
                modelCoverage: parseFloat(coverage),
                loggedOutput: logArray.filter(s => s !== '').join('\n')
            };
        } else if (log.includes('"ZodError"') || log.indexOf(errorWhenUploadingModelStart) !== -1) {
            throw new Error(`Could not parse the model. Message:\n${log}`);
        }
    }
}

beforeEach(async () => {
    await openWhiskerPage({catchPageErrors: false});
});

async function testProgram(errors, fails, coverage) {
    const seed = Date.now();
    await page.evaluate(s => {
        document.querySelector('#seed').value = s;
    }, seed);
    await (await page.$('#run-all-tests')).click();

    const {errorsInModel, failsInModel, modelCoverage, loggedOutput} = await readModelErrors();
    if (errorsInModel + failsInModel > errors + fails || modelCoverage < coverage) {
        console.log('Used seed:', seed);
        console.log(loggedOutput);
    }
    expect(errorsInModel).toBeLessThanOrEqual(errors);
    expect(failsInModel).toBeLessThanOrEqual(fails);
    expect(modelCoverage).toBeGreaterThanOrEqual(coverage);
}

// Tests for events during a step with a listener in check utility
describe('Model tests without inputs', () => {
    const timeout = 8000;

    const table = [
        ['color event listener', 'ColorEvent', 'ColorEvent'],
        ['Sprite touching event listener', 'SpriteTouchingEvent', 'SpriteTouchingEvent'],
        ['move event listener (comp)', 'MoveEvent', 'MoveEventComp'],
        ['move event listener (expr)', 'MoveEvent', 'MoveEventExpr'],
        ['move event listener (function)', 'MoveEvent', 'MoveEventFunction'],
        ['output event listener', 'OutputEvent', 'OutputEvent'],
        ['visual change event listener', 'BackgroundChange', 'BackgroundChange'],
        ['visual change event listener 2', 'VisualEvents', 'VisualEvents'],
        ['stop models', 'StopOtherScripts', 'StopOtherScripts']
    ];

    it.each(table)('%s', async (name, projectFileName, modelFileName) => {
        const programPath = `test/model/scratch-programs/${projectFileName}.sb3`;
        const modelPath = `test/model/model-jsons/${modelFileName}.json`;
        await loadProject(programPath, modelPath, null);
        await testProgram(0, 0, 1.0);
    }, timeout);

});

describe('Model tests with inputs', () => {
    const timeout = 35000;

    const table = [
        ['any key pressed test', 'AnyKeyPressed', 1.00, 'test/model/user-model-jsons/AnyKeyPressed-userModels.json'],
        ['fruitcatcher game test', 'Fruitcatcher', 0.85, 'test/model/user-model-jsons/Fruitcatcher-userModels.json'],
        ['fruitcatcher with dynamic inputs', 'Fruitcatcher', 0.69, 'test/integration/networkSuites/FruitCatchingMultiLabel.json'],
        ['fruitcatcher with static inputs', 'Fruitcatcher', 0.97, 'test/model/FruitCatching-manual_small.js']
    ];

    it.each(table)('%s', async (name, projectName, coverage, testOrModel) => {
        const programPath = `test/model/scratch-programs/${projectName}.sb3`;
        const modelPath = `test/model/model-jsons/${projectName}.json`;
        await loadProject(programPath, modelPath, testOrModel);
        await testProgram(0, 0, coverage);
    }, timeout);

});
