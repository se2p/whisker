const {switchToProjectTab} = require("./common");
const {
    scratchPath,
    acceleration,
    seed,
    stateActionRecorder
} = require("./cli").opts;



async function open(openNewPage){
    const page = await openNewPage();
    if(scratchPath) {
        await (await page.$('#fileselect-project')).uploadFile(scratchPath.path);
    }


    await switchToProjectTab(page, true);
    await page.evaluate(factor => document.querySelector('#acceleration-value').innerText = factor, acceleration);
    await page.evaluate(s => document.querySelector('#seed').value = s, seed);
    console.log(stateActionRecorder);
    if(stateActionRecorder){
        await page.evaluate(s => document.querySelector('#container').stateActionRecorder = s, true);
        await (await page.$('#record')).click()
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
