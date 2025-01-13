const {switchToProjectTab} = require("./common");
const {
    scratchPath,
    stateActionRecorder,
    configPath,
    recordProject,
    recordingTime,
} = require("./cli").opts;
const logger = require("./logger");
const Whiskers = require("./whiskers");

async function openWindow({page}) {

    // Procedure for generating game recordings.
    if (recordProject) {
        logger.info(`Start Recording ${recordProject.path} for ${recordingTime} seconds`);

        // Start game and recording.
        await (await page.$('#record')).click();
        await (await page.$('#green-flag')).click();
        await (await page.$('#scratch-stage')).focus();

        // Record for specified amount of time.
        let start = Date.now();
        let elapsed = 0;
        while (elapsed <= recordingTime) {
            elapsed = (Date.now() - start) / 1000;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Stop recording and download recorded data.
        await (await page.$('#stop-scratch')).click();
        await new Promise((resolve) => setTimeout(resolve, 1000));  // Give StateActionRecorder time to parse data.
        await (await page.$('#record')).click();
        await (await page.$('#scratch-stage')).focus();

        // Wait 10 seconds for the recording to be downloaded.
        start = Date.now();
        elapsed = 0;
        while (elapsed <= 10) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            elapsed = (Date.now() - start) / 1000;
        }

    } else {
        // Wait until the page gets closed by the user.
        while (!page.isClosed()) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
}

async function configureWhiskerWebInstance(whisker) {
    const page = whisker.page;
    if (recordProject) {
        await page.evaluate(s => document.querySelector('#container').stateActionRecorder = s, true);

        // Upload File
        await whisker.uploadProject(recordProject.path);

        // Switch to Project tab and specify the required parameters.
        await switchToProjectTab(page, false);
        await (await page.$('#scratch-stage')).focus();
        await page.evaluate(() => {
            window.scroll(0, 180);
        });
        await new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
        if (scratchPath) {
            await whisker.uploadProject(scratchPath.path);
        }
        logger.debug("CONFIG: ", configPath)
        await (await whisker.page.$('#fileselect-config')).uploadFile(configPath);
        await switchToProjectTab(whisker.page, false);
        if (stateActionRecorder) {
            await whisker.page.evaluate(s => document.querySelector('#container').stateActionRecorder = s, true);
        }
    }
}

module.exports = () => Whiskers.withNewPool((pool) => pool.run(openWindow), {
    initWhiskerOnce: (whisker) => configureWhiskerWebInstance(whisker),
});
