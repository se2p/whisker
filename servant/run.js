const fs = require("fs");
const logger = require("./logger");
const {modelPath, csvFile} = require("./cli").opts;
const {runTestsOnFile, getProjectsInScratchPath} = require("./common");

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

module.exports = run;
