const logger = require("./logger");
const fs = require("fs");
const {
    output,
    testDownloadDir,
    testPath,
    scratchPath,
    configPath,
    groundTruth,
    winningStates,
    keepaliveTimeout
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
        if (output) {
            logger.info(`Creating CSV summary in ${output}`);
            fs.writeFileSync(output, csv);
        }
    } catch (e) {
        logger.error('Error on generating tests: ', e)
    }
}

async function configureWhiskerWebInstance(whisker) {
    await whisker.uploadProject(scratchPath.path);
    const page = whisker.page;
    await (await page.$('#fileselect-config')).uploadFile(configPath);
    if (testPath) {
        await (await page.$('#fileselect-tests')).uploadFile(testPath);
    }
    if (groundTruth) {
        await page.evaluate(g => document.querySelector('#container').groundTruth = g, fs.readFileSync(groundTruth, 'utf8'));
    }
    if (winningStates) {
        await page.evaluate(w => document.querySelector('#container').winningStates = w, fs.readFileSync(winningStates, 'utf8'));
    }
    logger.info('Web Instance Configuration Complete');
}

async function runGeneticSearch(page) {
    async function readTestResults() {
        const logOutput = await page.$('#output-log .output-content');
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

        let downloadsStarted = 0;
        let downloadsCompleted = 0;

        // Listener for the Page.downloadWillBegin event that gets emitted when a download starts
        const downloadStartListener = () => {
            downloadsStarted++;
            logger.debug(`Download ${downloadsStarted} started`);
        };

        // Listener for the Page.downloadProgress event that gets emitted when a download progresses.
        const downloadProgressListener = (event) => {
            if (event.state === 'completed') {
                downloadsCompleted++;
                logger.info(`Download ${downloadsCompleted}/${downloadsStarted} complete`);

                // Resolve when all started downloads are completed
                if (downloadsCompleted === downloadsStarted && downloadsStarted > 0) {
                    promiseResolve();
                }
            } else if (event.state === 'canceled') {
                promiseReject(new Error(`Download canceled (${downloadsCompleted}/${downloadsStarted} completed)`));
            }
        };

        // Track when downloads begin
        page._client().on('Page.downloadWillBegin', downloadStartListener);
        page._client().on('Page.downloadProgress', downloadProgressListener);

        // Create deferred Promises that get called by the downloadProgressListener
        let promiseResolve, promiseReject;
        const waitForDownloads = new Promise((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });

        try {
            await (await page.$('.editor-save')).click();
            await waitForDownloads;
        } finally {
            page._client().off('Page.downloadWillBegin', downloadStartListener);
            page._client().off('Page.downloadProgress', downloadProgressListener);
        }
    }


    try {
        logger.debug("Executing search");
        await executeSearch();
        const results = await readTestResults();
        logger.debug(`Downloading tests to ${testDownloadDir}`);
        await downloadTests();
        return Promise.resolve(results);
    } catch (e) {
        return Promise.reject(e);
    }
}

module.exports = () => Whiskers.withNewPool((pool) => pool.run(generateTests), {
    initWhiskerOnce: (whisker) => configureWhiskerWebInstance(whisker),
    keepaliveTimeout: keepaliveTimeout ? keepaliveTimeout : 120000,
    crashOn: ["pageerror", "error"], // FIXME: Issue #392
});
