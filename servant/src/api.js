const Whiskers = require("./whiskers");
const express = require("express");
const fs = require("node:fs");
const os = require("node:os");
const logger = require("./logger");
const fileUpload = require("express-fileupload");
const {runTests} = require("./common");
const {uploadFile} = require("./whisker-web");

const opts = require("./cli").opts;

async function configureWhiskerWebInstance(page, testPath) {
    try {
        await uploadFile(page, '#fileselect-tests', testPath);
    } catch (e) {
        logger.error(e);
    }
}

async function handleRunTestRequest(pool, req, res) {
    const testSuite = req.files?.testsuite?.tempFilePath;
    const project = req.files?.project?.tempFilePath;
    if (!testSuite || !project) {
        res.status(400).send({message: "Expected the files `project` and `testsuite`"});
        return;
    }

    const whisker = await pool.acquire();

    try {
        await configureWhiskerWebInstance(whisker.page, testSuite);
        const result = await runTests(whisker, project);
        if (result === undefined) {
            res.status(500).send({message: "Whisker crashed"});
            return;
        }
        const resultReduced = extractTestResults(result);
        res.send(resultReduced);
    } catch (e) {
        // An Error has no enumerable properties, so sending it as is would result in an empty object.
        res.status(500).send({message: "Whisker crashed", error: String(e)});
    } finally {
        await pool.release(whisker);
    }
}

function deleteUploadedFiles(files) {
    for (const file of Object.values(files ?? {}).flat()) {
        fs.rmSync(file.tempFilePath, {force: true});
    }
}

function createApp(pool) {
    const app = express();
    app.use(fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
        abortOnLimit: true,
        useTempFiles: true,
        tempFileDir: os.tmpdir(),
    }));

    /*
     * Expects a POST request with two files:
     * - `project`: an SB3 file for the program to test
     * - `testsuite`: a JS file with the Whisker test suite
     */
    app.post("/test", async (req, res) => {
        try {
            await handleRunTestRequest(pool, req, res);
        } finally {
            // express-fileupload only deletes the temporary files of failed uploads.
            deleteUploadedFiles(req.files);
        }
    })

    return app;
}

async function startServer(pool) {
    pool.start();

    return createApp(pool).listen(opts.port, () => {
       logger.info(`Listening on port ${opts.port}`);
    });
}

function extractTestResults(whiskerResult) {
    const projectName = Object.keys(whiskerResult.summary)[0];
    const testResults = whiskerResult.summary[projectName]
        .map(summary => summary.test)
        .map(testResult => ({
            name: testResult.name,
            index: testResult.index,
            result: testResult.testResultClass,
        }));

    return {
        testResults,
        coverage: extractCoverage(whiskerResult.coverage),
    };
}

function extractCoverage(coverage) {
    const coveredBlockIds = new Set();
    for (const blockIds of coverage.coveredBlockIdsPerSprite.values()) {
        blockIds.forEach(blockId => coveredBlockIds.add(blockId));
    }

    const blockIds = new Set();
    for (const spriteBlockIds of coverage.blockIdsPerSprite.values()) {
        spriteBlockIds.forEach(blockId => blockIds.add(blockId));
    }

    return {
        covered: coveredBlockIds.size,
        total: blockIds.size,
    };
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
module.exports.createApp = createApp;
