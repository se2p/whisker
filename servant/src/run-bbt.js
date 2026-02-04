const fs = require("fs");
const logger = require("./logger");
const {testPath, output} = require("./cli").opts;
const {getProjectsInScratchPath} = require("./common");

async function getOutputLogWhenBBTTestsAreDone(page, clearLogAfterFinished = false) {
    const logOutput = await page.$('#output-log .output-content');

    while (true) {
        const log = await (await logOutput.getProperty('innerHTML')).jsonValue();

        if (log.includes('Block-Based Tests have finished!')) {

            if (clearLogAfterFinished) {
                await page.$eval('#output-log .output-content', logElement => logElement.innerHTML = '');
            }

            return log;
        }

        await new Promise(_ => setTimeout(_, 250));
    }
}

function analyzeLog(log) {
    const testNamesAndResults = [...log.matchAll(/^Block-Based Test "(.*)": Test Result: (.*?)$/gm)];

    let countPassing = 0;
    let countFailing = 0;
    let countTimeout = 0;

    for (const testNameAndResult of testNamesAndResults) {
        switch (testNameAndResult[2]) {
            case 'pass':
                countPassing++;
                break;
            case 'fail':
                countFailing++;
                break;
            case 'timeout':
                countTimeout++;
                break;
        }
    }

    return {
        testResults: testNamesAndResults,
        counters: {
            pass: countPassing,
            fail: countFailing,
            timeout: countTimeout
        }
    };
}

async function evaluateProjects(pool, projects, testPath) {
    const results = new Map();

    await Promise.all(projects.map((project) => pool.run(async ({page}) => {
        // prevent fancybox tooltip from opening
        await page.evaluate(() => {
            const tooltipLink = document.getElementById('project-contains-bbts-tooltip-link');
            const dummyLink = document.createElement('a');
            dummyLink.setAttribute('id', 'project-contains-bbts-tooltip-link')
            tooltipLink.replaceWith(dummyLink);
        });

        await (await page.$('#fileselect-tests')).uploadFile(testPath);

        logger.info(`Testing project: ${project}`);
        const start = Date.now();

        await (await page.$('#tabUpload')).click();
        await (await page.$('#fileselect-project')).uploadFile(project);
        await (await page.$('#tabProject')).click();
        await (await page.$('#run-all-tests')).click();

        const log = await getOutputLogWhenBBTTestsAreDone(page, true);
        const result = analyzeLog(log);
        result.project = project;
        results.set(project, result);

        let summaryString = "-----\n";
        summaryString += `Project: ${result.project}\n`;
        summaryString += `Duration: ${(Date.now() - start) / 1000} Seconds\n`;
        summaryString += `Total Tests: ${result.testResults.length}\n`;
        summaryString += `├─ Passing Tests: ${result.counters.pass}\n`;
        summaryString += `├─ Failing Tests: ${result.counters.fail}\n`;
        summaryString += `└─ Timed Out Tests: ${result.counters.timeout}\n`;

        logger.info(summaryString);
    })));

    return results;
}

function writeCsv(results) {
    logger.info(`Creating CSV summary in ${output}`);

    let headersWritten = false;

    results.forEach((result) => {
        let line = '';

        if (!headersWritten) {
            line += "\"Project Name\",";
            for (const testResult of result.testResults) {
                line += "\"" + testResult[1] + "\",";
            }
            line = line.slice(0, -1) + "\n";
            headersWritten = true;
        }

        line += "\"" + result.project + "\",";
        for (const testResult of result.testResults) {
            line += testResult[2] + ",";
        }
        line = line.slice(0, -1) + "\n";

        fs.writeFile(output, line, {encoding: "utf8", flag: "a"}, (err) => {
            if (err) {
                logger.error(err);
            }
        });
    });
}

async function testByBlockBasedTests(pool) {
    const projects = getProjectsInScratchPath();

    logger.info(`Testing ${projects.length} project(s) against the test file.`);
    const results = await evaluateProjects(pool, projects, testPath);

    if (output) {
        writeCsv(results);
    }
}

module.exports = testByBlockBasedTests;
