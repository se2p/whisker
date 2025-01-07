const puppeteer = require("puppeteer");
const Minilog = require('minilog');
const {format} = require("util");
const logger = require("./logger");
const opts = require("./cli").opts;
const {headless, whiskerUrl} = opts;

// Workaround for Whisker issue #241
async function openNewBrowserWithRetry(options) {
    while (true) {
        try {
            const browser = await puppeteer.launch(options);

            try {
                await Promise.race([
                    browser.pages(),
                    new Promise((_resolve, reject) => setTimeout(() => {
                        reject(new puppeteer.TimeoutError('Timed out after 5 seconds trying to access browser pages'));
                    }, 5000)),
                ]);
            } catch (e) {
                await browser.close();
                throw e;
            }

            // Puppeteer succeeded with opening a new browser.
            return browser;
        } catch (e) {
            if (e instanceof puppeteer.TimeoutError) {
                logger.warn("Timeout while opening browser! Retrying...");
            } else {
                throw e;
            }
        }
    }
}

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

    const browser = await openNewBrowserWithRetry({
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

        logger.info(`Graphics Feature Status:\n${status}`);
        logger.info(`GPU Driver Information:\n${driverInfo}`);
    } catch (e) {
        logger.error(`Could not retrieve GPU information. Reason: ${e}`);
    } finally {
        if (page) {
            await page.close();
        }
    }
}

function forwardConsoleMessages(page, id = "") {
    const loggers = [
        "whisker-main",
        "whisker-web",
        "vm",
        "", // anything that is unidentified
    ].map((namespace) => ({
        namespace: namespace && (namespace + " "),
        logger: Minilog((namespace || "[forwarded]") + (id && ` ${id}`))
    }));

    function getLogger(str) {
        for (const logger of loggers) {
            if (str.startsWith(logger.namespace)) {
                return logger;
            }
        }

        return logger;
    }

    function getArgsOrText(msg) {
        const args = msg.args();

        // Even if args are empty, there might still be text.
        if (args.length === 0) {
            return [msg.text()];
        }

        // Try to convert each arg to its JSON representation. If this fails, fall back to string representation.
        return Promise.all(args
            .map(async (arg) => {
                // Try to extract the stack trace from errors.
                const a = await arg.evaluate((arg) => arg instanceof Error
                    ? decodeURIComponent(arg.stack)
                    : arg, arg);

                if (typeof a === "string") {
                    return a;
                }

                try {
                    return await arg.jsonValue();
                } catch {
                    return arg.toString();
                }
            }));
    }

    page.on("console", async (msg) => {
        const raw = await getArgsOrText(msg);

        // Process format specifiers.
        const str = format(...raw);

        // Try to detect namespace and which logger to use.
        const {logger, namespace} = getLogger(str);

        // Remove namespace prefix from message (will be added back by the logger.)
        const s = str.slice(namespace.length);

        // Log actual message at the appropriate level.
        const type = msg.type();
        (logger[type === "warning" ? "warn" : type] ?? logger.debug).bind(logger)(s);
    });
}

function logErrors(page, id = "") {
    if (id !== "") {
        id = `Whisker Web #${id} `;
    }

    page.on('error', (error) => {
        logger.error(`${id}Page crash:`, error);
    }).on('pageerror', (error) => {
        logger.error(`${id}Uncaught error in page:`, error);
    });
}

async function openNewPage(browser) {
    const page = await browser.newPage({context: Date.now()});
    return await configureWhiskerWeb(page);
}

async function configureWhiskerWeb(page, {waitUntil = "networkidle0", id = ""} = {}) {
    logErrors(page);
    forwardConsoleMessages(page, id);

    // Set navigation timeout to 5 min
    page.setDefaultNavigationTimeout(300000);

    await page.goto(whiskerUrl, {waitUntil});

    return page;
}

module.exports = {
    openNewBrowser,
    openNewPage,
    configureWhiskerWeb
};
