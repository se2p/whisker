const puppeteer = require("puppeteer");
const logger = require("./logger");
const {subcommand, opts: {consoleForwarded, headless}} = require('./cli');

async function openNewBrowser() {
    const args = [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // '--use-gl=desktop', // could be used next to headless, but pages tend to quit unexpectedly
    ];

    return await puppeteer.launch({
        headless,
        args,
        devtools: !process.env.NODE_ENV === "production",

        // If specified, use the given version of Chromium/Chrome instead of the one bundled with Puppeteer.
        // Note: Puppeteer is only guaranteed to work with the bundled Chromium, use at own risk.
        // https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#puppeteerlaunchoptions
        // https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#environment-variables
        // https://github.com/puppeteer/puppeteer/issues/1793#issuecomment-358216238
        executablePath: process.env.CHROME_BIN || null,
    });
}

async function openNewPage(browser) {
    const page = await browser.newPage({context: Date.now()});
    page.on('error', (error) => {
        logger.error(error);
        return Promise.reject(error);
    }).on('pageerror', (error) => {
        logger.error(error);
        return Promise.reject(error);
    });

    if (consoleForwarded) {
        // https://github.com/puppeteer/puppeteer/issues/1512#issuecomment-349784408
        // https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#class-consolemessage
        page.on('console', msg => {
            if (msg.type() === "warning") {
                logger.warn(`Forwarded: ${msg.text()}`);
            } else {
                logger.info(`Forwarded: ${msg.text()}`);
            }
        });
    }

    return page;
}

void async function main() {
    let browser = null;

    try {
        browser = await openNewBrowser();
    } catch (e) {
        logger.error(e);
        return Promise.reject(e);
    }

    // The convention is to put the code for a Whisker subcommand "cmd" into a JavaScript module "cmd.js".
    // The module must only export a function accepting the "page" argument.
    const modulePath = require('path').resolve(`${subcommand}.js`);
    const runSubcommand = require(modulePath);

    try {
        const page = await openNewPage(browser);
        try {
            return await runSubcommand(page);
        } finally {
            await page.close();
        }
    } catch (e) {
        logger.error(e);
        return Promise.reject(e);
    } finally {
        await browser.close()
    }
}();
