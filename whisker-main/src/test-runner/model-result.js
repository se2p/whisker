/**
 * @typedef CoverageResult
 * @type {object}
 * @property {number} total
 * @property {string[]} covered
 */

export class ModelResult {
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
     * Returns this result in a csv representation.
     * @return {string}
     */
    getCsvColumnsAsString() {
        return this.getCsvColumns().join(",");
    }

    /**
     * Returns this object as a tuple containing all values given in the header.
     * @return {[number,number,number,number]}
     */
    getCsvColumns() {
        let achievedModelCoverage = 0;
        let totalModelCoverage = 0;
        for (const coverages of Object.values(this.coverage)) {
            achievedModelCoverage += coverages.covered.length;
            totalModelCoverage += coverages.total;
        }
        const coverageRate = Math.round((achievedModelCoverage / totalModelCoverage) * 100) / 100;
        return [this.testNbr ?? 1, this.fails.length, this.errors.length, coverageRate];
    }
}

export const modelCsvHeader = ",modelRepetition,modelFails,modelErrors,modelCoverage";
