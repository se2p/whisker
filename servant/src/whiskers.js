const logger = require("./logger");
const genericPool = require("generic-pool");
const fs = require("fs");
const {openNewBrowser, forwardConsoleMessages} = require("./whisker-web");
const {switchToProjectTab} = require("./common");
const path = require("path");
const os = require("os");
const {clearTimeout} = require("node:timers");
const {Mutex} = require('async-mutex');
const {opts} = require("./cli");

/**
 * @typedef {import("generic-pool").Pool} Pool
 * @typedef {import("puppeteer").Browser} Browser
 * @typedef {import("puppeteer").Page} Page
 * @typedef {import("puppeteer").FrameWaitForFunctionOptions} FrameWaitForFunctionOptions
 */

/**
 * @typedef {Object} Timings
 * @property {number} openBrowser - How long it took to open a new browser window, in milliseconds
 * @property {number} loadWhiskerWeb - How long it took to load Whisker Web, in milliseconds
 */

/**
 * @typedef {Object} PoolOptions
 * @property {number} [whiskers] - How many Whisker instances the pool should have
 * @property {number} [ttl] - How often a resource can be handed out before it is destroyed. Use 0 to disable.
 * @property {number} [keepaliveTimeout] - Destroys the browser if it has been unresponsive for the given number of
 *                                         milliseconds. Use 0 to disable.
 * @property {function(Whisker): Promise<void>} [initWhiskerOnce] - A function that performs additional initialization
 *                                                                  of Whisker Web when it is first created by the pool.
 */

/**
 * @callback RunCallback
 * @param {Whisker}
 */

/**
 * @callback WithNewPoolCallback
 * @param {Whiskers}
 */

/**
 * The name under which the keepAlive() function of the Whisker resource will be exposed to browser pages.
 * @type {string}
 */
const whiskerKeepaliveExposedName = "__whisker_keepalive__";

/**
 * The resource that will be handed out by the pool.
 */
class Whisker {

    /**
     * Static factory function that creates the resource.
     * @param pool {Whiskers} The pool that manages the resource
     * @param id {number} ID of the resource
     * @return {Promise<Whisker>} The resource.
     */
    static async create(pool, id) {
        /**
         * @type {Timings}
         */
        const timings = {
            openBrowser: 0,
            loadWhiskerWeb: 0,
        };

        // Open a new browser window.
        let before = Date.now();
        const browser = await openNewBrowser();
        timings.openBrowser = Date.now() - before;
        logger.info(`Browser #${id} opened after ${timings.openBrowser} ms`);

        // Configure the page and load Whisker Web.
        before = Date.now();
        const page = (await browser.pages())[0];
        const whisker = new Whisker(pool, id, browser, page, timings);
        await whisker.enableKeepaliveWatchdog();
        await whisker._configurePage();
        await whisker._loadWhiskerWeb();
        timings.loadWhiskerWeb = Date.now() - before;
        logger.info(`Whisker Web #${id} loaded after ${timings.loadWhiskerWeb} ms`);

        return whisker;
    }

    constructor(pool, id, browser, page, timings) {

        /**
         * Reference to the pool that manages this resource.
         * @type {Whiskers}
         * @private
         */
        this._pool = pool;

        /**
         * ID of this resource.
         * @type {number}
         * @private
         */
        this._id = id;

        /**
         * The puppeteer browser.
         * @type {Browser}
         * @private
         */
        this._browser = browser;

        /**
         * The puppeteer page where we open Whisker Web.
         * @type {Page}
         * @private
         */
        this._page = page;

        /**
         * Temporary directory of this resource.
         * @type {string}
         * @private
         */
        this._tmpDir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "whisker-"));

        /**
         * Whether a keepalive watchdog timer should be used.
         * @type {boolean}
         * @private
         */
        this._keepaliveWatchdogEnabled = false;

        /**
         * Timer that will close the browser if the page freezes.
         * @type {NodeJS.Timeout|null}
         * @private
         */
        this._keepaliveWatchdog = null;

        /**
         * Timer that will close the browser if the evaluation time limit is exceeded.
         * @type {NodeJS.Timeout|null}
         * @private
         */
        this._evaluationTimeLimit = null;

        /**
         * A reason why the resource had to be destroyed, or null.
         * @type {string|null}
         * @private
         */
        this._reason = null;

        /**
         * How often the resource was already handed out by the pool.
         * @type {number}
         * @private
         */
        this._useCount = 0;

        /**
         * How long it took to open a new browser window and load Whisker Web.
         * @type {Timings}
         * @private
         */
        this._timings = timings;
    }

    /**
     * Sets up the page, in particular forwarding of console log messages.
     * @return {Promise<void>}
     * @private
     */
    async _configurePage() {
        // The meaning of each event is explained here: https://pptr.dev/api/puppeteer.pageevent#enumeration-members
        this._page.on('error', (error) => {
            this._reason = "Page crash";
            logger.error(`Whisker Web #${this._id}: ${this._reason}:`, error);
        }).on('pageerror', (error) => {
            this._reason = "Uncaught error in page";
            logger.error(`Whisker Web #${this._id}: ${this._reason}:`, error);
        });

        forwardConsoleMessages(this._page, this._id);

        // Set navigation timeout to 5 min
        this._page.setDefaultNavigationTimeout(300000);
    }

    /**
     * Initializes Whisker Web.
     * @return Promise<void>
     * @private
     */
    async _loadWhiskerWeb() {
        await this._page.goto(opts.whiskerUrl, {waitUntil: "load"}); // https://pptr.dev/api/puppeteer.waitforoptions

        // Page initialization code common to all use cases.
        await this._page.evaluate((opts) => {
            if (opts.seed) document.querySelector('#seed').value = opts.seed;
            if (opts.acceleration) document.querySelector('#acceleration-value').innerText = opts.acceleration;
            if (opts.useSaveStates) document.querySelector("#use-save-states").checked = opts.useSaveStates;
        }, {
            ...opts,
            acceleration: String(opts.acceleration), // Infinity (as number) is not JSON serializable.
        });

        // VERY IMPORTANT: The "My Project" tab must be selected and the Scratch stage must be visible before running
        // the tests. Otherwise, wrong results might be reported. See commit 63b21e58.
        await switchToProjectTab(this._page, true);

        /*
         * Page initialization code specific to the current Whisker subcommand.
         */
        await this._pool._initWhiskerOnce(this);
    }

    get id() {
        return this._id;
    }

    get reason() {
        return this._reason;
    }

    set reason(reason) {
        this._reason = reason;
    }

    get page() {
        return this._page;
    }

    get tmpDir() {
        return this._tmpDir;
    }

    get timings() {
        return this._timings;
    }

    /**
     * Uploads the Scratch project (given by its path, which should end in *.sb3) to this Whisker Web page. By default,
     * also waits up to 10 seconds for the project to actually finish uploading. Throws an error if this times out.
     *
     * @param projectPath {string} The path to the Scratch project (*.sb3) to upload
     * @param options {?FrameWaitForFunctionOptions} Options for configuring waiting behavor
     * @return {Promise<void>}
     */
    async uploadProject(projectPath, options = null) {
        options = {
            ...options,
            polling: 50,
            timeout: 10000,
        };

        const before = Date.now();
        await (await this._page.$('#fileselect-project')).uploadFile(projectPath);

        // To avoid issues #217 and #321.
        await this._page.waitForFunction(() => !window.Whisker.scratch.vm.isLoading, options);

        logger.info(`Whisker Web #${this._id} finished uploading project after`, Date.now() - before, "ms");
    }

    /**
     * Enables the keepalive watchdog timer such that page freezes can be detected. Force-closes the browser window
     * if this happens. Calling `keepAlive()` will have no effect unless this method is invoked first.
     */
    async enableKeepaliveWatchdog() {
        if (this._pool._keepaliveTimeout < 1) {
            return;
        }

        await this._page.exposeFunction(whiskerKeepaliveExposedName, () => this.keepAlive());

        this._keepaliveWatchdogEnabled = true;

        // noinspection JSUnresolvedReference
        await this._page.evaluate((whiskerKeepaliveExposedName) => setInterval(() => window[whiskerKeepaliveExposedName](), 1000),
            whiskerKeepaliveExposedName);

        /*
         * Start the keepalive watchdog timer already in the Node.js context to detect page freezes. It should not
         * be started in the Puppeteer context because by then the page might already be frozen. The timer expires
         * after 5 seconds and will close the browser unless the page resets it periodically from within the
         * Puppeteer context. We do this in 1 second intervals.
         */
        this.keepAlive();
    }

    /**
     * Disables the keepalive watchdog timer. Afterward, `keepAlive()` will have no more effect.
     */
    async disableKeepaliveWatchdog() {
        this._keepaliveWatchdogEnabled = false;
        clearTimeout(this._keepaliveWatchdog);
    }

    /**
     * Tells how often this resource has already been handed out.
     * @return {number}
     */
    get useCount() {
        return this._useCount;
    }

    /**
     * If the keepaliveWatchdog is not refreshed before the timeout, the browser closes. The intention is to detect page
     * hangs, deadlocks, and other errors that make the whole page unresponsive. For example, when this bug [1] in the
     * Scratch VM happens the entire page freezes and can no longer be closed. Another example are sporadic page crashes
     * in Chromium/puppeteer itself (Whisker issue #380). The only reliable escape hook is to close the entire browser.
     * [1] https://github.com/scratchfoundation/scratch-vm/issues/2282
     */
    keepAlive() {
        const timeout = this._pool._keepaliveTimeout;

        if (!timeout) {
            return;
        }

        if (!this._keepaliveWatchdogEnabled) {
            return;
        }

        this._keepaliveWatchdog = this._keepaliveWatchdog !== null
            ? this._keepaliveWatchdog.refresh()
            : setTimeout(async () => {
                logger.info(`Whisker #${this._id} dead after ${timeout} ms!`);

                if (this._reason === null) {
                    // If no reason for death until now (e.g., page crash or uncaught error), assume the VM has frozen.
                    this._reason = "The page froze";
                }

                await this._pool.destroy(this);
            }, timeout);
    }

    /**
     * Closes the browser window automatically when the evaluation time limit is reached.
     * @param {number} ms The time limit in milliseconds
     */
    enableEvaluationTimeout(ms) {
        this._evaluationTimeLimit = setTimeout(async () => {
            logger.info(`Whisker #${this._id} timed out!`);
            this._reason = `Evaluation time limit of ${ms} ms reached`;

            /*
             * FIXME: Issue #219: find a better way to stop test execution!
             *  There should be a timeout parameter for runTestsWithRepair. It needs to be propagated all the way to
             *  vm-wrapper.js. It has to check the timeout after every single step in its run() method. Using
             *  whisker.page.evaluate(() => window.Whisker.abortTestRun()) does not work with acceleration factor
             *  Infinity, because the Promise is only executed after the tests finished. And throwing an exception
             *  like we do in uploadProject() does not work either, because we're inside the callback function of
             *  setTimeout(). The try-catch-finally below cannot catch this Error, and it also doesn't stop the
             *  test execution.
             */
            await this._pool.destroy(this);
        }, ms);
    }

    /**
     * Do not enforce the evaluation timeout for test suite executions.
     */
    disableEvaluationTimeout() {
        clearTimeout(this._evaluationTimeLimit);
    }

    /**
     * Destroys the resource by closing the browser and clearing all timers.
     * @return {Promise<void>}
     */
    async destroy() {
        logger.info(`Destroying Whisker #${this._id}`);

        await this.disableKeepaliveWatchdog();
        this.disableEvaluationTimeout();

        try {
            if (this._browser === null) { // This can happen if the same browser is closed in rapid succession.
                return;
            }

            const before = Date.now();
            await this._browser.close();
            logger.info(`Whisker #${this._id} destroyed after`, Date.now() - before, "ms");
        } catch (e) {
            // Sometimes, we get this (or a similar) error when closing the browser:
            // ENOTEMPTY: directory not empty, rmdir '/tmp/puppeteer_dev_chrome_profile-Q9g6MJ/Default/Cache'
            // It doesn't seem to hurt anything, so we just log it and ignore it.
            logger.error(`Error destroying Whisker #${this._id}`, e);
        } finally {
            if (this._tmpDir !== null) {
                fs.rmSync(this._tmpDir, {recursive: true});
            }

            this._pool = null;
            this._browser = null;
            this._page = null;
            this._keepaliveWatchdog = null;
            this._evaluationTimeLimit = null;
            this._tmpDir = null;
        }
    }

    /**
     * Validates that this resource is intact. In particular, will return `false` if the browser reached the maximum
     * use count.
     * @return {boolean} `true` if all OK, `false` otherwise.
     */
    validate() {
        if (this._pool === null) {
            return false;
        }

        if (this._useCount >= this._pool._ttl) {
            logger.info(`Whisker #${this._id} reached its end of life (had ${this._useCount} uses)...`);
            return false;
        }

        this._useCount++;

        if (this._browser === null || this._page === null || this._tmpDir === null) {
            return false;
        }

        return !this._page.isClosed();
    }
}

/**
 * The default options for the `Whiskers` pool.
 * @type {PoolOptions}
 */
const defaultPoolOptions = {
    whiskers: opts.numberOfJobs,
    ttl: 0,
    keepaliveTimeout: 0,
    initWhiskerOnce: (_whisker) => {
        /* noop, but users can provide a custom function. */
    },
};

class Whiskers {

    /**
     * Creates a new resource pool of Whisker instances.
     * @param {PoolOptions} opts Configuration object for the pool. Omit for default options.
     */
    constructor(opts = {}) {
        opts = {
            ...defaultPoolOptions,
            ...opts
        };

        const factory = {
            create: () => this._create(),
            destroy: (whisker) => whisker.destroy(),
            validate: (whisker) => whisker.validate(),
        };

        /**
         * Keeps track of how many resources were already created.
         * @type {number}
         * @private
         */
        this._count = 0;

        /**
         * Internal backing pool.
         * @type {Pool<Whisker>}
         * @private
         */
        this._pool = genericPool.createPool(factory, {
            // Ensure the pool always holds precisely the given number of resources.
            min: opts.whiskers,
            max: opts.whiskers,

            // Ensure the resource is still valid before handing it out.
            testOnBorrow: true,

            // Important, otherwise new Whisker resources are created before the Whiskers pool is fully initialized.
            autostart: false,
        });

        /**
         * Number of milliseconds after which a browser will be destroyed if it has been found to be unresponsive.
         * @type {number}
         * @private
         */
        this._keepaliveTimeout = opts.keepaliveTimeout;

        /**
         * How often a resource can be handed out before it will be destroyed.
         * @type {number}
         * @private
         */
        this._ttl = opts.ttl < 1 ? Infinity : opts.ttl;

        /**
         * A mutex to ensure that only one browser is opened at once.
         * @type {Mutex}
         * @private
         */
        this._mutex = new Mutex();

        /**
         * A function for additional custom initialization of browser pages. Will be executed once, when first creating
         * a new resource. Does nothing by default.
         * @type {function(Whisker): Promise<void>}
         * @private
         */
        this._initWhiskerOnce = opts.initWhiskerOnce.bind(null);
    }

    /**
     * Creates a new resource (browser instance). The browser has Whisker Web already loaded. A keepalive watchdog timer
     * that closes the browser in case of page freezes is already installed. The browser can be reused for multiple test
     * executions by returning it to the pool once one execution is done.
     * @return {Promise<Whisker>}
     * @private
     */
    async _create() {
        const id = ++this._count;
        logger.info(`Creating Whisker #${id}...`);
        const before = Date.now();
        // Sequentializing browser creation prevents issues #241 and #242.
        const whisker = await this._mutex.runExclusive(() => {
            logger.info(`Lock for Whisker #${id} acquired after`, Date.now() - before, "ms");
            return Whisker.create(this, id);
        });
        logger.info(`Created Whisker #${id} after`, Date.now() - before, "ms");
        return whisker;
    }

    /**
     * Destroys the given resource.
     * @param whisker {Whisker} The resource to destroy.
     * @return {Promise<void>}
     */
    destroy(whisker) {
        // Sometimes, the pool throws an error saying "Resource not currently part of this pool", even though
        // the resource clearly originated from the pool. I don't know why this happens (maybe I'm misusing the
        // API?) but the following workaround avoids the problem, and it doesn't seem to break anything.
        return this._pool.isBorrowedResource(whisker) ? this._pool.destroy(whisker) : whisker.destroy();
    }

    /**
     * Starts this resource pool.
     * @return {Promise<void>}
     */
    start() {
        this._pool.start();
        return this._pool.ready();
    }

    /**
     * Instruct the pool to hand out a resource.
     * @return {Promise<Whisker>}
     */
    async acquire() {
        return this._pool.acquire();
    }

    /**
     * Hand back the resource to the pool.
     * @param {Whisker} whisker The resource to hand back.
     * @return {Promise<void>}
     */
    async release(whisker) {
        if (whisker === null) {
            return;
        }

        // The timings are only relevant on first use. Afterward, the browser is already opened and Whisker Web already
        // loaded. Hence, reset them to 0 for all subsequent uses.
        whisker._timings.openBrowser = 0;
        whisker._timings.loadWhiskerWeb = 0;

        whisker.reason = null;
        whisker.disableEvaluationTimeout();

        if (whisker.page.isClosed()) {
            logger.warn([
                `It seems you closed the page for Whisker #${whisker.id} manually.`,
                'It is generally not recommended to do so, because it prevents reusing the page objects.',
                'Please check your code for unintended operations such as "page.close()" to avoid this warning.',
            ].join("\n"));
        }

        if (this._pool.isBorrowedResource(whisker)) {
            await this._pool.release(whisker);
        }
    }

    /**
     * Shuts down the pool. This also destroys all resources.
     * @return {Promise<void>}
     */
    async shutdown() {
        logger.info("Shutting down the pool...");
        await this._pool.drain();
        await this._pool.clear();
    }

    /**
     * Executes the given callback with a `Whisker` resource handed out by the pool. Includes automatic error handling
     * and cleanup of the resource.
     *
     * @param callback {RunCallback} The callback to execute with the resource
     * @return {Promise<*>} The result of the callback
     */
    async run(callback) {
        let whisker = null;
        try {
            whisker = await this.acquire();
            return await callback(whisker);
        } catch (e) {
            logger.error("Callback error:", e);
        } finally {
            await this.release(whisker);
        }
    }

    /**
     * Creates a new Whiskers pool with the given options, and executes the callback. Includes automatic error handling
     * and cleanup of the pool.
     *
     * @param callback {WithNewPoolCallback} The callback to execute with the pool
     * @param opts {PoolOptions} The options for the pool. Omit for default options.
     * @return {Promise<*>} The result of the callback
     */
    static async withNewPool(callback, opts = {}) {
        /**
         * @type {Whiskers}
         */
        let pool = null;

        try {
            pool = new Whiskers(opts);
            await pool.start();
            return await callback(pool);
        } catch (e) {
            logger.error("Pool error:", e);
        } finally {
            if (pool !== null) {
                await pool.shutdown();
            }
        }
    }
}

module.exports = Whiskers;
