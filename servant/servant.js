/* eslint-disable no-undef */
/* eslint-disable no-return-assign */
/* eslint-disable require-jsdoc */
/* eslint-disable func-style */
/* eslint-disable no-use-before-define */

const fs = require('fs');
const {basename} = require('path');
const puppeteer = require('puppeteer');
const {logger, cli} = require('./util');

const tmpDir = './.tmpWorkingDir';
const start = Date.now();
const {
    whiskerURL, testPath, scratchPath, frequency, configPath, isHeadless, numberOfTabs, isConsoleForwarded,
    isLifeOutputCoverage, isLifeLogEnabled, isGeneticSearch, errorWitnessPath, addRandomInputs
} = cli.start();

init();

/**
 * The entry point of the runners functionallity, handling the test file preperation and the browser instance.
 */
async function init () {

    // args: ['--use-gl=desktop'] could be used next to headless, but pages tend to quit unexpectedly
    const browser = await puppeteer.launch(
        {
            headless: !!isHeadless,
            args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
        });

    if (isGeneticSearch) {
        // Todo use correct config
        runGeneticSearch(browser)
            .then(() => {
                browser.close();
                logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
            })
            .catch(errors => logger.error('Error on generating tests: ', errors))
            .finally(() => fs.rmdirSync(tmpDir, {recursive: true}));
    } else {
        let testFilePath = testPath;

        if (addRandomInputs) {
            testFilePath = attachRandomInputsToTest(testFilePath);
        }

        if (errorWitnessPath) {
            testFilePath = attachErrorWitnessReplayToTest(errorWitnessPath, testFilePath);
        }

        const paths = prepateTestFiles(testFilePath);
        Promise.all(paths.map((path, index) => runSearch(path, browser, index)))
            .then(() => {
                browser.close();
                logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
            })
            .catch(errors => logger.error('Error on executing tests: ', errors))
            .finally(() => fs.rmdirSync(tmpDir, {recursive: true}));
    }
}

async function runGeneticSearch (browser) {
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

    async function configureWhiskerWebInstance () {
        await page.goto(whiskerURL, {waitUntil: 'networkidle0'});
        await (await page.$('#fileselect-project')).uploadFile(scratchPath);
        await (await page.$('#fileselect-config')).uploadFile(configPath);
        await (await page.$('#toggle-output')).click();
        console.log('Whisker-Web: Web Instance Configuration Complete');
    }

    async function readTestOutput () {
        const coverageOutput = await page.$('#output-run .output-content');
        const logOutput = await page.$('#output-log .output-content');

        let coverageLog = '';
        let log = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (isLifeLogEnabled) {
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
            if (newInfoFromCoverage.length && isLifeOutputCoverage) {
                logger.log(`Coverage: `, newInfoFromCoverage);
            } else if (newInfoFromCoverage.includes('not ok ')) {
                logger.warn(`Coverage: `, newInfoFromCoverage);
            }
            coverageLog = currentCoverageLog;

            if (currentCoverageLog.includes('summary')) {
                break;
            }

            await page.waitFor(1000);
        }

        return coverageLog;
    }

    async function executeSearch () {
        await (await page.$('#run-search')).click();
    }

    try {
        optionallyEnableConsoleForward();
        await configureWhiskerWebInstance();
        await executeSearch();
        const output = await readTestOutput();
        await page.close();
        return Promise.resolve(output);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function runSearch (path, browser, index) {
    const page = await browser.newPage({context: Date.now()});
    page.on('error', error => {
        logger.error(error);
        process.exit(1);
    });

    function optionallyEnableConsoleForward () {
        if (isConsoleForwarded) {
            page.on('console', msg => {
                if (msg._args.length) {
                    logger.info(`Page ${index} | Forwarded: `, msg._args.map(arg => arg._remoteObject.value)
                        .join(' '));
                }
            });
        }
    }

    async function configureWhiskerWebInstance () {
        await page.goto(whiskerURL, {waitUntil: 'networkidle0'});
        await page.evaluate(frequ => document.querySelector('#scratch-vm-frequency').value = frequ, frequency);
        await (await page.$('#fileselect-project')).uploadFile(scratchPath);
        await (await page.$('#fileselect-tests')).uploadFile(path);
        await (await page.$('#toggle-output')).click();
    }

    async function executeTests () {
        await (await page.$('#run-all-tests')).click();
    }

    async function readTestOutput () {
        const coverageOutput = await page.$('#output-run .output-content');
        const logOutput = await page.$('#output-log .output-content');

        let coverageLog = '';
        let log = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (isLifeLogEnabled) {
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
            if (newInfoFromCoverage.length && isLifeOutputCoverage) {
                logger.log(`Page ${index} | Coverage: `, newInfoFromCoverage);
            } else if (newInfoFromCoverage.includes('not ok ')) {
                logger.warn(`Page ${index} | Coverage: `, newInfoFromCoverage);
            }
            coverageLog = currentCoverageLog;

            if (currentCoverageLog.includes('summary')) {
                break;
            }

            await page.waitFor(1000);
        }

        return coverageLog;
    }

    try {
        optionallyEnableConsoleForward();
        await configureWhiskerWebInstance();
        await executeTests();
        const output = await readTestOutput();
        await page.close();
        return Promise.resolve(output);
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
    const testSourceWithouExportArray = test.substr(0, testArrayStartIndex);
    // eslint-disable-next-line no-eval
    const evaledTest = eval(test);

    return {evaledTest, testSourceWithouExportArray};
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

function keyCodeToKeyString(keyCode) {
    switch (keyCode) {
        case 13: return 'Enter';
        case 32: return ' ';
        case 37: return 'ArrowLeft';
        case 38: return 'ArrowUp';
        case 39: return 'ArrowRight';
        case 40: return 'ArrowDown';
        default: throw new Error(`Unknown keycode '${keyCode}'`);
    }
}

function attachErrorWitnessReplayToTest(errorWitnessPath, constraintsPath) {
    const errorWitness = JSON.parse(fs.readFileSync(errorWitnessPath, {encoding: 'utf8'}).toString());
    let errorReplay = "// Error witness replay\n"

    for (const step of errorWitness.steps) {
        const action = step.action || step.epsilonType;

        switch (action) {
            case 'REACHED_VIOLATION': break;
            case 'INITIAL_STATE': break;
            case 'WAIT': errorReplay += `    await t.runForTime(${step.waitMicros / 1000});\n`; break;
            case 'MOUSE_MOVE': errorReplay += `    t.inputImmediate({device: 'mouse', x: ${step.mousePosition.x}, y: ${step.mousePosition.y}});\n`; break;
            case 'ANSWER': errorReplay += `    t.inputImmediate({device: 'text', answer: '${step.answer}'});\n`; break;
            case 'KEY_PRESSED': errorReplay += `    t.inputImmediate({device: 'keyboard', key: '${keyCodeToKeyString(step.keyPressed)}', duration: 1});\n`; break;
            case 'MOUSE_DOWN': errorReplay += `    t.inputImmediate({device: 'mouse', down: true});\n`; break;
            case 'MOUSE_UP': errorReplay += `    t.inputImmediate({device: 'mouse', down: false});\n`; break;
            default: logger.error(`Unknown error witness step action '${action}' for step ${step.id}`);
        }
    }

    errorReplay += "    // Run a few steps more in order to catch the violation\n    await t.runForSteps(10);\n    // Error witness replay finished\n"

    return replaceInFile(constraintsPath, "// REPLAY_ERROR_WITNESS", errorReplay, "_error_witness_replay.js");
}

function attachRandomInputsToTest(constraintsPath) {
    const randomInputs = "    t.setRandomInputInterval(150);\n" +
        "    t.detectRandomInputs({duration: [50, 100]});\n" +
        "    await t.runForTime(300000);";

    return replaceInFile(constraintsPath, "// RANDOM_INPUTS", randomInputs, "_random_inputs.js");
}

function replaceInFile(filePath, searchValue, replacement, outputFileSuffix) {
    const fileWithReplacement = fs.readFileSync(filePath, {encoding: 'utf8'})
        .toString().replace(searchValue, replacement);

    if (fs.existsSync(tmpDir)) {
        fs.rmdirSync(tmpDir, {recursive: true});
    }
    fs.mkdirSync(tmpDir);

    const path = `${basename(filePath)}${outputFileSuffix}`;
    fs.writeFileSync(path, fileWithReplacement, {encoding: 'utf8'});
    return path;
}

/**
 * Wrapper for the test file preperation, creating the temporary workig directory and reading, distributing and writing
 * the files.
 *
 * @param {*} whiskerTestPath  Path to the whisker test file
 * @returns {Array}            The paths of the temporary test files
 */
function prepateTestFiles (whiskerTestPath) {
    const {evaledTest, testSourceWithouExportArray} = prepareTestSource(whiskerTestPath);
    const singleTestSources = splitTestsSourceCodeIntoSingleTestSources(evaledTest);
    const testSourcesPerTab = distributeTestSourcesOverTabs(numberOfTabs, singleTestSources);

    if (fs.existsSync(tmpDir)) {
        fs.rmdirSync(tmpDir, {recursive: true});
    }
    fs.mkdirSync(tmpDir);

    return testSourcesPerTab.map((testSources, index) => {
        const path = `${tmpDir}/${basename(whiskerTestPath)}_${index + 1}.js`;
        fs.writeFileSync(path, `${testSourceWithouExportArray} [${testSources}]`, {encoding: 'utf8'});
        return path;
    });
}

/**
 * Logs the coverage and results (number of fails, pass or skip) to the console in a more readable way.
 *
 * @param {string} logs  The logs from the whisker-web instance
 */
function printTestresultsFromCivergaeGenerator (logs) {
    logger.info('Run Finished\n');

    if (logs.length > 1) {
        logger.warn('Warning, the tests have been parallely executed in multiple chrome tabs. The test results for' +
            ' each property (tests, pass, fail, etc.) list the result of each page. Coverage results can not be displayed' +
            '.\n');
    }

    const {results, coverages} = logs.reduce(
        (acc, log) => {
            acc.results.push(
                log.substring(log.indexOf('# summary:') + '# summary:\n'.length, log.indexOf('# coverage:')));
            acc.coverages.push(log.substring(log.indexOf('# coverage:'), log.length));
            return acc;
        },
        {results: [], coverages: []}
    );

    logger.info(
        'Results:\n',
        results.join()
            .replace(' ', '')
            .replace(/# {3}/g, '')
            .replace(/,/g, '\n')
            .replace('#  ', ''));
    logger.info('Coverages:\n', coverages.join());
}
