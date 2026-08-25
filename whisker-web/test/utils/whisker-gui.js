/**
 * Helpers for driving the Whisker Web GUI from Puppeteer-based tests.
 *
 * These wrap the GUI interactions that every test suite needs before it can start a search or a
 * test run. Keeping them in one place means a UI change only has to be tracked down once.
 *
 * All helpers operate on the `page` global provided by jest-puppeteer.
 */

const fileUrl = require('file-url');
const path = require('path');
const fs = require('fs');

// FIXME: this global variable is actually defined in jest.config.js, but for some reason it is "undefined" here.
const URL = 'dist/index.html';

const ACCELERATION = Infinity;

/**
 * Uploads a file into one of the GUI's file inputs.
 *
 * Both a missing fixture and a missing input are reported explicitly, since Puppeteer would
 * otherwise fail with a hard to interpret error further down the line.
 *
 * @param {string} selector CSS selector of the file input to fill
 * @param {string} filePath path to the file to upload
 */
async function uploadFile(selector, filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`The file ${filePath} does not exist!`);
    }

    const input = await page.$(selector);
    if (input === null) {
        throw new Error(`The GUI has no file input matching ${selector}!`);
    }

    await input.uploadFile(filePath);
}

/**
 * Switches to the project tab via the redesigned tab bar, which also runs the project layout pass.
 *
 * Block-based tests need this: the layout pass calls `configPanel.switchToMode`, which reveals
 * `#bbt-toggles` (`src/components/config-panel.js:190`) -- without it a run never reports
 * completion.
 *
 * Not a general-purpose "open the project tab" helper, and no other suite should need it. The
 * project pane is already active on load, and the layout pass additionally resets
 * `window._whiskerSelectedConfig` to the `config/mio.json` default (`config-panel.js:183`), which
 * would silently discard a config the test just uploaded. It is safe here only because block-based
 * tests upload no config of their own.
 *
 * The click is dispatched through the DOM because the legacy tab bar sits off-screen since the
 * redesign; Puppeteer's own `click()` simulates a real mouse click and cannot reach elements
 * outside the viewport.
 */
async function openProjectTabWithLayout() {
    const projectTab = await page.$('#whisker-tab-search');
    await projectTab.evaluate(t => t.click());
}

/**
 * Sets the acceleration factor the project is executed with.
 *
 * @param {number} [factor] the acceleration factor
 */
async function setAcceleration(factor = ACCELERATION) {
    await page.evaluate(f => {
        document.querySelector('#acceleration-value').innerText = f;
    }, factor);
}

/**
 * Uploads a project together with the optional tests and models belonging to it, and sets the
 * acceleration factor.
 *
 * No tab switch is needed: the project pane is markup-default "show active" (`src/index.html:275`)
 * and nothing in these suites switches away from it.
 *
 * @param {string} scratchPath path to the .sb3 project under test
 * @param {object} [options] what to upload alongside the project, and how to run it
 * @param {string} [options.tests] path to the test file belonging to the project
 * @param {string} [options.models] path to the model file belonging to the project
 * @param {number} [options.acceleration] the acceleration factor
 */
async function loadProject(scratchPath, {tests, models, acceleration = ACCELERATION} = {}) {
    await uploadFile('#fileselect-project', scratchPath);

    if (tests) {
        await uploadFile('#fileselect-tests', tests);
    }

    if (models) {
        await uploadFile('#fileselect-models', models);
    }

    await setAcceleration(acceleration);
}

/**
 * Opens a fresh browser page showing the Whisker GUI, and points the `page` global at it.
 *
 * `catchPageErrors` records existing drift rather than a deliberate policy: most suites install
 * these handlers, while BranchDistance, runTestsForRepair and the model tests never did. The flag
 * can be dropped once those three have been checked for latent page errors.
 *
 * @param {object} [options] how to set the page up
 * @param {boolean} [options.catchPageErrors] whether to fail the test when the page reports an error
 */
async function openWhiskerPage({catchPageErrors = true} = {}) {
    // The prettify.js file keeps running into a null exception when puppeteer opens a new page.
    // Since this is a purely visual feature and does not harm the test execution in any way,
    // we simply remove the file when calling the servant.
    const prettifyPath = path.resolve(__dirname, '../../dist/includes/prettify.js');
    if (fs.existsSync(prettifyPath)) {
        fs.unlinkSync(prettifyPath);
    }

    await jestPuppeteer.resetBrowser();
    page = await browser.newPage();

    if (catchPageErrors) {
        page.on('error', msg => console.error(msg.text()))
            .on('pageerror', async err => {
                console.error(err.message);
                // Not very graceful, but immediately shuts the test down. There must be a nicer way?
                await page.close();
                return Promise.reject(err);
            });
    }

    await page.goto(fileUrl(URL), {waitUntil: 'domcontentloaded'});

    // `domcontentloaded` fires before the bundle has run its $(document).ready handler, which is what
    // populates `window.Whisker` and binds the click handlers (`src/index.js:1590`). Interacting
    // before that finishes is silently destructive rather than loud: clicking Run with
    // `Whisker.projectFileSelect` still undefined just opens a modal and starts no search
    // (`src/index.js:1373`), so the suite then polls an empty output log until it times out.
    await page.waitForFunction(() => window.Whisker && window.Whisker.projectFileSelect &&
        window.Whisker.configFileSelect);
}

module.exports = {
    ACCELERATION,
    loadProject,
    openWhiskerPage,
    openProjectTabWithLayout,
    setAcceleration,
    uploadFile
};
