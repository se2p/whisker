class ModelResult {
    constructor() {
        /**
         * @type {?string}
         */
        this.status = null;

        /**
         * @type {string[]}
         */
        this.errors = [];

        /**
         * type {[key:string]:number}
         */
        this.coverage = {};

        /**
         * @type {any[]}
         */
        this.log = [];

        /**
         * @type {string[]}
         */
        this.edgeTrace = []

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
}

module.exports = ModelResult;
