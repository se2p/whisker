/* eslint-disable node/no-unpublished-require */

const fs = require("fs");

const logger = require("./logger");
const CoverageGenerator = require("../../whisker-main/src/coverage/coverage");

const testByBlockBasedTests = require('./run-bbt');
const {
    getProjectsInScratchPath,
    printTestResultsFromCoverageGenerator,
    switchToProjectTab
} = require("./common");
const {attachRandomInputsToTest, attachErrorWitnessReplayToTest} = require("./witness-util");

const {
    testPath,
    seed,
    acceleration,
    csvFile,
    modelPath,
    modelRepetition,
    modelDuration,
    modelCaseSensitive,
    mutators,
    downloadMutants,
    mutationBudget,
    maxMutants,
    traceBlocks,
    useSaveStates,
    addRandomInputs,
    errorWitnessPath,
} = require("./cli").opts;

function prepareTestFiles(tmpDir) {
    // Seems to be only used by witness.js

    let whiskerTestPath = testPath;

    if (addRandomInputs) {
        whiskerTestPath = attachRandomInputsToTest(whiskerTestPath, tmpDir, addRandomInputs);
    }

    if (errorWitnessPath) {
        whiskerTestPath = attachErrorWitnessReplayToTest(errorWitnessPath, tmpDir, whiskerTestPath);
    }

    return whiskerTestPath;
}

async function testByWhiskerTestsuite(pool) {
    const promises = getProjectsInScratchPath().map((project) => pool.run(async ({page, id, tmpDir}) => {
        logger.info(`Testing project ${project} by Whisker test suite`);
        const start = Date.now();
        const whiskerTestPath = prepareTestFiles(tmpDir);
        const result = await runTests(whiskerTestPath, page, project);
        logger.debug(`Duration #${id}: ${(Date.now() - start) / 1000} Seconds`);
        return result;
    }));
    const results = await Promise.all(promises);

    const summaries = results.map(({summary}) => summary);
    const coverages = results.map(({coverage}) => coverage);
    const modelCoverage = results.map(({modelCoverage}) => modelCoverage);

    if (summaries[0] !== undefined) {
        printTestResultsFromCoverageGenerator(summaries, CoverageGenerator.mergeCoverage(coverages),
            modelCoverage[0]);
    }

    return results.map(({csv}) => csv);
}

async function testByModel(pool) {
    const promises = getProjectsInScratchPath().map((project) => pool.run(async ({page, id}) => {
        logger.info(`Testing project ${project} by model`);
        const start = Date.now();
        const result = await runTests(undefined, page, project);
        logger.debug(`Duration #${id}: ${(Date.now() - start) / 1000} Seconds`);
        return result;
    }));
    const results = await Promise.all(promises);

    const summaries = results.map(({summary}) => summary);
    const coverages = results.map(({coverage}) => coverage);
    const modelCoverage = results.map(({modelCoverage}) => modelCoverage);

    if (summaries[0] !== undefined) {
        printTestResultsFromCoverageGenerator(summaries, CoverageGenerator.mergeCoverage(coverages),
            modelCoverage[0]);
    }

    return results.map(({csv}) => csv);
}

async function runTests(path, page, targetProject) {
    /**
     * Configure the Whisker instance, by setting the application file, test file and acceleration, after the page
     * was loaded.
     */
    async function configureWhiskerWebInstance() {
        await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, acceleration);
        await page.evaluate(s => document.querySelector('#seed').value = s, seed);
        await page.evaluate(useSaveStates => document.querySelector("#use-save-states").checked = useSaveStates, useSaveStates);
        await page.evaluate(m => document.querySelector('#container').mutators = m, mutators);
        await page.evaluate(b => document.querySelector('#container').mutationBudget = b, mutationBudget);
        await page.evaluate(m => document.querySelector('#container').maxMutants = m, maxMutants);
        await page.evaluate(d => document.querySelector('#container').downloadMutants = d, downloadMutants);
        await page.evaluate(tb => document.querySelector('#container').traceBlocks = tb, traceBlocks);

        await (await page.$('#fileselect-project')).uploadFile(targetProject);
        if (path) {
            await (await page.$('#fileselect-tests')).uploadFile(path);
        }
        if (modelPath) {
            await (await page.$('#fileselect-models')).uploadFile(modelPath);
            await page.evaluate(factor => document.querySelector('#model-repetitions').value = factor, modelRepetition);
            await page.evaluate(factor => document.querySelector('#model-duration').value = factor, modelDuration);
            if (modelCaseSensitive === "true") {
                await (await page.$('#model-case-sensitive')).click();
            }
        }
        await switchToProjectTab(page, false);
    }

    /**
     * Observes the log output, waiting for the csv summary to be written to the log, which indicates the end of the
     * entire test run.
     * @returns {Promise<string>}
     */
    async function readTestOutput() {
        const logOutput = await page.$('#output-log .output-content');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const currentLog = await (await logOutput.getProperty('innerHTML')).jsonValue();
            if (currentLog.includes('projectName')) {
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        // Get CSV-Output
        const outputLog = await (await logOutput.getProperty('innerHTML')).jsonValue();
        const coverageLogLines = outputLog.split('\n');
        const csvHeaderIndex = coverageLogLines.findIndex(logLine => logLine.startsWith('projectName'));
        const endIndex = coverageLogLines.indexOf("", csvHeaderIndex);
        return coverageLogLines.slice(csvHeaderIndex, endIndex).join("\n")
    }

    /**
     * Generates a coverage object based on the coveredBlockIdsPerSprite and blockIdsPerSprite from the
     * CoverageGenerator used in serializeAndReturnCoverageObject.
     *
     * @param {*} serializedCoverage  The coverage object, using array and objects instead of maps and sets, as it was
     *                                serialized by puppeteer
     * @returns {coverage}            The coverage object
     */
    function convertSerializedCoverageToCoverage(serializedCoverage) {
        const coveredBlockIdsPerSprite = new Map();
        serializedCoverage.coveredBlockIdsPerSprite
            .forEach(({key, values}) => coveredBlockIdsPerSprite.set(key, new Set(values)));
        const blockIdsPerSprite = new Map();
        serializedCoverage.blockIdsPerSprite.forEach(({key, values}) => blockIdsPerSprite.set(key, new Set(values)));
        return {coveredBlockIdsPerSprite, blockIdsPerSprite};
    }

    /**
     * Generates a model coverage object based on the coveragePerModel and missedEdges.
     *
     * @param {*} serializedCoverage  The model coverage object using array and objects instead of maps and sets, as it was
     *                                serialized by puppeter
     */
    function convertSerializedModelCoverage(serializedCoverage) {
        const modelCoverage = {};
        serializedCoverage.modelCoverage.forEach(({key, values}) => {
            const coverageObject = {};
            values.forEach(({key, values}) => {
                coverageObject[key] = values;
            });
            modelCoverage[key] = coverageObject;
        });
        return modelCoverage;
    }

    /**
     * Uses the CoverageGenerator, which is attached to the window object in the whisker-web/index.js to get the coverage
     * of the test run and transfer it from the Whisker instance in the browser to this script.
     * The original Maps and Sets have to be reworked to be a collection of objects and arrays, otherwise the coverage raw
     * data cannot be transferred from the Chrome instance to the nodejs instance.
     */
    async function onFinishedCallback() {
        return page.evaluate(() => new Promise(resolve => {
            document.defaultView.messageServantCallback = message => resolve(message);
        }));
    }

    try {
        await configureWhiskerWebInstance();
        const promise = onFinishedCallback();
        await (await page.$('#run-all-tests')).click();

        const csvRow = await readTestOutput();
        const {serializableCoverageObject, summary, serializableModelCoverage} = await promise;

        return Promise.resolve({
            summary, coverage: convertSerializedCoverageToCoverage(serializableCoverageObject),
            csv: csvRow, modelCoverage: convertSerializedModelCoverage(serializableModelCoverage)
        });
    } catch (e) {
        logger.error(e);
        return Promise.reject(e);
    }
}

// Entry point for the "run" command.
// Supports Whisker TestSuites, Model-based testing and Block-Based Testing.
async function run(pool) {
    const csvs = [];

    if (testPath) {

        if (testPath.endsWith(".sb3")) {
            // Block-Based Testing
            await testByBlockBasedTests(pool);

        } else {
            // Whisker TestSuite
            csvs.push(...(await testByWhiskerTestsuite(pool)));
        }

    } else {
        // Model-based testing
        csvs.push(...(await testByModel(pool)));
    }

    if (csvFile) {
        logger.info(`Creating CSV summary in ${csvFile}`);

        // There can only be multiple headers if there is more than one csv result.
        if (csvs.length > 1) {
            fs.writeFileSync(csvFile, removeDuplicateHeaders(csvs).join('\n'));
        } else {
            fs.writeFileSync(csvFile, csvs.toString());
        }
    }
}

function removeDuplicateHeaders([first, ...rest]) {
    const [firstHeader, firstData] = first.split('\n');
    const columnCount = firstData.split(',').length;
    const restData = rest.map((headerAndData) => {
        // If test execution gets interrupted, e.g. due to an out-of-memory issue, we may face undefined csv data value.
        if (headerAndData === undefined) {
            // Fill with undefined values to mark interrupted test execution in data.
            return Array(columnCount).fill('undefined');
        } else {
            // eslint-disable-next-line no-unused-vars
            const [_header, data] = headerAndData.split('\n');
            return data;
        }
    });
    return [firstHeader, firstData, ...restData];
}

module.exports = run;
