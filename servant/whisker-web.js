const puppeteer = require("puppeteer");
const logger = require("./logger");
const {consoleForwarded, headless, whiskerUrl} = require("./cli").opts;

async function openNewBrowser() {
    const args = [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--autoplay-policy=no-user-gesture-required', // https://developer.chrome.com/blog/autoplay/
        // '--use-gl=desktop', // could be used next to headless, but pages tend to quit unexpectedly
    ];

    return await puppeteer.launch({
        headless,
        args,
        devtools: process.env.NODE_ENV !== "production",

        // If specified, use the given version of Chromium/Chrome instead of the one bundled with Puppeteer.
        // Note: Puppeteer is only guaranteed to work with the bundled Chromium, use at own risk.
        // https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#puppeteerlaunchoptions
        // https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#environment-variables
        // https://github.com/puppeteer/puppeteer/issues/1793#issuecomment-358216238
        executablePath: process.env.CHROME_BIN || null,
    });
}

async function forwardJSHandleError(msg) {
    // Based on https://github.com/puppeteer/puppeteer/issues/3397#issuecomment-434970058
    return await Promise.all(msg.args().map((arg) =>
        arg.executionContext().evaluate((arg) => {
            if (arg instanceof Error) {
                return arg.stack;
            }
            return arg;
        }, arg)));
}

async function evaluateMsgArgsInExecutionContext(msg) {
    return await Promise.all(msg.args().map((arg) => arg.executionContext().evaluate((arg) => arg, arg)));
}

function formatStackTrace(msg) {
    const frames = msg.stackTrace().map((frame) => {
        const {url, lineNumber, columnNumber} = frame;
        return `  @ ${url || "<unknown>"}:${lineNumber}:${columnNumber}`;
    });
    return [msg.text(), ...frames].join('\n');
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
        page.on('console', async (msg) => {
            if (msg.text() === "JSHandle@error") {
                // When the message text is "JSHandle@error", we assume we have something that can be evaluated in
                // the page context to get the actual stack trace of the error. This assumption probably holds in
                // 99.9% of the cases. If not (e.g., because the actual error message is "JSHandle@error", but maybe
                // in other cases, too), we fall back to just printing "JSHandle@error".
                try {
                    logger.error('Forwarded:', ...await forwardJSHandleError(msg));
                } catch {
                    // Unable to forward the JSHandle@error
                    logger.error('Forwarded: JSHandle@error');
                }
                return;
            }

            switch (msg.type()) {
                case 'warning':
                    logger.warn('Forwarded:', msg.text());
                    break;
                case 'log':
                    logger.info('Forwarded:', msg.text());
                    break;
                case 'trace':
                    logger.error('Forwarded:', formatStackTrace(msg));
                    break;
                case 'table':
                    try {
                        logger.info('Forwarded:');
                        console.table(...await evaluateMsgArgsInExecutionContext(msg));
                    } catch {
                        logger.info('Forwarded:', msg.text());
                    }
                    break;
                default:
                    // Assume error
                    logger.error('Forwarded:', msg.text());
            }
        });
    }

    await page.goto(whiskerUrl, {waitUntil: "networkidle0"});

    return page;
}

module.exports = {
    openNewBrowser,
    openNewPage,
};
