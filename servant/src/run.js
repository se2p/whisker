/* eslint-disable node/no-unpublished-require */

const fs = require("fs");
const rimraf = require("rimraf");

const logger = require("./logger");
const CoverageGenerator = require("../../whisker-main/src/coverage/coverage");

const testByBlockBasedTests = require('./run-bbt');
const {
    prepareTestFiles,
    getProjectsInScratchPath,
    printTestResultsFromCoverageGenerator,
    switchToProjectTab, tmpDir
} = require("./common");

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
} = require("./cli").opts;


async function testByWhiskerTestsuite(pool, targetProject) {
    const start = Date.now();

    const csvs = [];
    const paths = prepareTestFiles();
    await Promise.all(paths.map((path, index) => pool.run(({page}) => runTests(path, page, index, targetProject))))
        .then(results => {
            const summaries = results.map(({summary}) => summary);
            const coverages = results.map(({coverage}) => coverage);
            const modelCoverage = results.map(({modelCoverage}) => modelCoverage);
            csvs.push(...results.map(({csv}) => csv));

            if (summaries[0] !== undefined) {
                printTestResultsFromCoverageGenerator(summaries, CoverageGenerator.mergeCoverage(coverages),
                    modelCoverage[0]);
            }
            logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
        })
        .catch(errors => logger.error('Error on executing tests: ', errors))
        .finally(() => rimraf.sync(tmpDir));

    return csvs;
}

async function testByModel(pool, targetProject) {
    const start = Date.now();
    let resultCsv;

    await pool.run(({page}) => runTests(undefined, page, 0, targetProject))
        .then(result => {
            resultCsv = result.csv;

            printTestResultsFromCoverageGenerator([result.summary],
                CoverageGenerator.mergeCoverage([result.coverage]), result.modelCoverage);
            logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
        })
        .catch(errors => logger.error('Error on executing tests: ', errors))
        .finally(() => rimraf.sync(tmpDir));

    return resultCsv;
}

async function runTests(path, page, index, targetProject) {
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

        await page.close();

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
            for (const project of getProjectsInScratchPath()) {
                logger.info(`Testing project ${project} by Whisker test suite`);
                csvs.push(...await testByWhiskerTestsuite(pool, project));
            }
        }

    } else {
        // Model-based testing
        for (const project of getProjectsInScratchPath()) {
            logger.info(`Testing project ${project} by model`);
            csvs.push(await testByModel(pool, project));
        }
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
