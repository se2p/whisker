const logger = require("./logger");
const fs = require("fs");
const rimraf = require("rimraf");
const {tmpDir, switchToProjectTab} = require("./common");
const {
    csvFile,
    testDownloadDir,
    testPath,
    scratchPath,
    configPath,
    acceleration,
    seed,
    groundTruth,
} = require("./cli").opts;

// Test generation
async function generateTests(openNewPage) {
    const start = Date.now();

    // Todo use correct config
    try {
        const csv = await runGeneticSearch(openNewPage);
        logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
        // Save results in CSV-file if specified
        if (csvFile) {
            console.info(`Creating CSV summary in ${testDownloadDir}`);
            fs.writeFileSync(csvFile, csv);
        }
    } catch (e) {
        logger.error('Error on generating tests: ', e)
    } finally {
        rimraf.sync(tmpDir);
    }
}

async function runGeneticSearch(openNewPage) {
    const page = await openNewPage();

    async function configureWhiskerWebInstance() {
        await (await page.$('#fileselect-project')).uploadFile(scratchPath.path);
        await (await page.$('#fileselect-config')).uploadFile(configPath);
        if (testPath) {
            await (await page.$('#fileselect-tests')).uploadFile(testPath);
        }
        await switchToProjectTab(page, true);
        await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, acceleration);
        await page.evaluate(s => document.querySelector('#seed').value = s, seed);
        if (groundTruth) {
            await page.evaluate(g => document.querySelector('#container').groundTruth = g, fs.readFileSync(groundTruth, 'utf8'));
        }
        console.log('Whisker-Web: Web Instance Configuration Complete');
    }

    async function readTestOutput() {
        const logOutput = await page.$('#output-log .output-content');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const currentLog = await (await logOutput.getProperty('innerHTML')).jsonValue();
            if (currentLog.includes('uncovered')) {
                break;
            }
            await page.waitForTimeout(1000);
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
        await page.waitForTimeout(5000);
    }

    try {
        await configureWhiskerWebInstance();
        logger.debug("Executing search");
        await executeSearch();
        const output = await readTestOutput();
        logger.debug(`Downloading tests to ${testDownloadDir}`);
        await downloadTests();
        await page.close();
        return Promise.resolve(output);
    } catch (e) {
        return Promise.reject(e);
    }
}

module.exports = generateTests;
