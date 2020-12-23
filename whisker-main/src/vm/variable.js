const ScratchVariable = require('scratch-vm/src/engine/variable');

class Variable {
    constructor (variable, sprite) {

        /**
         * @type {ScratchVariable}
         * @private
         */
        this._variable = variable;

        /**
         * @type {RenderedTarget}
         * @private
         */
        this._sprite = sprite;

        /**
         * @type {Object}
         * @private
         */
        this._old = {};
    }

    /**
     * @returns {string} .
     */
    get name () {
        return this._variable.name;
    }

    /**
     * @returns {number|number[]} .
     */
    get value () {
        if (this._variable.type === ScratchVariable.SCALAR_TYPE) {
            return this._variable.value;
        } else if (this._variable.type === ScratchVariable.LIST_TYPE) {
            return [...this._variable.value];
        }
        return null;
    }

    /**
     * @returns {object} .
     */
    get old () {
        return {...this._old};
    }

    /**
     * @returns {object} .
     */
    get sprite () {
        return this._sprite;
    }

    /**
     * @returns {ScratchVariable} .
     */
    getScratchVariable () {
        return this._variable;
    }

    updateOld () {
        this._old.value = this.value;
    }
}

module.exports = Variable;
