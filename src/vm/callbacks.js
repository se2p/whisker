class Callback {
    constructor (callbacks, callback, name) {

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
        this._callbacks.addCallback(this);
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

    callCallbacks () {
        const callbacksToCall = [...this.callbacks];

        for (const callback of callbacksToCall) {
            if (callback.isActive()) {
                if (callback._call()) {
                    this.removeCallback(callback);
                }
            }
        }
    }

    /**
     * @param {(Function|Callback)} functionOrCallback .
     * @param {any=} name .
     * @returns {Callback} .
     */
    addCallback (functionOrCallback, name) {
        let callback;

        if (functionOrCallback instanceof Callback) {
            callback = functionOrCallback;
            this.removeCallback(callback);
        } else {
            callback = new Callback(this, functionOrCallback, name);
        }

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
