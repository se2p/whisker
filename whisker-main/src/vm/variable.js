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
     * Returns the current value of this Scratch variable, converted to a string. If the Scratch variable is a list,
     * its elements are converted to strings before returning the list. In case you know the contents of the variable
     * are numeric, you might want to use {@link valueAsNumber} instead.
     *
     * @returns {null|string|string[]} the value of the variable
     * @see valueAsNumber
     */
    get value () {
        if (this._variable.type === ScratchVariable.SCALAR_TYPE) {
            return String(this._variable.value);
        } else if (this._variable.type === ScratchVariable.LIST_TYPE) {
            return this._variable.value.map((v) => String(v));
        }
        return null; // This should never happen (?)
    }

    /**
     * Returns the current value of this Scratch variable, converted to a number. If the Scratch variable is a list,
     * its elements are converted to numbers before returning the list. This getter should only be used if you are
     * certain this variable is numeric: In these cases, it improves the readability of Whisker tests because manual
     * type conversions are no longer necessary. In all other cases, it might not be possible to convert the value to
     * a number, in which case `NaN` (not a number) is returned.
     *
     * @returns {*|number|null} The numeric value of the variable
     * @see value
     */
    get valueAsNumber () {
        if (this._variable.type === ScratchVariable.SCALAR_TYPE) {
            return Number(this._variable.value);
        } else if (this._variable.type === ScratchVariable.LIST_TYPE) {
            return this._variable.value.map((v) => Number(v));
        }
        return null; // This should never happen (?)
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
