const fs = require("fs");
const logger = require("./logger");
const {switchToProjectTab} = require("./common");
const {
    scratchPath,
    csvFile,
    configPath,
    testPath,
    acceleration,
    seed,
    mutators,
    mutationBudget,
    maxMutants,
    mutantsDownloadPath,
    activationTraces
} = require('./cli').opts

// Dynamic Test suite using Neuroevolution
async function generateDynamicTests(openNewPage) {
    const output = await runDynamicTestSuite(openNewPage, scratchPath.path);
    if (csvFile) {
        console.info("Creating CSV summary in " + csvFile);
        fs.writeFileSync(csvFile, output);
    }

}

async function runDynamicTestSuite(openNewPage, path) {
    const page = await openNewPage();

    async function configureWhiskerWebInstance() {
        await (await page.$('#fileselect-project')).uploadFile(path);
        await (await page.$('#fileselect-config')).uploadFile(configPath);
        await (await page.$('#fileselect-tests')).uploadFile(testPath);
        await switchToProjectTab(page, false);
        await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, acceleration);
        await page.evaluate(s => document.querySelector('#seed').value = s, seed);
        await page.evaluate(m => document.querySelector('#container').mutators = m, mutators);
        await page.evaluate(b => document.querySelector('#container').mutationBudget = b, mutationBudget);
        await page.evaluate(m => document.querySelector('#container').maxMutants = m, maxMutants);
        await page.evaluate(at => document.querySelector('#container').activationTraceRepetitions = at, activationTraces);
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
            if (currentLog.includes('projectName,testName')) {

                // Download mutants
                if (mutantsDownloadPath) {
                    await downloadMutants(mutantsDownloadPath);
                }

                break;
            }
            await page.waitForTimeout(1000);
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

    /**
     * Downloads the generated Scratch mutants.
     * @param downloadPath the path the mutants should be saved to.
     */
    async function downloadMutants(downloadPath) {
        await page._client().send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath
        });
        await (await page.$('.output-save')).click();
        await page.waitForTimeout(5000);
    }

    try {
        await configureWhiskerWebInstance();
        logger.debug("Dynamic TestSuite");
        await executeTests();
        const csvOutput = await readTestOutput();
        await page.close();
        return Promise.resolve(csvOutput);
    } catch (e) {
        return Promise.reject(e);
    }
}

module.exports = generateDynamicTests;
