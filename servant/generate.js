const {logger} = require("./util");
const fs = require("fs");
const rimraf = require("rimraf");
const {tmpDir, showHiddenFunctionality} = require("./common");
const {
    whiskerUrl,
    csvFile,
    testDownloadDir,
    scratchPath,
    configPath,
    acceleration,
    seed,
} = require("./cli").opts;

// Test generation
async function generateTests(page) {
    const start = Date.now();

    // Todo use correct config
    runGeneticSearch(page)
        .then((csv) => {
            page.close();
            logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
            // Save results in CSV-file if specified
            if (csvFile) {
                console.info(`Creating CSV summary in ${testDownloadDir}`);
                fs.writeFileSync(require('path').resolve(testDownloadDir, 'output.csv'), csv);
            }
        })
        .catch(errors => logger.error('Error on generating tests: ', errors))
        .finally(() => rimraf.sync(tmpDir));
}

async function runGeneticSearch(options, page) {
    async function configureWhiskerWebInstance() {
        await page.goto(whiskerUrl, {waitUntil: 'networkidle0'});
        await (await page.$('#fileselect-project')).uploadFile(scratchPath);
        await (await page.$('#fileselect-config')).uploadFile(configPath);
        // if (testPath) {
        //     await (await page.$('#fileselect-tests')).uploadFile(testPath);
        // }
        await showHiddenFunctionality(page);
        await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, acceleration);
        await page.evaluate(s => document.querySelector('#seed').value = s, seed);
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
        await (await page.$('#run-search')).click();
    }

    async function downloadTests() {
        await page._client.send('Page.setDownloadBehavior', {
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
        return Promise.resolve(output);
    } catch (e) {
        return Promise.reject(e);
    }
}

module.exports = generateTests;
