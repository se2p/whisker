/* eslint-disable node/no-unpublished-require */

const fs = require("fs");
const logger = require("./logger");
const CoverageGenerator = require("../../whisker-main/src/coverage/coverage");
const testByBlockBasedTests = require('./run-bbt');
const {
    getProjectsInScratchPath,
    printTestResultsFromCoverageGenerator,
} = require("./common");
const Whiskers = require("./whiskers");

const opts = require("./cli").opts;
const {
    testPath,
    output,
    numberOfJobs,
    keepaliveTimeout
} = opts;

async function testByWhiskerTestsuite(pool) {
    return Promise.all(getProjectsInScratchPath().map((project) =>
        pool.run(async (whisker) => {
            logger.info(`Testing project ${project} by Whisker test suite`);
            const start = Date.now();
            const result = await runTests(whisker, project);
            logger.debug(`Duration #${whisker.id}: ${(Date.now() - start) / 1000} Seconds`);
            return result;
        })));
}

async function testByModel(pool) {
    return Promise.all(getProjectsInScratchPath().map((project) =>
        pool.run(async (whisker) => {
            logger.info(`Testing project ${project} by model`);
            const start = Date.now();
            const result = await runTests(whisker, project);
            logger.debug(`Duration #${whisker.id}: ${(Date.now() - start) / 1000} Seconds`);
            return result;
        })));
}

async function configureWhiskerWebInstance(page) {
    if (testPath && testPath.endsWith(".sb3")) {
        // No initialization code for block-based testing.
        return;
    }

    await page.evaluate((opts) => {
        document.querySelector('#container').mutators = opts.mutators;
        document.querySelector('#container').mutationBudget = opts.mutationBudget;
        document.querySelector('#container').maxMutants = opts.maxMutants;
        document.querySelector('#container').downloadMutants = opts.downloadMutants;
        document.querySelector('#container').traceAttributes = opts.traceAttributes;
    }, opts);

    if (testPath) {
        await (await page.$('#fileselect-tests')).uploadFile(testPath);
    }

    if (opts.modelPath) {
        await (await page.$('#fileselect-models')).uploadFile(opts.modelPath);
        await page.evaluate((opts) => {
            document.querySelector('#model-repetitions').value = opts.modelRepetition;
            document.querySelector('#model-duration').value = opts.modelDuration;
        }, opts);
    }
}

async function runTests(whisker, targetProject) {
    await whisker.uploadProject(targetProject);
    const page = whisker.page;

    /**
     * Observes the log output, waiting for the csv summary to be written to the log, which indicates the end of the
     * entire test run.
     * @returns {Promise<string>}
     */
    async function readTestResults() {
        const logOutput = await page.$('#output-log .output-content');
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
        const promise = onFinishedCallback();
        await (await page.$('#run-all-tests')).click();

        const csvRow = await readTestResults();
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

function processResults(results) {
    const summaries = results.map(({summary}) => summary);
    const coverages = results.map(({coverage}) => coverage);
    const modelCoverage = results.map(({modelCoverage}) => modelCoverage);

    if (summaries[0] !== undefined) {
        printTestResultsFromCoverageGenerator(summaries, CoverageGenerator.mergeCoverage(coverages),
            modelCoverage[0]);
    }
    return results.map(({csv}) => csv);
}

// Entry point for the "run" command.
// Supports Whisker TestSuites, Model-based testing and Block-Based Testing.
async function run(pool) {
    let csvs = [];

    if (testPath) {

        if (testPath.endsWith(".sb3")) {
            // Block-Based Testing
            await testByBlockBasedTests(pool);

        } else {
            // Whisker TestSuite
            const results = await testByWhiskerTestsuite(pool);
            csvs = processResults(results);
        }

    } else {
        // Model-based testing
        const results = await testByModel(pool);
        csvs = processResults(results);
    }

    if (output) {
        logger.info(`Creating CSV summary in ${output}`);

        // There can only be multiple headers if there is more than one csv result.
        if (csvs.length > 1) {
            fs.writeFileSync(output, removeDuplicateHeaders(csvs).join('\n'));
        } else {
            fs.writeFileSync(output, csvs.toString());
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

module.exports = () => Whiskers.withNewPool((pool) => run(pool), {
    // Avoid opening more browser windows than necessary.
    whiskers: Math.min(getProjectsInScratchPath().length, numberOfJobs),
    initWhiskerOnce: ({page}) => configureWhiskerWebInstance(page),
    keepaliveTimeout: keepaliveTimeout ? keepaliveTimeout : 5000,
    crashOn: ["pageerror", "error"], // FIXME: Issue #392
});
