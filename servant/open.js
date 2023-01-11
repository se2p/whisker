const {switchToProjectTab} = require("./common");
const {
    scratchPath,
    acceleration,
    seed,
    stateActionRecorder,
    configPath,
} = require("./cli").opts;



async function open(openNewPage){
    const page = await openNewPage();
    if(scratchPath) {
        await (await page.$('#fileselect-project')).uploadFile(scratchPath.path);
    }
    await (await page.$('#fileselect-config')).uploadFile(configPath);
    await switchToProjectTab(page, true);
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, acceleration);
    await page.evaluate(s => document.querySelector('#seed').value = s, seed);
    if(stateActionRecorder){
        await page.evaluate(s => document.querySelector('#container').stateActionRecorder = s, true);
    }

    // Wait until page gets closed.
    while (true){
        if(page.isClosed()){
            break;
        }
        await page.waitForTimeout(1000);
    }
}

module.exports = open;
