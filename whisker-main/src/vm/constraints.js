const {isAssertionError} = require('../util/is-error');

/**
 * Represents a constraint that has to be met by the whisker tests.
 */
class Constraint {
    constructor (constraints, callback, name) {

        /**
         * @type {Constraints} The given constraints this object is wrapping.
         * @private
         */
        this._constraints = constraints;

        /**
         * @type {Function} The given function that works as a callback.
         * @private
         */
        this._callback = callback;

        /**
         * @type {boolean} Indicates if this constraint is currently active.
         */
        this._active = false;

        /**
         * @type {?any} The given constraint name.
         */
        this.name = name;

        /**
         * @type {Error} The error message.
         */
        this.error = null;
    }

    /**
     * Executes the {@link Callback} function and throws an {@link AssertionError} if a {@link Constraint} is violated.
     * @returns {?AssertionError} Null or the thrown assertion error.
     */
    _check () {
        try {
            this._callback();
            return null;
        } catch (error) {
            this.error = error;
            if (isAssertionError(error)) {
                error.constraint = this.name ? this.name : '[no name]';
                return error;
            }
            throw error;
        }
    }

    /**
     * Re-adds this {@link Constraint} to the stored array.
     */
    enable () {
        this._constraints.reAddConstraint(this);
    }

    /**
     * Removes this {@link Constraint} from the stored array.
     */
    disable () {
        this._constraints.removeConstraint(this);
    }

    /**
     * Indicates if this {@link Constraint} is currently active.
     * @returns {boolean}
     */
    isActive () {
        return this._active;
    }
}

/**
 * Manages all constraints of a whisker test.
 */
class Constraints {

    /**
     * @param {VMWrapper} vmWrapper The currently used vm wrapper.
     */
    constructor (vmWrapper) {

        /**
         * @type {VMWrapper} The given vm wrapper.
         */
        this.vmWrapper = vmWrapper;

        /**
         * @type {Constraint[]} An array of stored constraints.
         */
        this.constraints = [];
    }

    /**
     * Performs a {@link Constraint} check of all currently stored constraints.
     * @returns {?AssertionError} Null or the thrown assertion error.
     */
    checkConstraints () {
        const constraintsToCheck = [...this.constraints];

        for (const constraint of constraintsToCheck) {
            if (constraint.isActive()) {
                const constraintError = constraint._check();

                if (constraintError) {
                    this.removeConstraint(constraint);
                    return constraintError;
                }
            }
        }
    }

    /**
     * Wraps a given {@link Function} into a new {@link Constraint} and adds it to the stored constraints array.
     * @param {Function} func The function to wrap.
     * @param {any=} name The constraint name.
     * @returns {Constraint} The newly created and added constraint.
     */
    addConstraint (func, name) {
        const constraint = new Constraint(this, func, name);
        constraint._active = true;
        this.constraints.push(constraint);
        return constraint;
    }

    /**
     * Enables and adds an already existing {@link Constraint} to the stored constraints array.
     * @param {Constraint} constraint The constraint to add.
     * @returns {Constraint} The added constraint.
     */
    reAddConstraint (constraint) {
        this.removeConstraint(constraint);
        constraint.error = null;
        constraint._active = true;
        this.constraints.push(constraint);
        return constraint;
    }

    /**
     * Disables and removes an existing {@link Constraint } from the stored constraints array.
     * @param {Constraint} constraint The constraint to remove.
     * @returns {boolean} true if the constraint was removed, false otherwise.
     */
    removeConstraint (constraint) {
        constraint._active = false;
        const index = this.constraints.indexOf(constraint);
        if (index !== -1) {
            this.constraints.splice(index, 1);
        }
        return index !== -1;
    }

    /**
     * Disables and removes all constraints from the stored array.
     */
    clearConstraints () {
        for (const constraint of this.constraints) {
            constraint._active = false;
        }
        this.constraints = [];
    }
}

module.exports = {
    Constraint,
    Constraints
};
