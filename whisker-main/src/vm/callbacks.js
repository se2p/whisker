/**
 * Wrapper for all callback functions.
 */
class Callback {
    constructor (callbacks, callback, name, afterStep) {

        /**
         * @type {Callbacks} The stored callbacks.
         * @private
         */
        this._callbacks = callbacks;

        /**
         * @type {Function} The function to wrap.
         * @private
         */
        this._callback = callback;

        /**
         * @type {boolean} Indicates if this callback is currently active.
         */
        this._active = false;

        /**
         * @type {boolean} Indicates if this function is called after a step.
         */
        this._afterStep = Boolean(afterStep);

        /**
         * @type {?any} The callback name.
         */
        this.name = name;
    }

    /**
     * Executes the wrapped {@link Callback} function.
     * @returns {boolean} True if the callback was successfully executed, false otherwise.
     */
    _call () {
        return this._callback();
    }

    /**
     * Re-adds this {@link Callback} to the stored callbacks array.
     */
    enable () {
        this._callbacks.reAddCallback(this);
    }

    /**
     * Removes this {@link Callback} from the stored callbacks array.
     */
    disable () {
        this._callbacks.removeCallback(this);
    }

    /**
     * Evaluates if this {@link Callback} is currently active.
     * @returns {boolean} true if callback is active, false otherwise.
     */
    isActive () {
        return this._active;
    }
}

class Callbacks {
    constructor () {

        /**
         * @type {Callback[]} An array to store all used callbacks.
         */
        this.callbacks = [];
    }

    /**
     * Calls all stored {@link Callback} functions and removes them after their successful execution.
     * @param {boolean=} afterStep Indicates if function should be called after step.
     */
    callCallbacks (afterStep) {
        const callbacksToCall = [...this.callbacks];

        for (const callback of callbacksToCall) {
            if (callback.isActive() && callback._afterStep === afterStep) {
                if (callback._call()) {
                    this.removeCallback(callback);
                }
            }
        }
    }

    /**
     * Wraps a new {@link Function} into a {@link Callback} and adds it to the stored callbacks array.
     * @param {Function} func The function to wrap.
     * @param {boolean=} afterStep Indicates if callback should be executed after step, false otherwise.
     * @param {any=} name The callback name.
     * @returns {Callback} The newly created and added callback.
     */
    addCallback (func, afterStep = false, name) {
        const callback = new Callback(this, func, name, afterStep);
        callback._active = true;
        this.callbacks.push(callback);
        return callback;
    }

    /**
     * Enables and adds an already existing {@link Callback} to the stored callbacks array.
     * @param {Callback} callback The callback to add.
     * @returns {Callback} The added callback.
     */
    reAddCallback (callback) {
        this.removeCallback(callback);
        callback._active = true;
        this.callbacks.push(callback);
        return callback;
    }

    /**
     * Disables and removes a stored {@link Callback}.
     * @param {Callback} callback The callback to remove.
     * @returns {boolean} true if the callback was successfully removed, false otherwise.
     */
    removeCallback (callback) {
        callback._active = false;
        const index = this.callbacks.indexOf(callback);
        if (index !== -1) {
            this.callbacks.splice(index, 1);
        }
        return index !== -1;
    }

    /**
     * Disables and removes all stored {@link Callback Callbacks}.
     */
    clearCallbacks () {
        for (const callback of this.callbacks) {
            callback._active = false;
        }
        this.callbacks = [];
    }
}

module.exports = {
    Callback,
    Callbacks
};
