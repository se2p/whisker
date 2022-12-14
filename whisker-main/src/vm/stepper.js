const log = require('minilog')('stepper');

/**
 * A wrapper around a {@link Promise}, which saves the {@link Promise}'s resolve and reject functions, as well
 * as a callback, for future use.
 */
class WaitingPromise {
    constructor (callback, resolve, reject) {

        /**
         * @type Function The function this is a wrapper for.
         */
        this.callback = callback;

        /**
         * @type {Function} The resolve function of the {@link Promise}.
         */
        this.resolve = resolve;

        /**
         * @type {Function} The reject function of the {@link Promise}.
         */
        this.reject = reject;
    }
}

/**
 * A callback queue, which uses {@link setInterval} to execute callbacks in a given interval. Adding a callback to the
 * queue gives back a {@link Promise} that is resolved (or rejected) with the callback's return value.
 */
class Stepper {
    constructor (stepTime) {

        /**
         * @type {number} The time between callbacks.
         * @private
         */
        this._stepTime = stepTime;

        /**
         * @type {WaitingPromise[]} Queue of {@link WaitingPromise WaitingPromises} to be executed.
         * @private
         */
        this._queue = [];

        /**
         * @type {?number} The interval used for setInterval() and clearInterval().
         * @private
         */
        this._interval = null;
    }

    /**
     * Executes the next item in the callback queue. This function is called by the interval.
     * @private
     */
    _executeNext () {
        if (this._queue.length) {
            const currentStep = this._queue.shift();
            try {
                currentStep.resolve(currentStep.callback());
            } catch (error) {
                currentStep.reject(error);
            }
        } else {
            // log.debug('Stopping stepper');
            clearInterval(this._interval);
            this._interval = null;
        }
    }

    /**
     * Adds a callback to the queue. Immediately executes the callback if the next step is due, otherwise it is executed
     * by the interval later.
     * @param {Function} callback The callback to queue.
     * @returns {Promise} A {@link Promise} that will be resolved (or rejected) when the callback is executed.
     * @example
     * stepper = new Stepper(1000);
     * stepper.step(() => console.log('after 0 sec'));
     * stepper.step(() => console.log('after 1 sec'));
     * returnValue = await stepper.step(() => {
     *     console.log('after 2 sec'));
     *     return 'returnValue';
     * });
     */
    step (callback) {
        const promise = new Promise((resolve, reject) => {
            this._queue.push(new WaitingPromise(callback, resolve, reject));
        });

        if (!this._interval) {
            // log.debug('Starting stepper');
            this._interval = setInterval(this._executeNext.bind(this), this._stepTime);
            this._executeNext();
        }

        return promise;
    }

    /**
     * Sets the time interval between callbacks.
     * @param stepTime The time in steps.
     */
    setStepTime (stepTime) {
        this._stepTime = stepTime;
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = setInterval(this._executeNext.bind(this), this._stepTime);
        }
    }
}

module.exports = Stepper;
