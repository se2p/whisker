/* eslint-disable no-undef */
/* eslint-disable no-return-assign */
/* eslint-disable require-jsdoc */
/* eslint-disable func-style */
/* eslint-disable no-use-before-define */

const fs = require('fs');
const {basename} = require('path');
const puppeteer = require('puppeteer');
const {logger, cli} = require('./util');

const tmpDir = './tmpWorkingDir';
const start = Date.now();
const {whiskerURL, testPath, scratchPath, frequency, isHeadless, numberOfTabs, isConsoleForwarded} = cli.start();

init();

/**
 * The entry point of the runners functionallity, handling the test file preperation and the browser instance.
 */
async function init () {
    const paths = prepateTestFiles(testPath);

    // args: ['--use-gl=desktop'] could be used next to headless, but pages tend to quit unexpectedly
    const browser = await puppeteer.launch({headless: !!isHeadless});

    Promise.all(paths.map((path, index) => runTests(path, browser, index)))
        .then(logs => {
            browser.close();
            printTestresultsFromCivergaeGenerator(logs);
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
    await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: '/home/nik/Downloads/'});

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
        const outputContent = await page.$('#output-run .output-content');

        let log = '';
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const currentLog = await (await outputContent.getProperty('innerHTML')).jsonValue();

            const newInfoFromLog = currentLog.replace(log, '').trim();
            if (newInfoFromLog.length) {
                logger.info(`Page ${index}: `, newInfoFromLog);
            }
            log = currentLog;

            if (currentLog.includes('summary')) {
                break;
            }

            await page.waitFor(1000);
        }

        return log;
    }

    try {
        optionallyEnableConsoleForward();
        await configureWhiskerWebInstance();
        await executeTests();
        const output = await readTestOutput();
        await page.close();
        return Promise.resolve(output.substring(output.indexOf('# summary:'), output.length));
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
 * @param {string} logs  The logs from the whisker-web instance
 */
function printTestresultsFromCivergaeGenerator (logs) {
    if (logs.length > 1) {
        logger.warn('Warning, the tests have been parallely executed in multiple chrome tabs. The test results for' +
      ' each property (tests, pass, fail, etc.) list the result of each page. Coverage results can not be displayed');
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

    logger.info('Results:\n', results.join().replace(/\n/g, ' ')
        .replace(/# {3}/g, '')
        .replace(/,/g, '\n'));
    logger.info('Coverages:\n', coverages.join());
}
