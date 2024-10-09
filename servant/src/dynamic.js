const fs = require("fs");
const logger = require("./logger");
const opts = require('./cli').opts
const Whiskers = require("./whiskers");

const {
    scratchPath,
    csvFile,
    configPath,
    testPath,
} = opts;

// Dynamic Test suite using Neuroevolution
async function generateDynamicTests(pool) {
    await pool.run(async ({page}) => {
        const output = await runDynamicTestSuite(page, scratchPath.path);
        if (csvFile) {
            logger.info("Creating CSV summary in " + csvFile);
            fs.writeFileSync(csvFile, output);
        }
    });
}

async function configureWhiskerWebInstance(page) {
    await (await page.$('#fileselect-config')).uploadFile(configPath);
    await (await page.$('#fileselect-tests')).uploadFile(testPath);

    await page.evaluate((opts) => {
        document.querySelector('#container').mutators = opts.mutators;
        document.querySelector('#container').mutationBudget = opts.mutationBudget;
        document.querySelector('#container').maxMutants = opts.maxMutants;
        document.querySelector('#container').downloadMutants = opts.downloadMutants;
        document.querySelector('#container').activationTraceRepetitions = opts.activationTraces;
        document.querySelector('#container').minimiseSuite = opts.minimiseSuite;
    }, opts);

    logger.info('Web Instance Configuration Complete');
}

async function runDynamicTestSuite(page, path) {
    /**
     * Reads the coverage and log field until the summary is printed into the coverage field, indicating that the test
     * run is over.
     */
    async function readTestOutput() {
        const logOutput = await page.$('#output-log .output-content');
        // eslint-disable-next-line no-constant-condition
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
        await (await page.$('#run-all-tests')).click();
    }

    try {
        await (await page.$('#fileselect-project')).uploadFile(path);
        logger.debug("Dynamic TestSuite");
        await executeTests();
        const csvOutput = await readTestOutput();
        return Promise.resolve(csvOutput);
    } catch (e) {
        return Promise.reject(e);
    }
}

module.exports = () => Whiskers.withNewPool({
    initPageOnce: (page) => configureWhiskerWebInstance(page),
}, (pool) => generateDynamicTests(pool));
