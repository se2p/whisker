const logger = require("./logger");
const genericPool = require("generic-pool");
const fs = require("fs");
const {openNewBrowser, forwardConsoleMessages} = require("./whisker-web");
const {switchToProjectTab} = require("./common");
const path = require("path");
const os = require("os");
const {clearTimeout} = require("node:timers");
const {Mutex} = require('async-mutex');
const {opts, subcommand} = require("./cli");

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
 * @typedef {Object} MemoryUsage
 * @property {number} max - The maximum heap size that can be allocated, in MiB
 * @property {number} alloc - The currently allocated heap size, in MiB
 * @property {number} used - The amount of memory the heap actually uses, in MiB
 */

/**
 * @typedef {Object} PoolOptions
 * @property {number} [whiskers] - How many Whisker instances the pool should have
 * @property {number} [ttl] - How often a resource can be handed out before it is destroyed. Use 0 to disable.
 * @property {number} [memThreshold] - How much percent of the maximum allocatable heap size the resource is allowed to
 *                                     use. If exceeded, the resource is destroyed. Use a value between 0 (exclusive)
 *                                     and 1 (inclusive). The default is 1 (effectively disabling the limit).
 * @property {number} [keepaliveTimeout] - Destroys the browser if it has been unresponsive for the given number of
 *                                         milliseconds. Use 0 to disable.
 * @property {string[]} [crashOn] - DEPRECATED and DISCOURAGED. DO NOT USE THIS IN NEW CODE! Crash the page on the
 *                                  given events. Workaround for issue #391 until #392 is properly addressed.
 *
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
        await whisker._configurePage();
        await whisker._loadWhiskerWeb();
        await whisker.enableKeepaliveWatchdog();
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
         * The current memory usage of the page.
         * @type {MemoryUsage|null}
         * @private
         */
        this._memory = null;

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
         * The time (in milliseconds since epoch) the keepalive watchdog timer last fired (if it is enabled).
         * @type {number}
         * @private
         */
        this._lastKeepaliveTime = 0;

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

        /**
         * Tells whether the resource is no longer operational. If `true`, it's not safe to do anything with the browser
         * or its pages anymore. The variable will be set to `true` when destruction is imminent, it is also `true`
         * while destruction is in progress, and it remains `true` after the resource is destroyed.
         * @type {boolean}
         * @private
         */
        this._destroyed = false;
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
            const message = `Whisker Web #${this._id}: ${this._reason}:`;

            // Workaround for #391.
            if (this._pool._crashOn.includes("error")) {
                logger.error(message, "DELIBERATELY CRASHING WHISKER!");
                throw error;
            }

            logger.error(message, error);
        }).on('pageerror', (error) => {
            this._reason = "Uncaught error in page";
            const message = `Whisker Web #${this._id}: ${this._reason}:`;

            // Workaround for #391.
            if (this._pool._crashOn.includes("pageerror")) {
                logger.error(message, "DELIBERATELY CRASHING WHISKER!");
                throw error;
            }

            logger.error(message, error);
        });

        forwardConsoleMessages(this._page, this._id);

        // Set navigation timeout to 5 min. See issue #241 and MR !443.
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

        // Page initialization code specific to the current Whisker subcommand.
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

    get memory() {
        return this._memory;
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
    disableKeepaliveWatchdog() {
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

        this._lastKeepaliveTime = Date.now();

        if (this._keepaliveWatchdog !== null) {
            // The timer is already running -> Just restart it.
            this._keepaliveWatchdog = this._keepaliveWatchdog.refresh();
            return;
        }

        // This is the first time invoking keepAlive(). The timer has not been started yet -> We do this below.
        this._keepaliveWatchdog = setTimeout(async () => {

            /*
             * Workaround for issue #419, see MR !637:
             * If the JS event loop of Node.js is blocked, e.g., due to heavy workloads like offspring generation in
             * automatic repair using structural mutation, the communication with individual browsers is also blocked.
             * As a result, resetting the keepalive timer via keepAlive() will not have an effect during that time, such
             * that it might expire, even though the corresponding browser is still functional. To avoid shutting the
             * browser down prematurely in such cases, we delay the execution until a few ticks of the JS event loop,
             * which is what the line below does. This gives blocked keepAlive() calls a chance to run first.
             */
            await new Promise((resolve) => setTimeout(resolve, 10));

            if (Date.now() - this._lastKeepaliveTime < this._pool._keepaliveTimeout) {
                // A keepAlive() call was blocked. Shutting down the browser would be a mistake. Do nothing and return.
                return;
            }

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
            if (this._destroyed) { // To avoid issue #399.
                return;
            }

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
        if (this._destroyed) { // To avoid issue #385 and other race conditions.
            return;
        }

        this._destroyed = true;

        logger.info(`Destroying Whisker #${this._id}`);

        this.disableKeepaliveWatchdog();
        this.disableEvaluationTimeout();

        try {
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
        if (this._destroyed) {
            return false;
        }

        if (this._useCount >= this._pool._ttl) {
            logger.info(`Whisker #${this._id} reached its end of life (had ${this._useCount} uses)...`);
            return false;
        }

        this._useCount++;

        if (this._page.isClosed()) {
            return false;
        }

        if (this._memory !== null && this._pool._memThreshold < 1) {
            const usage = this._memory.used / this._memory.max;

            if (usage > this._pool._memThreshold) {
                logger.info(`Whisker #${this._id} exceeded the allowed memory usage...`);
                return false;
            }
        }

        return true;
    }

    async _updateMemoryUsage() {
        this._memory = null;

        if (this._destroyed) {
            return;
        }

        try {
            // https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory
            this._memory = await this._page.evaluate(() => {
                const memory = window.performance.memory;

                if (!memory) {
                    return null;
                }

                const {usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit} = memory;
                return Object.freeze({ // Freeze to avoid clients tampering with the values.
                    used: Math.round(usedJSHeapSize / 1024 / 1024),
                    alloc: Math.round(totalJSHeapSize / 1024 / 1024),
                    max: Math.round(jsHeapSizeLimit / 1024 / 1024),
                });
            });
        } catch (e) {
            // This can happen when the page is already crashed/frozen/closed, similar to issue #384.
            logger.warn(`Whisker #${this._id}: Error fetching memory usage:`, e);
        }
    }

    _printMemoryUsage() {
        if (this._memory === null) {
            logger.debug(`Whisker #${this._id} memory usage unavailable`);
            return;
        }

        const {used, alloc, max} = this._memory;

        // It should hold that used <= alloc <= max.
        logger.debug(`Whisker #${this._id} memory: ` + [
            `used ${used} MiB (${Math.round(used / max * 100)} %)`,
            `alloc ${alloc} MiB (${Math.round(alloc / max * 100)} %)`,
            `limit at ${max} MiB (100 %)`,
        ].join(", "));
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
    memThreshold: 1,
    initWhiskerOnce: (_whisker) => {
        /* noop, but users can provide a custom function. */
    },
    crashOn: [], // Deprecated.
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
         * How many resources the pool should contain at any given time.
         * @type {number}
         * @private
         */
        this._whiskers = opts.whiskers;

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
         * How much amount (in percent) of the maximum allocatable heap memory the resource may consume before it will
         * be destroyed.
         * @type {number}
         * @private
         */
        this._memThreshold = Math.min(1, Math.max(Number.MIN_VALUE, opts.memThreshold)); // Clamp value to interval (0, 1].

        if (opts.crashOn.length > 0) {
            logger.warn("The `crashOn` option is deprecated. Please see issue #392 how to fix this.");
        }

        /**
         * DISCOURAGED. Which events the browser should crash on. Workaround for issue #391 (please see #392 what to do
         * instead.) Should always be the empty array. Legacy code often uses `["error", "pageerror"]`. Other events are
         * not supported.
         * @deprecated
         * @type {string[]}
         * @private
         */
        this._crashOn = [...opts.crashOn];

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

        /**
         * Contains all resources that are currently in the pool. Since `generic-pool` doesn't expose this, we have to
         * manage it ourselves. Should only be used for bookkeeping, not to implement any business logic!
         * @type {Set<Whisker>}
         * @private
         */
        this._resources = new Set();
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
        this._resources.add(whisker);
        return whisker;
    }

    _printMemoryUsage() {
        if (this._whiskers < 2) {
            return;
        }

        const {used, alloc, max, unk} = [...this._resources].reduce((z, r) => {
            const m = r.memory;

            if (m === null) {
                return {...z, unk: z.unk + 1};
            }

            return {
                used: z.used + m.used,
                alloc: z.alloc + m.alloc,
                max: z.max + m.max,
                unk: z.unk,
            };
        }, {used: 0, alloc: 0, max: 0, unk: 0});

        // MR !582:
        // ? = Number of browsers for which memory consumption could not be retrieved
        // # = Number of browsers that currently exist
        // T = Total number of browsers that the pool should maintain
        logger.debug(`Whiskers total memory (? ${unk}, # ${this._resources.size}, T ${this._whiskers}): ` + [
            `used ${used} MiB (${Math.round(used / max * 100)} %)`,
            `alloc ${alloc} MiB (${Math.round(alloc / max * 100)} %)`,
            `limit at ${max} MiB (100 %)`,
        ].join(", "));
    }

    /**
     * Destroys the given resource.
     * @param whisker {Whisker} The resource to destroy.
     * @return {Promise<void>}
     */
    destroy(whisker) {
        this._resources.delete(whisker);

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
     * @param {Whisker|null} whisker The resource to hand back.
     * @return {Promise<void>}
     */
    async release(whisker) {
        if (whisker === null || whisker._destroyed) { // To handle race conditions with destroy(), see issue #390.
            return;
        }

        // The timings are only relevant on first use. Afterward, the browser is already opened and Whisker Web already
        // loaded. Hence, reset them to 0 for all subsequent uses.
        whisker._timings.openBrowser = 0;
        whisker._timings.loadWhiskerWeb = 0;

        whisker.reason = null;
        whisker.disableEvaluationTimeout();

        if (whisker.page.isClosed()) {
            if (subcommand !== "open") { // When using "open", it's fine if the window is closed manually.
                logger.warn([
                    `It seems you closed the page for Whisker #${whisker.id} manually.`,
                    'It is generally not recommended to do so, because it prevents reusing the page objects.',
                    'Please check your code for unintended operations such as "page.close()" to avoid this warning.',
                ].join("\n"));
            }
        } else {
            await whisker._updateMemoryUsage();
        }

        if (this._pool.isBorrowedResource(whisker)) {
            await this._pool.release(whisker);
        }

        whisker._printMemoryUsage();
        this._printMemoryUsage();
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
            const prefix = whisker === null ? "" : `Whisker #${whisker.id}: `;
            logger.error(`${prefix}Callback error:`, e);
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
