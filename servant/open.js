const {switchToProjectTab, switchToUploadTab, toggleExtendedView} = require("./common");
const {
    scratchPath,
    acceleration,
    seed,
    stateActionRecorder,
    configPath,
    dataset,
    time
} = require("./cli").opts;
const fs = require('fs');


async function open(openNewPage) {
    const page = await openNewPage();

    // Procedure for generating game recordings.
    if (dataset) {
        await toggleExtendedView(page);
        await page.evaluate(s => document.querySelector('#container').stateActionRecorder = s, true);

        // Iterate over each Scratch project in the specified dataset directory.
        for (const project of fs.readdirSync(dataset)) {
            // Skip files that are not in the Scratch-3 format.
            if (!project.endsWith(".sb3")) {
                continue;
            }

            console.log(`Start Recording ${project} for ${time} seconds`);

            // Upload File
            await page.evaluate(() => { window.scroll(0,0); });
            await switchToUploadTab(page);
            await (await page.$('#fileselect-project')).uploadFile(`${dataset}/${project}`);
            await page.evaluate(s => document.querySelector('#container').stateActionRecorder = s, true);

            // Switch to Project tab and specify the required parameters.
            await switchToProjectTab(page, false);
            await (await page.$('#scratch-stage')).focus();
            await page.evaluate(() => { window.scroll(0,180); });
            await page.waitForTimeout(3000);

            // Start game and recording.
            await (await page.$('#record')).click();
            await (await page.$('#green-flag')).click();
            await page.evaluate(() => { window.scroll(0,180); });
            await (await page.$('#scratch-stage')).focus();

            // Record for specified amount of time.
            const start = Date.now();
            let elapsed = 0;
            while (elapsed <= time) {
                elapsed = (Date.now() - start) / 1000;
                await page.waitForTimeout(1000);
            }

            // Stop recording and download recorded data.
            await (await page.$('#stop-scratch')).click();
            await (await page.$('#scratch-stage')).focus();
            await page.waitForTimeout(3000);        // Give StateActionRecorder time to parse data.
            await (await page.$('#record')).click();
            await (await page.$('#scratch-stage')).focus();
        }

        // Wait 5 seconds for the last file to be downloaded.
        const start = Date.now();
        let elapsed = 0;
        while (elapsed <= 10) {
            page.waitForTimeout(5000);
            elapsed = (Date.now() - start) / 1000;
        }
    } else {
        if (scratchPath) {
            await (await page.$('#fileselect-project')).uploadFile(scratchPath.path);
        }
        await (await page.$('#fileselect-config')).uploadFile(configPath);
        await switchToProjectTab(page, true);
        await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, acceleration);
        await page.evaluate(s => document.querySelector('#seed').value = s, seed);
        if (stateActionRecorder) {
            await page.evaluate(s => document.querySelector('#container').stateActionRecorder = s, true);
        }

        // Wait until the page gets closed.
        while (true) {
            if (page.isClosed()) {
                break;
            }
            await page.waitForTimeout(1000);
        }
    }
}

module.exports = open;
