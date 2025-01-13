const logger = require("./logger");
const {relativeToServantDir} = require("./util");
const fs = require("node:fs");
const {resolve} = require("path");
const {subcommand, opts} = require("./cli");
const {name, version} = require("./meta");

logger.info(`${name} v${version}`);
logger.debug(`Running subcommand "${subcommand}"`);
logger.debug(`Command line options:`, opts);

// The prettify.js file keeps running into a null exception when puppeteer opens a new page.
// Since this is a purely visual feature and does not harm the test execution in any way,
// we simply remove the file when calling the servant.
// TODO Find better fix for that.
const prettifyPath = resolve(relativeToServantDir(".."), "whisker-web/dist/includes/prettify.js");
if (fs.existsSync(prettifyPath)) {
    fs.unlinkSync(prettifyPath)
}

(async function main() {
    // The convention is to put the code for a Whisker subcommand "cmd" into a JavaScript module "cmd.js".
    // The module must export a single function "accepting the "pool" argument.
    const module = resolve(relativeToServantDir("src"), subcommand);
    const runSubcommand = require(module);
    await runSubcommand();
})();
