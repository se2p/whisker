// eslint-disable-next-line node/no-extraneous-require
const Parser = require('tap-parser');
const csvStringify = require('csv-stringify/lib/sync');
const yaml = require('js-yaml');

const testNames = new Map();
const useNames = true; // use the names of tests instead of their id in the CSV header

const convertToCsv = function (str) {
    return new Promise((resolve, reject) => {
        const parser = new Parser();
        let modelErrors = new Set();
        let modelFails = new Set();
        const result = {
            passed: 0,
            failed: 0,
            error: 0,
            skip: 0,
            testResults: new Map()
        };

        parser.on('assert', test => {
            const status = test.ok ? 'pass' : test.diag.severity;

            if (!testNames.has(test.id)) {
                testNames.set(test.id, test.name);
            } else if (testNames.get(test.id) !== test.name) {
                console.error('Error: Inconsistent test names or test order between projects.');
                process.exit(1);
            }

            if (test.diag) {
                if (test.diag.modelErrors) {
                    test.diag.modelErrors.forEach(error => {
                        modelErrors.add(error);
                    })
                }
                if (test.diag.modelFails) {
                    test.diag.modelFails.forEach(error => {
                        modelFails.add(error);
                    })
                }
            }

            result.testResults.set(test.id, status);
            switch (status) {
            case 'pass':
                result.passed++;
                break;
            case 'fail':
                result.failed++;
                break;
            case 'error':
                result.error++;
                break;
            case 'skip':
                result.skip++;
                break;
            }
        });

        parser.on('complete', () => {
            result.modelFails = modelFails.size ? modelFails.size : 0;
            result.modelErrors = modelErrors.size ? modelErrors.size : 0;
            resolve(result);
        });

        parser.on('bailout', reason => {
            reject(reason);
        });

        parser.end(str);
        parser.push(null);
    });
}

const getCoverage = function (str) {
    let coverageString = str.split('# coverage:\n')[1];
    if (typeof coverageString === 'undefined') {
        return null;
    }

    coverageString = coverageString.replace(/^# /gm, '');
    const coverage = yaml.load(coverageString.split("modelCoverage")[0]);
    return coverage.combined.match(/(.*)\s\((\d+)\/(\d+)\)/)[1];
}

const getModelCoverage = function (str) {
    let coverageString = str.split('# modelCoverage:\n')[1];
    if (typeof coverageString === 'undefined') {
        return null;
    }

    coverageString = coverageString.replace(/^# /gm, '');
    const coverage = yaml.load(coverageString);
    return coverage.combined.match(/(.*)\s\((\d+)\/(\d+)\)/)[1];
}

const getName = function (str) {
    return str.match(/# project: (.*)\./)[1];
}

const tapToCsvRow = async function (str) {
    const row = await convertToCsv(str);

    const name = getName(str);
    const coverage = getCoverage(str);
    const modelCoverage = getModelCoverage(str, row);

    row.projectname = name;
    row.coverage = coverage;
    row.modelCoverage = modelCoverage;

    return row;
}

const rowsToCsv = function (rows, modelPath) {
    const csvHeader = [];
    csvHeader.push('projectname');
    csvHeader.push('duration');

    const sortedTests = Array.from(testNames.entries())
        .sort(x => x[0]);
    // array of map entries with [testId, testName], sorted by id

    for (const test of sortedTests) {
        if (useNames) {
            csvHeader.push(test[1]);
        } else {
            csvHeader.push(`test${test[0]}`);
        }
    }
    csvHeader.push('passed');
    csvHeader.push('failed');
    csvHeader.push('error');
    csvHeader.push('skip');
    csvHeader.push('coverage');

    // Only include model results if there was model-based testing involved
    if(modelPath) {
        csvHeader.push('modelErrors');
        csvHeader.push('modelFails');
        csvHeader.push('modelCoverage');
    }

    const csvBody = [csvHeader];
    for (const row of rows) {
        const csvLine = [];

        csvLine.push(row.projectname);
        csvLine.push(row.duration);
        for (const test of sortedTests) {
            if (row.testResults.has(test[0])) {
                csvLine.push(row.testResults.get(test[0]));
            } else {
                csvLine.push(null);
                console.error('Warning: Inconsistent test ids between projects.');
            }
        }

        csvLine.push(row.passed);
        csvLine.push(row.failed);
        csvLine.push(row.error);
        csvLine.push(row.skip);
        csvLine.push(row.coverage);

        // Only include model results if there was model-based testing involved
        if(modelPath) {

            const modelCoverageIDs = [];
            // model coverages
            for (const rowElementKey in rows[0]) {
                if (rowElementKey.toString().indexOf("ModelCoverage") !== -1) {
                    csvHeader.push(rowElementKey.toString());
                    modelCoverageIDs.push(rowElementKey.toString())
                }
            }

            csvLine.push(row.modelErrors);
            csvLine.push(row.modelFails);
            csvLine.push(row.modelCoverage);
            modelCoverageIDs.forEach(id => {
                csvLine.push(row[id]);
            })
        }

        csvBody.push(csvLine);
    }

    return csvStringify(csvBody);
}

module.exports = {convertToCsv, tapToCsvRow, rowsToCsv};
