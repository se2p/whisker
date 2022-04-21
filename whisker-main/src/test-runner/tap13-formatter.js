const Test = require('./test');
const yaml = require('js-yaml');

const TAP13Formatter = {
    /**
     * @param {object} description .
     * @return {string} .
     */
    descriptionToYAML (description) {
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
    extraToYAML (extra) {
        return yaml.dump(extra)
            .trim()
            .replace(/^/mg, '# ');
    },

    /**
     * @param {object} summaries .
     * @return {object} .
     */
    mergeFormattedSummaries (summaries) {
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
     * @param {{string: TestResult[]}} summary .
     * @return {object} .
     */
    formatSummary (summaryRecord) {
        const formattedSummary = {};
        for(const [projectName, summary] of Object.entries(summaryRecord)) {
            const tests = summary.length;
            const pass = summary.filter(result => result.status === Test.PASS).length;
            const fail = summary.filter(result => result.status === Test.FAIL).length;
            const error = summary.filter(result => result.status === Test.ERROR).length;
            const skip = summary.filter(result => result.status === Test.SKIP).length;
            let allErrors = [];
            let allFails = [];
            summary.forEach(result => {
                if (result.modelResult && result.modelResult.errors.length > 0) {
                    allErrors = [...allErrors, ...result.modelResult.errors];
                }
                if (result.modelResult && result.modelResult.fails.length > 0) {
                    allFails = [...allFails, ...result.modelResult.fails];
                }
            });
            let uniqueErrors = [...new Set(allErrors)];
            let uniqueFails = [...new Set(allFails)];
            let sort = (a, b) => {
                if (a < b) {
                    return -1;
                } else if (b < a) {
                    return 1;
                }
                return 0;
            };

            uniqueFails.sort(sort);
            uniqueErrors.sort(sort);
            formattedSummary[projectName] = {
                tests,
                pass,
                fail,
                error,
                skip,
                errors_in_model: uniqueErrors.length,
                errors_in_model_text: uniqueErrors,
                fails_in_model: uniqueFails.length,
                fails_in_model_text: uniqueFails
            };
        }

        return formattedSummary;
    },

    /**
     * @param {object} coveragePerSprite .
     * @return {object} .
     */
    formatCoverage (coveragePerSprite) {
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
    formatCoverageRecord (coverageRecord) {
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
