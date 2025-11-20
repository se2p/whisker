const {
    scratchPath,
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
        await new Promise((resolve) => setTimeout(resolve, 500))
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

async function configureRecordProject(whisker) {
    const page = whisker.page;
    await page.evaluate(s => document.querySelector('#container').stateActionRecorder = s, true);
    await whisker.uploadProject(recordProject.path);
}

async function configureOpen(whisker) {
    if (scratchPath) {
        await whisker.uploadProject(scratchPath.path);
    }
    await (await whisker.page.$('#fileselect-config')).uploadFile(configPath);
}

// Initialises a single Whisker instance in a browser window based on the provided CLI options
// and runs the openWindow function.
module.exports = () => Whiskers.withNewPool((pool) => pool.run(openWindow), {
    initWhiskerOnce: (whisker) => recordProject ? configureRecordProject(whisker) : configureOpen(whisker),
});
