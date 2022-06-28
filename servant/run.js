const fs = require("fs");
const logger = require("./logger");
const {resolve} = require("path");
const {scratchPath, modelPath, csvFile} = require("./cli").opts;
const {runTestsOnFile} = require("./common");

// Standard TestSuite / Model-based testing
async function run(page) {
    const csvs = [];

    for (const project of getProjectsInScratchPath()) {
        logger.info(`Testing project ${project}`);
        csvs.push(...await runTestsOnFile(page, project, modelPath));
    }

    if (csvFile) {
        console.info(`Creating CSV summary in ${csvFile}`);
        fs.writeFileSync(csvFile, csvs[0]);
    }
}

function getProjectsInScratchPath() {
    const {path, isDirectory} = scratchPath;

    if (!isDirectory) {
        return [path];
    }

    return fs.readdirSync(path)
        .filter((file) => file.endsWith(".sb3"))
        .map((file) => resolve(path, file));
}

module.exports = run;
