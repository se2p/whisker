/* eslint-disable no-undef */
/* eslint-disable no-return-assign */
/* eslint-disable func-style */
/* eslint-disable no-use-before-define */

const fs = require('fs');
const {basename} = require('path');
const puppeteer = require('puppeteer');
const {logger, cli} = require('./util');
const rimraf = require("rimraf");
const TAP13Formatter = require('../whisker-main/src/test-runner/tap13-formatter');
const CoverageGenerator = require('../whisker-main/src/coverage/coverage');
const CSVConverter = require('./converter.js');
const {attachRandomInputsToTest, attachErrorWitnessReplayToTest} = require('./witness-util.js');
const path = require('path');

const production = process.env.NODE_ENV === "production";
const tmpDir = './.tmpWorkingDir';
const start = Date.now();
const {
    whiskerURL, scratchPath, testPath, modelPath, modelRepetition, modelDuration, modelCaseSensitive, errorWitnessPath,
    addRandomInputs, accelerationFactor, csvFile, configPath, isHeadless, numberOfTabs, isConsoleForwarded,
    isLiveOutputCoverage, isLiveLogEnabled, generateTests, isGenerateWitnessTestOnly, seed
} = cli.start();

if (isGenerateWitnessTestOnly) {
    prepareTestFiles(testPath);
} else {
    init();
}

/**
 * The entry point of the runners functionality, handling the test file preparation and the browser instance.
 */
async function init () {

    // args: ['--use-gl=desktop'] could be used next to headless, but pages tend to quit unexpectedly
    const args = [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox'
    ];
    const browser = await puppeteer.launch({
        headless: !!isHeadless,

        // If specified, use the given version of Chromium instead of the one bundled with Puppeteer.
        // This feature is currently used with Docker to build smaller images.
        // Note: Puppeteer is only guaranteed to work with the bundled Chromium, use at own risk.
        // https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#puppeteerlaunchoptions
        // https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#environment-variables
        // https://github.com/puppeteer/puppeteer/issues/1793#issuecomment-358216238
        executablePath: process.env.CHROME_BIN || null,

        args: args,

        devtools: !production
    });

    // Test generation
    if (generateTests) {
        // Todo use correct config
        const downloadPath = typeof generateTests === 'string' ? generateTests : __dirname;
        runGeneticSearch(browser, downloadPath)
            .then((csv) => {
                browser.close();
                logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
                // Save results in CSV-file if specified
                if(csvFile){
                    console.info(`Creating CSV summary in ${csvFile}`);
                    fs.writeFileSync(csvFile, csv);
                }
            })
            .catch(errors => logger.error('Error on generating tests: ', errors))
            .finally(() => rimraf.sync(tmpDir));
    }
    // Dynamic Test suite using Neuroevolution
    else if(testPath.endsWith('.json')){
        if (fs.lstatSync(scratchPath).isDirectory()) {
            const csvs = [];
            for (const file of fs.readdirSync(scratchPath)) {
                if (!file.endsWith("sb3")) {
                    logger.info("Not a Scratch project: "+file);
                    continue;
                }
                logger.info("Testing project "+file);
                const csvOutput = await runDynamicTestSuite(browser, scratchPath + '/' + file);
                const csvArray = csvOutput.split('\n');
                if(csvs.length === 0){
                    csvs.push(csvArray[0]);
                }
                csvs.push(csvArray[1]);
            }
            const output = csvs.join('\n');
            if (csvFile !== false) {
                console.info("Creating CSV summary in "+csvFile);
                fs.writeFileSync(csvFile, output);
            }
        } else {
            const output = await runDynamicTestSuite(browser, scratchPath);
            if (csvFile !== false) {
                console.info("Creating CSV summary in "+csvFile);
                fs.writeFileSync(csvFile, output);
            }
        }
        await browser.close();
    }
    // Standard TestSuite / Model-based testing
    else {
        if (csvFile != false && fs.existsSync(csvFile)) {
            console.error(`CSV file already exists, aborting`);
            await browser.close();
            return;
        }
        const csvs = [];

        if (fs.lstatSync(scratchPath).isDirectory()) {
            for (const file of fs.readdirSync(scratchPath)) {
                if (!file.endsWith("sb3")) {
                    logger.info(`Not a Scratch project: ${file}`);
                    continue;
                }
                logger.info(`Testing project ${file}`);
                csvs.push(...(await runTestsOnFile(browser, scratchPath + '/' + file, modelPath)));
            }


        } else {
            csvs.push(...await runTestsOnFile(browser, scratchPath, modelPath));
        }

        if (csvFile != false) {
            console.info(`Creating CSV summary in ${csvFile}`);
            fs.writeFileSync(csvFile, CSVConverter.rowsToCsv(csvs));
        }
        await browser.close();
    }
}

async function runTestsOnFile (browser, targetProject, modelPath) {
    const csvs = [];
    if (testPath) {
        const paths = prepareTestFiles(testPath);
        await Promise.all(paths.map((path, index) => runTests(path, browser, index, targetProject, modelPath)))
            .then(results => {
                // browser.close();
                const summaries = results.map(({summary}) => summary);
                const coverages = results.map(({coverage}) => coverage);
                const modelCoverage = results.map(({modelCoverage}) => modelCoverage);
                csvs.push(...results.map(({csv}) => csv));

                printTestResultsFromCoverageGenerator(summaries, CoverageGenerator.mergeCoverage(coverages),
                    modelCoverage[0]);
                logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
            })
            .catch(errors => logger.error('Error on executing tests: ', errors))
            .finally(() => rimraf.sync(tmpDir));

    } else {
        // model path given, test only by model
        await runTests(undefined, browser, 0, targetProject, modelPath)
            .then(result => {
                csvs.push(result.csv);

                printTestResultsFromCoverageGenerator([result.summary],
                    CoverageGenerator.mergeCoverage([result.coverage]), result.modelCoverage);
                logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
            })
            .catch(errors => logger.error('Error on executing tests: ', errors))
            .finally(() => rimraf.sync(tmpDir));
    }
    return csvs;
}

async function runGeneticSearch (browser, downloadPath) {
    const page = await browser.newPage({context: Date.now()});
    page.on('error', error => {
        logger.error(error);
        process.exit(1);
    }).on('pageerror', async (error) => {
        await browser.close();
        return Promise.reject(error);
    });

    function optionallyEnableConsoleForward () {
        if (isConsoleForwarded) {
            // https://github.com/puppeteer/puppeteer/issues/1512#issuecomment-349784408
            page.on('console', msg => {
                // https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#class-consolemessage
                if (msg.type() === "warning") {
                    logger.warn(`Forwarded: ${msg.text()}`);
                } else {
                    logger.info(`Forwarded: ${msg.text()}`);
                }
            }).on('pageerror', error => logger.error(`Forwarded: ${error.message}`));
        }
    }

    async function configureWhiskerWebInstance () {
        await page.goto(whiskerURL, {waitUntil: 'networkidle0'});
        await (await page.$('#fileselect-project')).uploadFile(scratchPath);
        await (await page.$('#fileselect-config')).uploadFile(configPath);
        if(testPath) {
            await (await page.$('#fileselect-tests')).uploadFile(testPath);
        }
        await showHiddenFunctionality(page);
        await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, accelerationFactor);
        await page.evaluate(s => document.querySelector('#seed').value = s, seed);
        console.log('Whisker-Web: Web Instance Configuration Complete');
    }

    async function readTestOutput () {
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

    async function executeSearch () {
        await (await page.$('#run-search')).click();
    }

    async function downloadTests () {
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath
        });
        await (await page.$('.editor-save')).click();
        await page.waitForTimeout(5000);
    }

    try {
        optionallyEnableConsoleForward();
        await configureWhiskerWebInstance();

        if (!production) {
            await page.evaluate(() => { debugger; });
        }

        logger.debug("Executing search");
        await executeSearch();
        const output = await readTestOutput();
        logger.debug(`Downloading tests to ${downloadPath}`);
        await downloadTests();
        await page.close();
        return Promise.resolve(output);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function runDynamicTestSuite (browser, scratchPath) {
    const page = await browser.newPage({context: Date.now()});
    page.on('error', error => {
        logger.error(error);
        process.exit(1);
    });

    function optionallyEnableConsoleForward () {
        if (isConsoleForwarded) {
            page.on('console', msg => {
                if (msg._args.length) {
                    logger.info(`Forwarded: `, msg._args.map(arg => arg._remoteObject.value)
                        .join(' '));
                }
            });
        }
    }

    /**
     * Configure the Whisker instance, by setting the application file, test file and accelerationFactor, after the page
     * was loaded.
     */
    async function configureWhiskerWebInstance () {
        await page.goto(whiskerURL, {waitUntil: 'networkidle0'});
        await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, accelerationFactor);
        await page.evaluate(s => document.querySelector('#seed').value = s, seed);
        await (await page.$('#fileselect-project')).uploadFile(scratchPath);
        if (testPath) {
            await (await page.$('#fileselect-tests')).uploadFile(testPath);
        }
        await showHiddenFunctionality(page);
    }

    /**
     * Reads the coverage and log field until the summary is printed into the coverage field, indicating that the test
     * run is over.
     */
    async function readTestOutput () {
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

    /**
     * Executes the tests, by clicking the button.
     */
    async function executeTests () {
        await (await page.$('#run-all-tests')).click();
    }

    try {
        optionallyEnableConsoleForward();
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

/**
 * Shows the test generation and input recording features, the TAP13 and the log output.
 * @param {Page} page
 * @returns {Promise<void>}
 */
async function showHiddenFunctionality(page) {
    // a simple 'await (await page.$('#toggle-log')).click();' does not work here due to the toggle buttons
    const toggleAdvanced = await page.$('#toggle-advanced');
    await toggleAdvanced.evaluate(t => t.click());
    const toggleTap = await page.$('#toggle-tap');
    await toggleTap.evaluate(t => t.click());
    const toggleLog = await page.$('#toggle-log');
    await toggleLog.evaluate(t => t.click());
    const toggleModelEditor = await page.$('#toggle-model-editor');
    await toggleModelEditor.evaluate(t => t.click());
}

async function runTests (path, browser, index, targetProject, modelPath) {
    const page = await browser.newPage({context: Date.now()});
    const startProject = Date.now();
    page.on('error', error => {
        logger.error(error);
        process.exit(1);
    });

    /**
     * Enables that console logs in the chrome instance are forwarded to the bash instance this script is started with.
     */
    function optionallyEnableConsoleForward () {
        if (isConsoleForwarded) {
            page.on('console', msg => {
                if (msg._args.length) {
                    logger.info(`Page ${index} | Forwarded: `, msg._args.map(arg => arg._remoteObject.value).join(' '));
                }
            });
        }
    }

    /**
     * Configure the Whisker instance, by setting the application file, test file and accelerationFactor, after the page
     * was loaded.
     */
    async function configureWhiskerWebInstance () {
        await page.goto(whiskerURL, {waitUntil: 'networkidle0'});
        await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, accelerationFactor);
        await page.evaluate(s => document.querySelector('#seed').value = s, seed);
        await (await page.$('#fileselect-project')).uploadFile(targetProject);
        if (testPath) {
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
        await showHiddenFunctionality(page);
    }

    /**
     * Executes the tests, by clicking the button.
     */
    async function executeTests () {
        await (await page.$('#run-all-tests')).click();
    }

    /**
     * Reads the coverage and log field until the summary is printed into the coverage field, indicating that the test
     * run is over.
     */
    async function readTestOutput () {
        const coverageOutput = await page.$('#output-run .output-content');
        const logOutput = await page.$('#output-log .output-content');

        let coverageLog = '';
        let log = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (isLiveLogEnabled) {
                const currentLog = await (await logOutput.getProperty('innerHTML')).jsonValue();
                const newInfoFromLog = currentLog.replace(log, '')
                    .trim();

                if (newInfoFromLog.length) {
                    logger.log(newInfoFromLog);
                }

                log = currentLog;
            }

            const currentCoverageLog = await (await coverageOutput.getProperty('innerHTML')).jsonValue();
            const newInfoFromCoverage = currentCoverageLog.replace(coverageLog, '')
                .trim();
            if (newInfoFromCoverage.length && isLiveOutputCoverage) {
                logger.log(`Page ${index} | Coverage: `, newInfoFromCoverage);
            } else if (newInfoFromCoverage.includes('not ok ')) {
                logger.warn(`Page ${index} | Coverage: `, newInfoFromCoverage);
            }
            coverageLog = currentCoverageLog;

            if (currentCoverageLog.includes('summary')) {
                break;
            }

            await page.waitForTimeout(1000);
        }

        let csvRow = await CSVConverter.tapToCsvRow(coverageLog);
        csvRow['duration'] = `${(Date.now() - startProject) / 1000}`;
        return {csvRow, coverageLog};
    }

    /**
     * Generates a coverage object based on the coveredBlockIdsPerSprite and blockIdsPerSprite from the
     * CoverageGenerator used in serializeAndReturnCoverageObject.
     *
     * @param {*} serializedCoverage  The coverage object, using array and objects instead of maps and sets, as it was
     *                                serialized by puppeter
     * @returns {coverage}            The coverage object
     */
    function convertSerializedCoverageToCoverage (serializedCoverage) {
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
    function convertSerializedModelCoverage (serializedCoverage) {
        const modelCoverage = {};
        serializedCoverage.modelCoverage.forEach(({key,values}) => {
            const coverageObject = {};
            values.forEach(({key, values}) => {
                coverageObject[key] = values;
            })
            modelCoverage[key] =  coverageObject;
        });
        return modelCoverage;
    }

    /**
     * Uses the CoverageGenerator, which is attached to the window object in the whisker-web/index.js to get the coverage
     * of the test run and transfer it from the Whisker instance in the browser to this script.
     * The original Maps and Sets have to be reworked to be a collection of objects and arrays, otherwise the coverage raw
     * data cannot be transferred from the Chrome instance to the nodejs instance.
     */
    async function onFinishedCallback () {
        return page.evaluate(() => new Promise(resolve => {
            document.defaultView.messageServantCallback = message => resolve(message);
        }));
    }

    try {
        optionallyEnableConsoleForward();
        await configureWhiskerWebInstance();
        const promise = onFinishedCallback();
        await executeTests();

        const {csvRow, coverageLog} = await readTestOutput();
        const {serializableCoverageObject, summary, serializableModelCoverage} = await promise;
        await page.close();

        return Promise.resolve({summary, coverage: convertSerializedCoverageToCoverage(serializableCoverageObject),
            csv: csvRow, modelCoverage: convertSerializedModelCoverage(serializableModelCoverage)});
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * Perpares the test source code, by evaling the tests and returning the source code of the tests without the
 * `modules.export` statement at the end.
 *
 * @param {*} path        The path to the file where the original tests are defined in
 * @returns {object}      The evaluated tests and source code of the tests without the `modules.export` statement
 */
function prepareTestSource (path) {
    const exportStatement = 'module.exports =';
    const test = fs.readFileSync(path, {encoding: 'utf8'});
    const testArrayStartIndex = test.indexOf(exportStatement) + exportStatement.length;
    const testSourceWithoutExportArray = test.substr(0, testArrayStartIndex);
    // eslint-disable-next-line no-eval
    const evaledTest = eval(test);

    return {evaledTest, testSourceWithoutExportArray};
}

/**
 * Takes the evaled test declarations and returns them as parseable javascript code.
 *
 * @param {*} tests     The evaled code of the test declerations
 * @returns {Array}     The test declerations as parseable ajavscript
 */
function splitTestsSourceCodeIntoSingleTestSources (tests) {
    return tests.reverse()
        .map(test => {
            const testDescription = JSON.parse(JSON.stringify(test));
            testDescription.test = test.test.name;

            return JSON.stringify(testDescription, null, 2)
                .replace('"name"', 'name')
                .replace('"description"', 'description')
                .replace('"categories"', 'categories')
                .replace('"test"', 'test')
                .replace(`"${test.test.name}"`, `${test.test.name}`);
        });
}

/**
 * Distributes the tests over the tabs / pages of the chrome instance.
 *
 * @param {number} tabs          The number of tabs puppeteer will open
 * @param {*} singleTestSources  A parseable test decleration
 * @returns {Array}              An array with the length of the amount of tabs that will be started, containing a
 *                               collection of test declerations for each of the tabs
 */
function distributeTestSourcesOverTabs (tabs, singleTestSources) {
    let index = 0;
    const testSourcesPerTab = [];

    while (singleTestSources.length) {
        testSourcesPerTab[index] = testSourcesPerTab[index] ?
            testSourcesPerTab[index].concat(', ')
                .concat(singleTestSources.pop()) :
            singleTestSources.pop();

        index++;

        if (index > tabs - 1) {
            index = 0;
        }
    }

    return testSourcesPerTab;
}

/**
 * Wrapper for the test file preparation, creating the temporary working directory and reading, distributing and writing
 * the files.
 *
 * @param {*} whiskerTestPath  Path to the whisker test file
 * @returns {Array}            The paths of the temporary test files
 */
function prepareTestFiles (whiskerTestPath) {
    if (addRandomInputs) {
        const customTimeGiven = typeof addRandomInputs === 'string';
        const defaultTime = 10; // in seconds
        const waitTime = customTimeGiven
            ? addRandomInputs // Instead of a boolean value, this is actually a string that encodes the time to wait.
            : defaultTime;
        whiskerTestPath = attachRandomInputsToTest(whiskerTestPath, tmpDir, waitTime);
    }

    if (errorWitnessPath) {
        whiskerTestPath = attachErrorWitnessReplayToTest(errorWitnessPath, whiskerTestPath, tmpDir);
    }

    const {evaledTest, testSourceWithoutExportArray} = prepareTestSource(whiskerTestPath);
    const singleTestSources = splitTestsSourceCodeIntoSingleTestSources(evaledTest);
    const testSourcesPerTab = distributeTestSourcesOverTabs(numberOfTabs, singleTestSources);

    if (fs.existsSync(tmpDir)) {
        fs.rmdirSync(tmpDir, {recursive: true});
    }
    fs.mkdirSync(tmpDir);

    return testSourcesPerTab.map((testSources, index) => {
        const path = `${tmpDir}/${basename(whiskerTestPath)}_${index + 1}.js`;
        fs.writeFileSync(path, `${testSourceWithoutExportArray} [${testSources}]`, {encoding: 'utf8'});
        return path;
    });
}

/**
 * Logs the coverage and results (number of fails, pass or skip) to the console in a more readable way.
 *
 * @param {string} summaries The summaries from the whisker-web instance test run
 * @param {string} coverage  Combined coverage of from all pages
 * @param {Map} modelCoverage  Coverage of the models.
 */
function printTestResultsFromCoverageGenerator (summaries, coverage ,modelCoverage) {
    const formattedSummary = TAP13Formatter.mergeFormattedSummaries(summaries.map(TAP13Formatter.formatSummary));
    const formattedCoverage = TAP13Formatter.formatCoverage(coverage.getCoveragePerSprite());

    const summaryString = TAP13Formatter.extraToYAML({summary: formattedSummary});
    const coverageString = TAP13Formatter.extraToYAML({coverage: formattedCoverage});

    const formattedModelCoverage = TAP13Formatter.formatModelCoverage(modelCoverage);
    const modelCoverageString = TAP13Formatter.extraToYAML({modelCoverage: formattedModelCoverage});

    logger.info(`\nSummary:\n ${summaryString}`);
    logger.info(`\nCoverage:\n ${coverageString}`);
    logger.info(`\nModel coverage:\n ${modelCoverageString}`);

}
