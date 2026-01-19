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
         * @type {Object.<string, ModelCoverageResult>}
         */
        this.coverage = {};
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
     * Returns this object as a tuple containing all values given in the header.
     * @return {[number,number,number,number,number]}
     */
    getCsvColumns() {
        const [current, repetition, total, edgeCount] = Object.values(this.coverage).reduce(([curr, rep, total, edges], covObj) =>
            [curr + covObj.covered, rep + covObj.repetitionCovered, total + covObj.totalCovered, edges + covObj.total], [0, 0, 0, 0]);
        const singleCov = toCoverageValue(current, edgeCount);
        const repetitionCov = toCoverageValue(repetition, edgeCount);
        const totalCov = toCoverageValue(total, edgeCount);
        return [this.fails.length, this.errors.length, singleCov, repetitionCov, totalCov];
    }
}

function toCoverageValue(sum, total) {
    return Math.round((sum / total) * 100) / 100;
}

export const modelCsvHeader = ",modelFails,modelErrors,modelCoverage,repetitionModelCoverage,totalModelCoverage";

/**
 * Converts the result into the data for the csv file. If no valid result but instead null/ undefined,
 * all values of the returned tuple will be {@linkcode defaultValue}.
 * @param result
 * @param defaultValue
 * @return {string|*[]}
 */
export function modelResultToCsvData(result, defaultValue = null) {
    return result ? result.getCsvColumns() : [defaultValue, defaultValue, defaultValue, defaultValue, defaultValue];
}
