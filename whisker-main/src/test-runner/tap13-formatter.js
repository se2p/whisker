const Test = require('./test');
const yaml = require('js-yaml');

const TAP13Formatter = {
    /**
     * @param {object} description .
     * @return {string} .
     */
    descriptionToYAML(description) {
        return [
            '  ---',
            yaml.dump(description)
                .trim()
                .replace(/^/mg, '  '),
            '  ...'
        ].join('\n');
    },

    /**
     * @param {object} extra .
     * @return {string} .
     */
    extraToYAML(extra) {
        return yaml.dump(extra)
            .trim()
            .replace(/^/mg, '# ');
    },

    /**
     * @param {object} summaries .
     * @return {object} .
     */
    mergeFormattedSummaries(summaries) {
        return summaries.reduce((mergedSummary, summary) => {
            Object.keys(summary).forEach(key => {
                if (mergedSummary[key]) {
                    mergedSummary[key] += summary[key];
                } else {
                    mergedSummary[key] = summary[key];
                }
            });

            return mergedSummary;
        }, {});
    },

    /**
     * Generates an object that contains a summary of the test results.
     * @param {{string: TestResult[]}} summaryRecord .
     * @return {object} .
     */
    formatSummary(summaryRecord) {
        const formattedSummary = {};
        for (const [projectName, summary] of Object.entries(summaryRecord)) {
            formattedSummary[projectName] = {};
            if (summary.length > 0 && summary[0].test !== undefined) {
                const tests = summary.length;
                const passedResults = summary.filter(result => result.status === Test.PASS);
                const pass = passedResults.length;
                const passedTests = passedResults.length > 0 ? passedResults.map(result => result.test.name) : "None";
                const failedResults = summary.filter(result => result.status === Test.FAIL);
                const fail = failedResults.length;
                const failedTests = failedResults.length > 0 ? failedResults.map(result => result.test.name) : "None";
                const errorResults = summary.filter(result => result.status === Test.ERROR);
                const error = errorResults.length;
                const errorTests = errorResults.length > 0 ? errorResults.map(result => result.test.name) : "None";
                const skippedResults = summary.filter(result => result.status === Test.SKIP);
                const skip = skippedResults.length;
                const skippedTests = skippedResults.length > 0 ? skippedResults.map(result => result.test.name) : "None";

                formattedSummary[projectName][`passed Tests (${pass})`] = passedTests;
                formattedSummary[projectName][`failed Tests (${fail})`] = failedTests;
                formattedSummary[projectName][`error Tests (${error})`] = errorTests;
                formattedSummary[projectName][`skipped Tests (${skip})`] = skippedTests;
            }

            // Check if we have model-based results and add them to the result object if necessary.
            let modelResults = false;
            const allErrors = [];
            const allFails = [];
            summary.forEach(result => {
                if (result.modelResult) {
                    modelResults = true;
                    if (result.modelResult.fails.length > 0) {
                        allFails.push(result.modelResult.fails);
                    }
                    if (result.modelResult.errors.length > 0) {
                        allErrors.push(result.modelResult.errors);
                    }
                }
            });

            let uniqueFails = [...new Set(allFails)];
            const nUniqueFails = uniqueFails.length;
            let uniqueErrors = [...new Set(allErrors)];
            const nUniqueErrors = uniqueErrors.length;

            uniqueFails = nUniqueFails > 0 ? uniqueFails.sort((a, b) => a - b) : "None";
            uniqueErrors = nUniqueErrors > 0 ? uniqueErrors.sort((a, b) => a - b) : "None";
            if (modelResults) {
                formattedSummary[projectName][`modelFails (${nUniqueFails})`] = uniqueFails;
                formattedSummary[projectName][`modelErrors (${nUniqueErrors})`] = uniqueErrors;
            }
        }

        return formattedSummary;
    },

    /**
     * @param {object} coveragePerSprite .
     * @return {object} .
     */
    formatCoverage(coveragePerSprite) {
        // const individualCoverage = coverage.getCoveragePerSprite();
        // const combinedCoverage = coverage.getCoverage();

        let covered = 0;
        let total = 0;

        const formattedCoverage = {};
        for (const spriteName of Object.keys(coveragePerSprite)) {
            const coverageRecord = coveragePerSprite[spriteName];
            covered += coverageRecord.covered;
            total += coverageRecord.total;
            formattedCoverage[spriteName] = this.formatCoverageRecord(coverageRecord);
        }

        return {
            combined: this.formatCoverageRecord({covered, total}),
            individual: formattedCoverage
        };
    },

    /**
     * @param {Map|{}} coveragePerModel .
     * @return {object} .
     */
    formatModelCoverage(coveragePerModel) {
        let covered = 0;
        let total = 0;

        const formattedCoverage = {};
        for (const modelName of Object.keys(coveragePerModel)) {
            const coverageRecord = coveragePerModel[modelName];
            covered += coverageRecord.covered.length;
            total += coverageRecord.total;
            formattedCoverage[modelName] =
                this.formatCoverageRecord({covered: coverageRecord.covered.length, total: coverageRecord.total});
        }

        return {
            combined: this.formatCoverageRecord({covered, total}),
            individual: formattedCoverage
        };
    },

    /**
     * Format model coverage for one repetition.
     * @param {Map|{}} coveragePerModel .
     * @return {object} .
     */
    formatModelCoverageLastRun(coveragePerModel) {
        let covered = 0;
        let total = 0;

        const formattedCoverage = {};
        for (const modelName of Object.keys(coveragePerModel)) {
            const coverageRecord = coveragePerModel[modelName];
            covered += coverageRecord.covered.length;
            total += coverageRecord.total;
            formattedCoverage[modelName] =
                this.formatCoverageRecord({covered: coverageRecord.covered.length, total: coverageRecord.total});
        }

        return {
            combined: this.formatCoverageRecord({covered, total})
        };
    },


    /**
     * @param {object} coverageRecord .
     * @return {string} .
     */
    formatCoverageRecord(coverageRecord) {
        const {covered, total} = coverageRecord;
        let percentage;
        if (total === 0) {
            percentage = NaN;
        } else {
            percentage = (covered / total).toFixed(2);
        }
        return `${percentage} (${covered}/${total})`;
    },
};

module.exports = TAP13Formatter;
