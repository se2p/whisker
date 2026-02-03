const fs = require("fs");
const logger = require("./logger");
const opts = require('./cli').opts
const Whiskers = require("./whiskers");

const {
    scratchPath,
    output,
    configPath,
    testPath,
    winningStates,
    keepaliveTimeout,
    modelPath,
    trace,
} = opts;

// Dynamic Test suite using Neuroevolution
async function generateDynamicTests(pool) {
    await pool.run(async (whisker) => {
        const results = await runDynamicTestSuite(whisker, scratchPath.path);
        if (output) {
            logger.info("Creating CSV summary in " + output);
            fs.writeFileSync(output, results);
        }
    });
}

async function configureWhiskerWebInstance(page) {
    await (await page.$('#fileselect-config')).uploadFile(configPath);
    await (await page.$('#fileselect-tests')).uploadFile(testPath);
    if (modelPath) {
        await (await page.$('#fileselect-models')).uploadFile(modelPath);
    }

    await page.evaluate((opts) => {
        document.querySelector('#container').mutators = opts.mutators;
        document.querySelector('#container').mutationBudget = opts.mutationBudget;
        document.querySelector('#container').maxMutants = opts.maxMutants;
        document.querySelector('#container').downloadMutants = opts.downloadMutants;
        document.querySelector('#container').activationTraceRepetitions = opts.activationTraces;
    }, opts);

    if (winningStates) {
        await page.evaluate(w => document.querySelector('#container').winningStates = w, fs.readFileSync(winningStates, 'utf8'));
    }

    logger.info('Web Instance Configuration Complete');
}

/**
 * Collects the sprite execution traces from the page and saves them to a JSON file.
 *
 * @param {object} whisker - The whisker test environment.
 * @param {string} tracePath - The path where the trace file will be saved.
 */
async function collectExecutionTrace(whisker, tracePath) {
    const executionTrace = await whisker.page.evaluate(
        () => document.querySelector('#container').spriteTraces
    );
    if (executionTrace && tracePath) {
        logger.info(`Saving execution trace to ${tracePath}`);
        fs.writeFileSync(tracePath, JSON.stringify(executionTrace, null, 2));
    }
}

async function runDynamicTestSuite(whisker, path) {
    /**
     * Reads the coverage and log field until the summary is printed into the coverage field, indicating that the test
     * run is over.
     */
    async function readTestResults() {
        const logOutput = await whisker.page.$('#output-log .output-content');
        while (true) {
            const currentLog = await (await logOutput.getProperty('innerHTML')).jsonValue();
            if (currentLog.includes('projectName,testName')) {
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        // Get CSV-Output
        const outputLog = await (await logOutput.getProperty('innerHTML')).jsonValue();
        const coverageLogLines = outputLog.split('\n');
        const csvHeaderIndex = coverageLogLines.findIndex(logLine => logLine.startsWith('projectName'));
        const endIndex = coverageLogLines.indexOf("");    // We may have additional output after 3 newlines

        return coverageLogLines.slice(csvHeaderIndex, endIndex).join("\n")
    }

    /**
     * Executes the tests, by clicking the button.
     */
    async function executeTests() {
        await (await whisker.page.$('#run-all-tests')).click();
    }

    try {
        await whisker.uploadProject(path);
        logger.debug("Dynamic TestSuite");
        await executeTests();
        const results = await readTestResults();
        await collectExecutionTrace(whisker, trace);
        return Promise.resolve(results);
    } catch (e) {
        return Promise.reject(e);
    }
}

module.exports = () => Whiskers.withNewPool((pool) => generateDynamicTests(pool), {
    initWhiskerOnce: ({page}) => configureWhiskerWebInstance(page),
    keepaliveTimeout: keepaliveTimeout ? keepaliveTimeout : 5000,
    crashOn: ["pageerror", "error"], // FIXME: Issue #392
});
