const fs = require("fs");
const path = require("path");
const logger = require("./logger");
const {showHiddenFunctionality} = require("./common");
const {
    scratchPath,
    csvFile,
    configPath,
    testPath,
    acceleration,
} = require('./cli').opts

// Dynamic Test suite using Neuroevolution
async function generateDynamicTests(openNewPage) {
    if (scratchPath.isDirectory) {
        const csvs = [];
        for (const file of fs.readdirSync(scratchPath.path)) {
            if (!file.endsWith(".sb3")) {
                logger.info("Not a Scratch project: %s", file);
                continue;
            }

            logger.info("Testing project %s", file);

            const csvOutput = await runDynamicTestSuite(openNewPage, path.resolve(scratchPath.path, file));
            const csvArray = csvOutput.split('\n');
            if (csvs.length === 0) {
                csvs.push(csvArray[0]);
            }
            csvs.push(csvArray[1]);
        }
        const output = csvs.join('\n');
        if (csvFile) {
            console.info("Creating CSV summary in " + csvFile);
            fs.writeFileSync(csvFile, output);
        }
    } else {
        const output = await runDynamicTestSuite(openNewPage, scratchPath.path);
        if (csvFile) {
            console.info("Creating CSV summary in " + csvFile);
            fs.writeFileSync(csvFile, output);
        }
    }
}

async function runDynamicTestSuite(openNewPage, path) {
    const page = await openNewPage();

    async function configureWhiskerWebInstance() {
        await (await page.$('#fileselect-project')).uploadFile(path);
        await (await page.$('#fileselect-config')).uploadFile(configPath);
        await (await page.$('#fileselect-tests')).uploadFile(testPath);
        await showHiddenFunctionality(page);
        await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, acceleration);
        console.log('Whisker-Web: Web Instance Configuration Complete');
    }

    /**
     * Reads the coverage and log field until the summary is printed into the coverage field, indicating that the test
     * run is over.
     */
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
        await (await page.$('#run-search')).click();
    }

    try {
        await configureWhiskerWebInstance();
        logger.debug("Dynamic TestSuite");
        await executeSearch();
        const csvOutput = await readTestOutput();
        await page.close();
        return Promise.resolve(csvOutput);
    } catch (e) {
        return Promise.reject(e);
    }
}

module.exports = generateDynamicTests;
