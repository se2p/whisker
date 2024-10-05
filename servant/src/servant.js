const Whiskers = require("./whiskers");
const logger = require("./logger");
const {relativeToServantDir} = require("./util");
const fs = require("node:fs");
const {resolve} = require("path");
const {subcommand} = require("./cli");

// The prettify.js file keeps running into a null exception when puppeteer opens a new page.
// Since this is a purely visual feature and does not harm the test execution in any way,
// we simply remove the file when calling the servant.
// TODO Find better fix for that.
const prettifyPath = resolve(relativeToServantDir(".."), "whisker-web/dist/includes/prettify.js");
if (fs.existsSync(prettifyPath)) {
    fs.unlinkSync(prettifyPath)
}

(async function main() {
    let pool = null;

    try {
        pool = new Whiskers();
        await pool.start();

        // The convention is to put the code for a Whisker subcommand "cmd" into a JavaScript module "cmd.js".
        // The module must export a single function "accepting the "pool" argument.
        const module = resolve(relativeToServantDir("src"), subcommand);
        return await require(module)(pool);
    } catch (e) {
        logger.error(e);
    } finally {
        if (pool !== null) {
            await pool.shutdown();
        }
    }
})();
