/* eslint-disable node/no-unpublished-require */

const fs = require("fs");
const {resolve} = require("path");
const TAP13Formatter = require('../../whisker-main/src/test-runner/tap13-formatter');
const logger = require('./logger');

const {scratchPath} = require("./cli").opts;

/**
 * @typedef {import("puppeteer").Page} Page
 */

/**
 * Switches to the project tab, which is necessary to start the test run. Additionally, to click on the start test
 * generation button for test generation runs, we have to toggle the extended view.
 * @param {Page} page
 * @param {boolean} toggleExtendedView
 * @returns {Promise<void>}
 */
async function switchToProjectTab(page, toggleExtendedView) {
    const projectTab = await page.$('#tabProject');
    await projectTab.evaluate(t => t.click());
    if (toggleExtendedView) {
        const toggleExtendedView = await page.$('#extendedView');
        await toggleExtendedView.evaluate(t => t.click());
    }
}

/**
 * Switches to the upload tab, which is necessary to upload Scratch .sb3 files and test generation configs.
 * @param {Page} page
 * @returns {Promise<void>}
 */
async function switchToUploadTab(page) {
    const projectTab = await page.$('#tabUpload');
    await projectTab.evaluate(t => t.click());
}

/**
 * Toggles the extended view element.
 * @param {Page} page
 * @returns {Promise<void>}
 */
async function toggleExtendedView(page) {
    const toggleExtendedView = await page.$('#extendedView');
    await toggleExtendedView.evaluate(t => t.click());
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

function getProjectsInScratchPath() {
    const {path, isDirectory} = scratchPath;

    if (!isDirectory) {
        return [path];
    }

    return fs.readdirSync(path)
        .filter((file) => file.endsWith(".sb3"))
        .map((file) => resolve(path, file))
        .sort();
}


/**
 * "Instruments" the Whisker test suite by recording the current line number before each assertion and assumption.
 *
 * For example: An assertion statement in line 42 such as
 * ```javascript
 * t.assert.ok(…);
 * ```
 * is replaced with
 * ```javascript
 * t.assert.line = 42; t.assert.ok(…);
 * ```
 *
 * @param {string} code The test code to instrument
 * @return {string} The instrumented code
 */
function recordLineNumbersOfAssertions(code) {
    logger.info("Performing line number instrumentation...");

    const lines = [...code.split(/\r?\n/).entries()];

    for (const [lineNumber, line] of lines) {
        for (const a of ["t.assert", "t.assume"]) {
            if (line.includes(a)) {
                const indentation = line.slice(0, line.search(/\S/));
                lines[lineNumber][1] = `${indentation}${a}.line = ${lineNumber + 1}; ${line.trim()}`;
            }
        }
    }

    const instrumented = lines.map(([_lineNumber, line]) => line).join("\n");
    logger.info("Done!");
    return instrumented;
}

module.exports = {
    switchToProjectTab,
    switchToUploadTab,
    toggleExtendedView,
    getProjectsInScratchPath,
    printTestResultsFromCoverageGenerator,
    recordLineNumbersOfAssertions,
};
