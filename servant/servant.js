const logger = require("./logger");
const {subcommand} = require('./cli');
const {resolve} = require('path');
const {openNewBrowser, openNewPage} = require("./whisker-web");
const {relativeToServantDir} = require("./util");

void async function main() {
    // The convention is to put the code for a Whisker subcommand "cmd" into a JavaScript module "cmd.js".
    // The module must only export a function accepting the "openNewPage" callback.
    let browser = null;
    try {
        browser = await openNewBrowser();
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
