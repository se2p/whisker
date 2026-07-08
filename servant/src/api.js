const Whiskers = require("./whiskers");
const express = require("express");
const os = require("node:os");
const logger = require("./logger");
const fileUpload = require("express-fileupload");
const {runTests} = require("./common");

const app = express();
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles : true,
    tmpFileDir: os.tmpdir(),
}));

const opts = require("./cli").opts;

async function configureWhiskerWebInstance(page, testPath) {
    try {
        await (await page.$('#fileselect-tests')).uploadFile(testPath);
    } catch (e) {
        logger.error(e);
    }
}

async function handleRunTestRequest(pool, req, res) {
    const testSuite = req.files.testsuite.tempFilePath;
    const project = req.files.project.tempFilePath;

    const whisker = await pool.acquire();

    try {
        await configureWhiskerWebInstance(whisker.page, testSuite);
        const result = await runTests(whisker, project);
        if (result === undefined) {
            res.status(500).send({message: "Whisker crashed"});
        }
        const resultReduced = extractTestResults(result);
        res.send(resultReduced);
    } catch (e) {
        res.status(500).send({message: "Whisker crashed", error: e});
    } finally {
        await pool.release(whisker);
    }
}

async function startServer(pool) {
    pool.start();

    /*
     * Expects a POST request with two files:
     * - `project`: an SB3 file for the program to test
     * - `testsuite`: a JS file with the Whisker test suite
     */
    app.post("/test", async (req, res) => {
        await handleRunTestRequest(pool, req, res);
    })

    return app.listen(opts.port, () => {
       logger.info(`Listening on port ${opts.port}`);
    });
}

function extractTestResults(whiskerResult) {
    const projectName = Object.keys(whiskerResult.summary)[0];
    return whiskerResult.summary[projectName]
        .map((t) => t.test)
        .map((testResult) => {
            return {
                name: testResult.name,
                index: testResult.index,
                result: testResult.testResultClass,
            };
        });
}

async function init() {
    const localOpts = {
        whiskers: opts.numberOfJobs ?? 1,
        keepaliveTimeout: 5000,
    }

    const pool = new Whiskers(localOpts);
    const server = await startServer(pool);

    // we cannot directly perform async operations in the event handlers (ie the
    // node process exits before the Chrome instances are stopped), but with the
    // following workaround it seems to work
    process.on("uncaughtException", async () => {
        server.close(async () => {
            await pool.shutdown();
        });
    });
    ["SIGTERM", "SIGINT"].forEach(event => {
        process.on(event, () => {
            throw new Error(event);
        });
    });
}

module.exports = init;
