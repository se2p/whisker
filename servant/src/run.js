/* eslint-disable node/no-unpublished-require */

const fs = require("fs");
const logger = require("./logger");
const CoverageGenerator = require("../../whisker-main/src/coverage/coverage");
const testByBlockBasedTests = require('./run-bbt');
const {
    getProjectsInScratchPath,
    printTestResultsFromCoverageGenerator,
    runTests,
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

function processResults(results) {
    const validResults = results.filter((result) => result !== undefined);
    const summaries = validResults.map(({summary}) => summary);
    const coverages = validResults.map(({coverage}) => coverage);
    const modelCoverage = validResults.map(({modelCoverage}) => modelCoverage);

    if (summaries[0] !== undefined) {
        printTestResultsFromCoverageGenerator(summaries, CoverageGenerator.mergeCoverage(coverages),
            modelCoverage[0]);
    }
    return results.map((result) => result === undefined ? undefined : result.csv);
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
    keepaliveTimeout: keepaliveTimeout ?? 5000,
    crashOn: ["pageerror", "error"], // FIXME: Issue #392
});
