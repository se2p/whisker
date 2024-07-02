const puppeteer = require("puppeteer");
const logger = require("./logger");
const {consoleForwarded, headless, whiskerUrl, enableGpu} = require("./cli").opts;

async function openNewBrowser() {
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--autoplay-policy=no-user-gesture-required', // https://developer.chrome.com/blog/autoplay/

        // Flags required for hardware acceleration, see
        // https://mirzabilal.com/how-to-enable-hardware-acceleration-on-chrome-chromium-puppeteer-on-aws-in-headless-mode
        '--use-gl=angle',
        '--use-angle=gl-egl',
        '--enable-unsafe-webgpu',
        '--ignore-gpu-blocklist',
    ];

    if (process.env.WHISKER_CONTAINERIZED) {
        // https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#tips
        args.push('--disable-dev-shm-usage');
    }

    logger.info("Opening browser...");

    const browser = await puppeteer.launch({
        headless,
        args,
        devtools: false,

        // If specified, use the given version of Chromium/Chrome instead of the one bundled with Puppeteer.
        // Note: Puppeteer is only guaranteed to work with the bundled Chromium, use at own risk.
        // https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#puppeteerlaunchoptions
        // https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#environment-variables
        // https://github.com/puppeteer/puppeteer/issues/1793#issuecomment-358216238
        executablePath: process.env.CHROME_BIN || null,
    });

    await logGraphicsFeatureStatus(browser);

    return browser;
}

async function logGraphicsFeatureStatus(browser) {
    logger.info("Retrieving GPU information...");

    let page = null;

    try {
        page = await browser.newPage();
        await page.goto("chrome://gpu");

        const [status, driverInfo] = await page.evaluate(() => {
            // noinspection CssInvalidHtmlTagReference
            const shadowRoot = document.querySelector("info-view").shadowRoot;

            // Retrieve "Graphics Feature Status"

            function getStatus(li) {
                const classes = [...li.children].flatMap((c) => [...c.classList]);

                const classMapper = {
                    "feature-green": "✔",
                    "feature-yellow": "!",
                    "feature-red": "✗",
                };

                for (const [c, v] of Object.entries(classMapper)) {
                    if (classes.includes(c)) {
                        return v;
                    }
                }

                return "?";
            }

            const lis = Array.from(shadowRoot.querySelectorAll("h3"))
                .filter((h3) => h3.textContent.includes("Graphics Feature Status"))[0]
                .nextElementSibling.children;

            const status = Array.from(lis).map((li) =>
                ` ${(getStatus(li))} ${li.textContent.replace("*   ", "")}`
            ).join("\n");

            // Retrieve "Driver Information"

            const driverInfo = Array.from(shadowRoot.querySelectorAll("td"))
                .flatMap((td) => {
                    const key = td.innerText;

                    if (!["GPU0", "GL_VENDOR", "GL_RENDERER", "GL_VERSION"].includes(key)) {
                        return [];
                    }

                    const value = td.nextElementSibling.innerText;
                    return [` - ${key}: ${value}`];
                }).join("\n");

            return [status, driverInfo];
        });

        logger.info(`Grahpics Feature Status:\n${status}`);
        logger.info(`GPU Driver Information:\n${driverInfo}`);
    } catch (e) {
        logger.error(`Could not retrieve GPU information. Reason: ${e}`);
    } finally {
        if (page) {
            await page.close();
        }
    }
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
