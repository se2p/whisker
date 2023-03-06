const logger = require("./logger");
const {subcommand} = require('./cli');
const {resolve} = require('path');
const {openNewBrowser, openNewPage} = require("./whisker-web");
const {relativeToServantDir} = require("./util");
const fs = require("fs");
const path = require("path");

void async function main() {
    // The convention is to put the code for a Whisker subcommand "cmd" into a JavaScript module "cmd.js".
    // The module must only export a function accepting the "openNewPage" callback.
    let browser = null;
    try {
        browser = await openNewBrowser();

        // The prettify.js file keeps running into a null exception when puppeteer opens a new page.
        // Since this is a purely visual feature and does not harm the test execution in any way,
        // we simply remove the file when calling the servant.
        // TODO Find better fix for that.
        const prettifyPath = path.resolve(__dirname, "../whisker-web/dist/includes/prettify.js");
        if (fs.existsSync(prettifyPath)) {
            fs.unlinkSync(prettifyPath)
        }

        return await require(resolve(relativeToServantDir(subcommand)))(openNewPage.bind(null, browser));
    } catch (e) {
        logger.error(e);
        return Promise.reject(e);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}();
