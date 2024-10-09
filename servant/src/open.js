const {switchToProjectTab, toggleExtendedView} = require("./common");
const {
    scratchPath,
    stateActionRecorder,
    configPath,
    recordProject,
    time,
} = require("./cli").opts;
const logger = require("./logger");
const Whiskers = require("./whiskers");

async function open(page) {
    // Procedure for generating game recordings.
    if (recordProject) {
        await toggleExtendedView(page);
        await page.evaluate(s => document.querySelector('#container').stateActionRecorder = s, true);
        logger.info(`Start Recording ${recordProject.path} for ${time} seconds`);

        // Upload File
        await (await page.$('#fileselect-project')).uploadFile(recordProject.path);

        // Switch to Project tab and specify the required parameters.
        await switchToProjectTab(page, false);
        await (await page.$('#scratch-stage')).focus();
        await page.evaluate(() => {window.scroll(0, 180);});
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Start game and recording.
        await (await page.$('#record')).click();
        await (await page.$('#green-flag')).click();
        await page.evaluate(() => {window.scroll(0, 180);});
        await (await page.$('#scratch-stage')).focus();

        // Record for specified amount of time.
        let start = Date.now();
        let elapsed = 0;
        while (elapsed <= time) {
            elapsed = (Date.now() - start) / 1000;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Stop recording and download recorded data.
        await (await page.$('#stop-scratch')).click();
        await new Promise((resolve) => setTimeout(resolve, 1000));        // Give StateActionRecorder time to parse data.
        await (await page.$('#record')).click();
        await (await page.$('#scratch-stage')).focus();

        // Wait 1 second for recording to be downloaded.
        start = Date.now();
        elapsed = 0;
        while (elapsed <= 10) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            elapsed = (Date.now() - start) / 1000;
        }

    } else {
        if (scratchPath) {
            await (await page.$('#fileselect-project')).uploadFile(scratchPath.path);
        }
        await (await page.$('#fileselect-config')).uploadFile(configPath);
        await switchToProjectTab(page, true);
        if (stateActionRecorder) {
            await page.evaluate(s => document.querySelector('#container').stateActionRecorder = s, true);
        }

        // Wait until the page gets closed.
        while (true) {
            if (page.isClosed()) {
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
}

module.exports = Whiskers.withNewPool(null, (pool) => open(pool.page));
