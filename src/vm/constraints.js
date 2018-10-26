const isAssertionError = require('../util/is-assertion-error');

class Constraint {
    constructor (constraints, callback, name) {

        /**
         * @type {Constraints}
         * @private
         */
        this._constraints = constraints;

        /**
         * @type {Function}
         * @private
         */
        this._callback = callback;

        /**
         * @type {boolean}
         */
        this._active = false;

        /**
         * @type {?any}
         */
        this.name = name;

        /**
         * @type {Error}
         */
        this.error = null;
    }

    /**
     * @returns {?AssertionError} .
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

    enable () {
        this._constraints.addConstraint(this);
    }

    disable () {
        this._constraints.removeConstraint(this);
    }

    isActive () {
        return this._active;
    }
}

class Constraints {
    constructor (vmWrapper) {

        /**
         * @type {VMWrapper}
         */
        this.vmWrapper = vmWrapper;

        /**
         * @type {Constraint[]}
         */
        this.constraints = [];
    }

    /**
     * @returns {?AssertionError} .
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
     * @param {(Function|Constraint)} functionOrConstraint .
     * @param {any=} name .
     * @returns {Constraint} .
     */
    addConstraint (functionOrConstraint, name) {
        let constraint;

        if (functionOrConstraint instanceof Constraint) {
            constraint = functionOrConstraint;
            this.removeConstraint(constraint);
            constraint.error = null;
        } else {
            constraint = new Constraint(this, functionOrConstraint, name);
        }

        constraint._active = true;
        this.constraints.push(constraint);
        return constraint;
    }

    /**
     * @param {Constraint} constraint .
     * @returns {boolean} .
     */
    removeConstraint (constraint) {
        constraint._active = false;
        const index = this.constraints.indexOf(constraint);
        if (index !== -1) {
            this.constraints.splice(index, 1);
        }
        return index !== -1;
    }

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
