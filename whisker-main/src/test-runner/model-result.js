/**
 * @typedef CoverageResult
 * @type {object}
 * @property {number} total
 * @property {string[]} covered
 */

class ModelResult {
    constructor() {
        /**
         * @type {number}
         */
        this.testNbr = undefined;

        /**
         * @type {string[]}
         */
        this.errors = [];

        /**
         * @type {string[]}
         */
        this.fails = [];

        /**
         * @type {Object.<string, CoverageResult>}
         */
        this.coverage = {};

        /**
         * @type {string[]}
         */
        this.log = [];

        /**
         * @type {string[]}
         */
        this.edgeTrace = [];

        /**
         * States of the variables
         * @type {string[]}
         */
        this.state = [];
    }

    /**
     * @param {string} error
     */
    addError(error) {
        if (this.errors.indexOf(error) === -1) {
            this.errors.push(error);
        }
    }

    /**
     * @param {string} fail failed constraint / effect / time limit
     */
    addFail(fail) {
        if (this.fails.indexOf(fail) === -1) {
            this.fails.push(fail);
        }
    }

    /**
     * Extracts csv data from observed obtained model results.
     * @return {{repetition: number, fails: number, errors:number, coverage:number, generationAlgorithm: string}}
     * @private
     */
     extractModelCSVData() {
        let achievedModelCoverage = 0;
        let totalModelCoverage = 0;
        for (const coverages of Object.values(this.coverage)) {
            achievedModelCoverage += coverages.covered.length;
            totalModelCoverage += coverages.total;
        }
        const coverageRate = Math.round((achievedModelCoverage / totalModelCoverage) * 100) / 100;
        return {
            repetition: this.testNbr,
            fails: this.fails.length,
            errors: this.errors.length,
            coverage: coverageRate,
            generationAlgorithm: "None"     // We do not generate models automatically yet.
        };
    }
}

module.exports = ModelResult;
