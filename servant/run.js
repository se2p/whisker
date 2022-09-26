const fs = require("fs");
const logger = require("./logger");
const {modelPath, csvFile} = require("./cli").opts;
const {runTestsOnFile, getProjectsInScratchPath} = require("./common");
const os = require("os");

// Standard TestSuite / Model-based testing
async function run(openNewPage) {
    const csvs = [];

    for (const project of getProjectsInScratchPath()) {
        logger.info(`Testing project ${project}`);
        csvs.push(...await runTestsOnFile(openNewPage, project, modelPath));
    }

    if (csvFile) {
        console.info(`Creating CSV summary in ${csvFile}`);
        fs.writeFileSync(csvFile, removeDuplicateHeaders(csvs).join(os.EOL));
    }
}

function removeDuplicateHeaders([first, ...rest]) {
    const [firstHeader, firstData] = first.split('\n');
    const restData = rest.map((headerAndData) => {
        // eslint-disable-next-line no-unused-vars
        const [_header, data] = headerAndData.split('\n');
        return data;
    });
    return [firstHeader, firstData, ...restData];
}

module.exports = run;
