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

        // There can only be multiple headers if there is more than one csv result.
        if (csvs.length > 1) {
            fs.writeFileSync(csvFile, removeDuplicateHeaders(csvs).join('\n'));
        } else {
            fs.writeFileSync(csvFile, csvs.toString());
        }
    }
}

function removeDuplicateHeaders([first, ...rest]) {
    const [firstHeader, firstData] = first.split('\n');
    const columnCount = firstData.split(',').length;
    const restData = rest.map((headerAndData) => {
        // If test execution gets interrupted, e.g. due to an out-of-memory issue, we may face undefined csv data value.
        if (headerAndData === undefined) {
            // Fill with undefined values to mark interrupted test execution in data.
            return Array(columnCount).fill('undefined');
        } else {
            // eslint-disable-next-line no-unused-vars
            const [_header, data] = headerAndData.split('\n');
            return data;
        }
    });
    return [firstHeader, firstData, ...restData];
}

module.exports = run;
