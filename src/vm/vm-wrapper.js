const Runtime = require('scratch-vm/src/engine/runtime');
const Stepper = require('./stepper');

const {Sprites} = require('./sprites');
const {Callbacks} = require('./callbacks');
const {Inputs} = require('./inputs');
const {Constraints} = require('./constraints');

class VMWrapper {
    constructor (vm) {
        /**
         * @type {VirtualMachine}
         */
        this.vm = vm;

        /**
         * @type {Stepper}
         */
        this.stepper = new Stepper(Runtime.THREAD_STEP_INTERVAL);

        /**
         * @type {Sprites}
         */
        this.sprites = new Sprites(this);

        /**
         * @type {Callbacks}
         */
        this.callbacks = new Callbacks(this);

        /**
         * @type {Inputs}
         */
        this.inputs = new Inputs(this);

        /**
         * @type {Constraints}
         */
        this.constraints = new Constraints(this);

        /**
         * @type {string}
         */
        this.actionOnConstraintFailure = VMWrapper.ON_CONSTRAINT_FAILURE_FAIL;

        /**
         * @type {number}
         */
        this.startTime = 0;

        /**
         * @type {number}
         */
        this.runStartTime = 0;

        /**
         * @type {boolean}
         */
        this.running = false;
    }

    /**
     * @param {string} action .
     * @returns {string} .
     */
    onConstraintFailure (action) {
        if (action) {
            this.actionOnConstraintFailure = action;
        }
        return this.actionOnConstraintFailure;
    }

    step () {
        this.callbacks.callCallbacks();
        this.inputs.performInputs(this.getRunTimeElapsed());

        this.sprites.update();
        this.vm.runtime._step();

        return this.constraints.checkConstraints();
    }

    /**
     * @param {Function} condition .
     * @param {number} timeout .
     * @returns {Promise<RunSummary>} .
     */
    async run (condition, timeout) {
        this.running = true;
        this.runStartTime = Date.now();
        let constraintError = null;

        while (this.running && this.getRunTimeElapsed() < timeout && !condition()) {
            constraintError = await this.stepper.step(this.step.bind(this));

            if (constraintError &&
               (this.actionOnConstraintFailure === VMWrapper.ON_CONSTRAINT_FAILURE_FAIL ||
                this.actionOnConstraintFailure === VMWrapper.ON_CONSTRAINT_FAILURE_STOP)) {
                break;
            }
        }

        this.running = false;
        const timeElapsed = this.getRunTimeElapsed();

        this.inputs.updateInputs(timeElapsed);

        if (constraintError && this.actionOnConstraintFailure === VMWrapper.ON_CONSTRAINT_FAILURE_FAIL) {
            throw constraintError;
        }

        return timeElapsed;
    }

    /**
     * @param {number} time .
     * @returns {Promise<RunSummary>} .
     */
    async runForTime (time) {
        return await this.run(() => false, time);
    }

    /**
     * @param {Function} condition .
     * @returns {Promise<RunSummary>} .
     */
    async runUntil (condition) {
        return await this.run(condition, Infinity);
    }

    cancelRun () {
        this.running = false;
    }

    getTotalTimeElapsed () {
        return Date.now() - this.startTime;
    }

    getRunTimeElapsed () {
        return Date.now() - this.runStartTime;
    }

    /**
     * @param {string} project .
     * @returns {Promise<void>} .
     */
    async setup (project) {
        this.vm.runtime.currentStepTime = this.vm.runtime.compatibilityMode ?
            Runtime.THREAD_STEP_INTERVAL_COMPATIBILITY :
            Runtime.THREAD_STEP_INTERVAL;
        clearInterval(this.vm.runtime._steppingInterval);
        return await this.vm.loadProject(project);
    }

    start () {
        this.callbacks.clearCallbacks();
        this.inputs.clearInputs();
        this.constraints.clearConstraints();
        this.sprites.reset();

        this.inputs.resetMouse();
        this.inputs.resetKeyboard();

        this.vm.greenFlag();
        this.startTime = Date.now();
    }

    stop () {
        this.cancelRun();
        this.vm.stopAll();
        this.vm.runtime._step();

        this.inputs.resetMouse();
        this.inputs.resetKeyboard();
    }

    getScratchCoords (x, y) {
        const rect = this.vm.runtime.renderer.gl.canvas.getBoundingClientRect();
        const nativeSize = this.vm.runtime.renderer.getNativeSize();

        return {
            x: (nativeSize[0] / rect.width) * (x - (rect.width / 2)),
            y: -(nativeSize[1] / rect.height) * (y - (rect.height / 2))
        };
    }

    getClientCoords (x, y) {
        const rect = this.vm.runtime.renderer.gl.canvas.getBoundingClientRect();
        const nativeSize = this.vm.runtime.renderer.getNativeSize();

        return {
            x: (x * (rect.width / nativeSize[0])) + (rect.width / 2),
            y: (-y * (rect.height / nativeSize[1])) + (rect.height / 2)
        };
    }

    getStageSize () {
        const nativeSize = this.vm.runtime.renderer.getNativeSize();
        return {
            width: nativeSize[0],
            height: nativeSize[1]
        };
    }

    /**
     * @returns {string} .
     */
    static get ON_CONSTRAINT_FAILURE_FAIL () {
        return 'fail';
    }

    /**
     * @returns {string} .
     */
    static get ON_CONSTRAINT_FAILURE_STOP () {
        return 'stop';
    }

    /**
     * @returns {string} .
     */
    static get ON_CONSTRAINT_FAILURE_NOTHING () {
        return 'nothing';
    }
}

module.exports = VMWrapper;
