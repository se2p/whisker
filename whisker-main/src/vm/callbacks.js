class Callback {
    constructor (callbacks, callback, name, afterStep) {

        /**
         * @type {Callbacks}
         * @private
         */
        this._callbacks = callbacks;

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
         * @type {boolean}
         */
        this._afterStep = Boolean(afterStep);

        /**
         * @type {?any}
         */
        this.name = name;
    }

    /**
     * @returns {boolean} .
     */
    _call () {
        return this._callback();
    }

    enable () {
        this._callbacks.reAddCallback(this);
    }

    disable () {
        this._callbacks.removeCallback(this);
    }

    isActive () {
        return this._active;
    }
}

class Callbacks {
    constructor () {

        /**
         * @type {Callback[]}
         */
        this.callbacks = [];
    }

    /**
     * @param {boolean=} afterStep .
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
     * @param {Function} func .
     * @param {boolean=} afterStep .
     * @param {any=} name .
     * @returns {Callback} .
     */
    addCallback (func, afterStep = false, name) {
        const callback = new Callback(this, func, name, afterStep);
        callback._active = true;
        this.callbacks.push(callback);
        return callback;
    }

    /**
     * @param {Callback} callback .
     * @returns {Callback} .
     */
    reAddCallback (callback) {
        this.removeCallback(callback);
        callback._active = true;
        this.callbacks.push(callback);
        return callback;
    }

    /**
     * @param {Callback} callback .
     * @returns {boolean} .
     */
    removeCallback (callback) {
        callback._active = false;
        const index = this.callbacks.indexOf(callback);
        if (index !== -1) {
            this.callbacks.splice(index, 1);
        }
        return index !== -1;
    }

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
