const ScratchVariable = require('scratch-vm/src/engine/variable');

/**
 * Represents a {@link ScratchVariable} and gives the user basic functionality to access variable attributes in whisker
 * tests.
 */
class Variable {
    constructor (variable, sprite) {

        /**
         * @type {ScratchVariable} The scratch variable itself.
         * @private
         */
        this._variable = variable;

        /**
         * @type {RenderedTarget} The sprite the variable belongs to.
         * @private
         */
        this._sprite = sprite;

        /**
         * @type {Object} The old variable value.
         * @private
         */
        this._old = {};
    }

    /**
     * Gives back the name of the scratch variable.
     * @returns {string} The variable name.
     */
    get name () {
        return this._variable.name;
    }

    /**
     * Gives back the value of the scratch variable.
     * @returns {number|number[]} A number array if the variable is of type list, a single number otherwise.
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
     * Gives back the old value of the scratch variable.
     * @returns {object} The old variable.
     */
    get old () {
        return {...this._old};
    }

    /**
     * Gives back the corresponding {@link Sprite} the scratch variable belongs to.
     * @returns {object} The sprite of the variable.
     */
    get sprite () {
        return this._sprite;
    }

    /**
     * Gives back the scratch variable itself.
     * @returns {ScratchVariable} The variable.
     */
    getScratchVariable () {
        return this._variable;
    }

    /**
     * Replaces the old scratch variable value with the new value.
     */
    updateOld () {
        this._old.value = this.value;
    }

    setOldValue(value) {
        this._old.value = value;
    }
}

module.exports = Variable;
