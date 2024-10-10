const logger = require("./logger");
const fs = require("fs");
const {
    csvFile,
    testDownloadDir,
    testPath,
    scratchPath,
    configPath,
    groundTruth,
} = require("./cli").opts;
const Whiskers = require("./whiskers");

// Test generation
async function generateTests({page}) {
    const start = Date.now();

    // Todo use correct config
    try {
        const csv = await runGeneticSearch(page);
        logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
        // Save results in CSV-file if specified
        if (csvFile) {
            logger.info(`Creating CSV summary in ${csvFile}`);
            fs.writeFileSync(csvFile, csv);
        }
    } catch (e) {
        logger.error('Error on generating tests: ', e)
    }
}

async function configureWhiskerWebInstance(page) {
    await (await page.$('#fileselect-project')).uploadFile(scratchPath.path);
    await (await page.$('#fileselect-config')).uploadFile(configPath);
    if (testPath) {
        await (await page.$('#fileselect-tests')).uploadFile(testPath);
    }
    if (groundTruth) {
        await page.evaluate(g => document.querySelector('#container').groundTruth = g, fs.readFileSync(groundTruth, 'utf8'));
    }
    logger.info('Web Instance Configuration Complete');
}

async function runGeneticSearch(page) {
    async function readTestOutput() {
        const logOutput = await page.$('#output-log .output-content');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const currentLog = await (await logOutput.getProperty('innerHTML')).jsonValue();
            if (currentLog.includes('uncovered')) {
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        // Get CSV-Output
        const outputLog = await (await logOutput.getProperty('innerHTML')).jsonValue();
        const coverageLogLines = outputLog.split('\n');
        const csvHeaderIndex = coverageLogLines.findIndex(logLine => logLine.startsWith('projectName'));
        const csvHeader = coverageLogLines[csvHeaderIndex];
        const csvBody = coverageLogLines[csvHeaderIndex + 1]
        return `${csvHeader}\n${csvBody}`;
    }

    async function executeSearch() {
        const startSearchButton = await page.$('#run-search');
        await startSearchButton.evaluate(t => t.click());
    }

    async function downloadTests() {
        await page._client().send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: testDownloadDir,
        });
        await (await page.$('.editor-save')).click();
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    try {
        logger.debug("Executing search");
        await executeSearch();
        const output = await readTestOutput();
        logger.debug(`Downloading tests to ${testDownloadDir}`);
        await downloadTests();
        return Promise.resolve(output);
    } catch (e) {
        return Promise.reject(e);
    }
}

module.exports = () => Whiskers.withNewPool((pool) => pool.run(generateTests), {
    initPageOnce: (page) => configureWhiskerWebInstance(page),
});
