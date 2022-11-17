/* eslint-disable node/no-unpublished-require */

const rimraf = require("rimraf");
const {attachRandomInputsToTest, attachErrorWitnessReplayToTest} = require("./witness-util");
const fs = require("fs");
const {basename, resolve} = require("path");
const TAP13Formatter = require('../whisker-main/src/test-runner/tap13-formatter');
const CoverageGenerator = require('../whisker-main/src/coverage/coverage');
const logger = require('./logger');

const {
    testPath,
    seed,
    acceleration,
    modelPath,
    modelRepetition,
    modelDuration,
    modelCaseSensitive,
    liveLog,
    liveOutputCoverage,
    addRandomInputs,
    mutators,
    mutantsDownloadPath,
    errorWitnessPath,
    numberOfJobs,
    scratchPath,
    mutationBudget,
    maxMutants,
} = require("./cli").opts;
const {subcommand} = require("./cli");

const tmpDir = './.tmpWorkingDir';

async function runTestsOnFile(openNewPage, targetProject) {
    const start = Date.now();

    const csvs = [];

    if (testPath) {
        const paths = prepareTestFiles();
        await Promise.all(paths.map((path, index) => runTests(path, openNewPage, index, targetProject)))
            .then(results => {
                const summaries = results.map(({summary}) => summary);
                const coverages = results.map(({coverage}) => coverage);
                const modelCoverage = results.map(({modelCoverage}) => modelCoverage);
                csvs.push(...results.map(({csv}) => csv));

                if (summaries[0] !== undefined) {
                    printTestResultsFromCoverageGenerator(summaries, CoverageGenerator.mergeCoverage(coverages),
                        modelCoverage[0]);
                }
                logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
            })
            .catch(errors => logger.error('Error on executing tests: ', errors))
            .finally(() => rimraf.sync(tmpDir));

    } else {
        // model path given, test only by model
        await runTests(undefined, openNewPage, 0, targetProject)
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

/**
 * Switches to the project tab, which is necessary to start the test execution.
 * @param {Page} page
 * @returns {Promise<void>}
 */
async function switchToProjectTab(page) {
    const projectTab = await page.$('#tabProject');
    await projectTab.evaluate(t => t.click());
}

async function runTests(path, openNewPage, index, targetProject) {
    const page = await openNewPage();

    /**
     * Configure the Whisker instance, by setting the application file, test file and acceleration, after the page
     * was loaded.
     */
    async function configureWhiskerWebInstance() {
        await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, acceleration);
        await page.evaluate(s => document.querySelector('#seed').value = s, seed);
        await page.evaluate(m => document.querySelector('#container').mutators = m, mutators);
        await page.evaluate(b => document.querySelector('#container').mutationBudget = b, mutationBudget);
        await page.evaluate(m => document.querySelector('#container').maxMutants = m, maxMutants);
        await (await page.$('#fileselect-project')).uploadFile(targetProject);
        if (path) {
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
        await switchToProjectTab(page);
    }

    /**
     * Executes the tests, by clicking the button.
     */
    async function executeTests() {
        await (await page.$('#run-all-tests')).click();
    }

    /**
     * Reads the coverage and log field until the summary is printed into the coverage field, indicating that the test
     * run is over.
     */
    async function readTestOutput() {
        const coverageOutput = await page.$('#output-run .output-content');
        const logOutput = await page.$('#output-log .output-content');

        let coverageLog = '';
        let log = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const currentLog = await (await logOutput.getProperty('innerHTML')).jsonValue();
            if (currentLog.includes('projectName')) {

                // Download mutants
                if (mutantsDownloadPath) {
                    await downloadMutants(mutantsDownloadPath);
                }

                // Return CSV file
                const currentLogString = currentLog.toString();
                const startIndex = currentLogString.indexOf('projectName');
                const endIndex = currentLogString.indexOf("\n\n\n");    // We may have additional output after 3 newlines
                if (endIndex > 0) {
                    return currentLogString.slice(startIndex, endIndex).trim();
                } else {
                    return currentLogString.slice(startIndex);
                }
            }

            if (liveLog) {
                const currentLog = await (await logOutput.getProperty('innerHTML')).jsonValue();
                const newInfoFromLog = currentLog.replace(log, '').trim();

                if (newInfoFromLog.length) {
                    logger.log(newInfoFromLog);
                }

                log = currentLog;
            }

            const currentCoverageLog = await (await coverageOutput.getProperty('innerHTML')).jsonValue();
            const newInfoFromCoverage = currentCoverageLog.replace(coverageLog, '').trim();
            if (newInfoFromCoverage.length && liveOutputCoverage) {
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
        await configureWhiskerWebInstance();
        const promise = onFinishedCallback();
        await executeTests();

        const csvRow = await readTestOutput();
        const {serializableCoverageObject, summary, serializableModelCoverage} = await promise;

        await page.close();

        return Promise.resolve({
            summary, coverage: convertSerializedCoverageToCoverage(serializableCoverageObject),
            csv: csvRow, modelCoverage: convertSerializedModelCoverage(serializableModelCoverage)
        });
    } catch (e) {
        logger.error(e);
        return Promise.reject(e);
    }
}

/**
 * Wrapper for the test file preparation, creating the temporary working directory and reading, distributing and writing
 * the files.
 *
 * @param {*} whiskerTestPath  Path to the whisker test file
 * @returns {Array}            The paths of the temporary test files
 */
function prepareTestFiles(whiskerTestPath = testPath) {
    if (addRandomInputs) {
        whiskerTestPath = attachRandomInputsToTest(whiskerTestPath, tmpDir, addRandomInputs);
    }

    if (errorWitnessPath) {
        whiskerTestPath = attachErrorWitnessReplayToTest(errorWitnessPath, whiskerTestPath, tmpDir);
    }

    const {evaledTest, testSourceWithoutExportArray} = prepareTestSource(whiskerTestPath);
    const singleTestSources = splitTestsSourceCodeIntoSingleTestSources(evaledTest);
    const numberOfTabs = subcommand === "model" ? 1 : numberOfJobs;
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
 * Takes the evaled test declarations and returns them as parseable javascript code.
 *
 * @param {*} tests     The evaled code of the test declarations
 * @returns {Array<string>}     The test declarations as parseable javascript
 */
function splitTestsSourceCodeIntoSingleTestSources(tests) {
    return tests.map((test) => {
        /*
            This will remove the "test" property from the object, since its value is a function, resulting in:

            {
              "name": "...",
              "description": "...",
              "categories": [...]
            }
         */
        const testDescription = JSON.parse(JSON.stringify(test));

        // Stringify the object again, but with newlines between the properties. Split the string at each newline.
        // This gives an array where each entry is exactly one line. Drop the first and last line ("{" and "}").
        const space = 2;
        const jsonLines = JSON.stringify(testDescription, null, space).split('\n').slice(1, -1);

        // Add the "test" property again, with the name of the test NOT wrapped in quotes.
        const indent = " ".repeat(space);
        return ['{', `${indent}"test": ${test.test.name},`, ...jsonLines, '}'].join('\n');
    });
}

/**
 * Distributes the tests over the tabs / pages of the chrome instance.
 *
 * @param {number} tabs          The number of tabs puppeteer will open
 * @param {*} singleTestSources  A parseable test declaration
 * @returns {Array}              An array with the length of the amount of tabs that will be started, containing a
 *                               collection of test declarations for each of the tabs
 */
function distributeTestSourcesOverTabs(tabs, singleTestSources) {
    let index = 0;
    const testSourcesPerTab = [];

    while (singleTestSources.length) {
        testSourcesPerTab[index] = testSourcesPerTab[index] ?
            testSourcesPerTab[index].concat(', ')
                .concat(singleTestSources.shift()) :
            singleTestSources.shift();

        index++;

        if (index > tabs - 1) {
            index = 0;
        }
    }

    return testSourcesPerTab;
}

/**
 * Logs the coverage and results (number of fails, pass or skip) to the console in a more readable way.
 *
 * @param {string} summaries The summaries from the whisker-web instance test run
 * @param {string} coverage  Combined coverage of from all pages
 * @param {Map} modelCoverage  Coverage of the models.
 */
function printTestResultsFromCoverageGenerator(summaries, coverage, modelCoverage) {
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

/**
 * Prepares the test source code, by evaluating the tests and returning the source code of the tests without the
 * `modules.export` statement at the end.
 *
 * @param {*} path        The path to the file where the original tests are defined in
 * @returns {object}      The evaluated tests and source code of the tests without the `modules.export` statement
 */
function prepareTestSource(path) {
    const exportStatement = 'module.exports =';
    const test = fs.readFileSync(path, {encoding: 'utf8'});
    const testArrayStartIndex = test.indexOf(exportStatement) + exportStatement.length;
    const testSourceWithoutExportArray = test.substring(0, testArrayStartIndex);
    const evaledTest = require(path);

    // eslint-disable-next-line no-eval
    // const evaledTest = eval(`
    //     (function () {
    //         ${test};
    //         return module.exports;
    //     })();
    // `);

    return {evaledTest, testSourceWithoutExportArray};
}

function getProjectsInScratchPath() {
    const {path, isDirectory} = scratchPath;

    if (!isDirectory) {
        return [path];
    }

    return fs.readdirSync(path)
        .filter((file) => file.endsWith(".sb3"))
        .map((file) => resolve(path, file));
}


module.exports = {
    runTestsOnFile,
    tmpDir,
    prepareTestFiles,
    getProjectsInScratchPath,
};
