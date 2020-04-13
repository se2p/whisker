/* eslint-disable no-undef */
/* eslint-disable no-return-assign */
/* eslint-disable require-jsdoc */
/* eslint-disable func-style */
/* eslint-disable no-use-before-define */

const fs = require('fs');
const {basename} = require('path');
const puppeteer = require('puppeteer');
const {logger, cli} = require('./util');
const {CoverageGenerator} = require('../../whisker-main');

const tmpDir = './.tmpWorkingDir';
const coverageReports = [];
const start = Date.now();
const {
    whiskerURL, testPath, scratchPath, frequency, isHeadless, numberOfTabs, isConsoleForwarded, isLifeOutputCoverage,
    isLifeLogEnabled
} = cli.start();

init();

/**
 * The entry point of the runners functionallity, handling the test file preperation and the browser instance.
 */
async function init () {
    const paths = prepateTestFiles(testPath);

    // args: ['--use-gl=desktop'] could be used next to headless, but pages tend to quit unexpectedly
    const browser = await puppeteer.launch(
        {
            headless: !!isHeadless,
            args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
        });

    Promise.all(paths.map((path, index) => runTests(path, browser, index)))
        .then(results => {
            browser.close();
            const logs = results.map(({log}) => log);
            const coverages = results.map(({coverage}) => coverage);

            printTestresultsFromCivergaeGenerator(logs, CoverageGenerator.mergeCoverage(coverages));
            logger.debug(`Duration: ${(Date.now() - start) / 1000} Seconds`);
        })
        .catch(errors => logger.error('Error on executing tests: ', errors))
        .finally(() => fs.rmdirSync(tmpDir, {recursive: true}));
}

/**
 * Runs the tests at the given path in its own page after opening that page.
 *
 * @param {*} path      The path to the test file for the page
 * @param {*} browser   The browser instance the page should be opened in
 * @param {*} index     The index of the page
 */
async function runTests (path, browser, index) {
    const page = await browser.newPage({context: Date.now()});
    page.on('error', error => {
        logger.error(error);
        process.exit(1);
    });

    function optionallyEnableConsoleForward () {
        if (isConsoleForwarded) {
            page.on('console', msg => {
                if (msg._args.length) {
                    logger.info(`Page ${index} | Forwarded: `, msg._args.map(arg => arg._remoteObject.value).join(' '));
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
                const newInfoFromLog = currentLog.replace(log, '').trim();

                if (newInfoFromLog.length) {
                    logger.log(newInfoFromLog);
                }

                log = currentLog;
            }

            const currentCoverageLog = await (await coverageOutput.getProperty('innerHTML')).jsonValue();
            const newInfoFromCoverage = currentCoverageLog.replace(coverageLog, '').trim();
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

    function convertSerializedCoverageToCoverage (serializedCoverage) {
        const coveredBlockIdsPerSprite = new Map();
        serializedCoverage.coveredBlockIdsPerSprite.forEach(({key, values}) => coveredBlockIdsPerSprite.set(key, new Set(values)));
        const blockIdsPerSprite = new Map();
        serializedCoverage.blockIdsPerSprite.forEach(({key, values}) => blockIdsPerSprite.set(key, new Set(values)));
        return {coveredBlockIdsPerSprite, blockIdsPerSprite};
    }

    async function serializeAndReturnCoverageObject () {
        return page.evaluate(() => new Promise(resolve => {
            const generator = document.defaultView.CoverageGenerator;

            const org = generator.getCoverage;
            generator.getCoverage = () => {
                const coverage = org.call(generator);

                const coveredBlockIdsPerSprite =
                    [...coverage.coveredBlockIdsPerSprite].map(elem => ({key: elem[0], values: [...elem[1]]}));
                const blockIdsPerSprite =
                    [...coverage.blockIdsPerSprite].map(elem => ({key: elem[0], values: [...elem[1]]}));
                resolve({coveredBlockIdsPerSprite, blockIdsPerSprite});

                return coverage;
            };
        }));
    }

    try {
        optionallyEnableConsoleForward();
        await configureWhiskerWebInstance();
        const promise = serializeAndReturnCoverageObject();

        await executeTests();

        const output = await readTestOutput();
        const serializedCoverage = await promise;
        await page.close();

        return Promise.resolve({log: output, coverage: convertSerializedCoverageToCoverage(serializedCoverage)});
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
    return tests.reverse().map(test => {
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
            testSourcesPerTab[index].concat(', ').concat(singleTestSources.pop()) :
            singleTestSources.pop();

        index++;

        if (index > tabs - 1) {
            index = 0;
        }
    }

    return testSourcesPerTab;
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
 * @param {string} logs      The logs from the whisker-web instance
 * @param {string} coverage  Combined coverage of from all pages
 */
function printTestresultsFromCivergaeGenerator (logs, coverage) {
    logger.info('Run Finished\n');

    const result = {tests: 0, pass: 0, fail: 0, error: 0, skip: 0};
    logs.map(log => log.substring(log.indexOf('# summary:') + '# summary:\n'.length, log.indexOf('# coverage:')))
        .join()
        .replace(' ', '')
        .replace(/# {3}/g, '')
        .replace(/,/g, '\n')
        .replace('#  ', '')
        .split('\n')
        .filter(str => str.length)
        .forEach(str => result[str.substring(0, str.indexOf(':'))] += Number(str.substring(str.indexOf(':') + 1, str.length)));

    logger.info('Result:', result);

    logger.info('Coverage:');
    logger.log(coverage.getCoverage());
    logger.log(coverage.getCoveragePerSprite());
}
