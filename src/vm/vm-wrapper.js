const Runtime = require('scratch-vm/src/engine/runtime');
const Stepper = require('./stepper');

const {Sprites} = require('./sprites');
const {Callbacks} = require('./callbacks');
const {Inputs} = require('./inputs');
const {RandomInputs} = require('./random-input');
const {Constraints} = require('./constraints');

class VMWrapper {
    /**
     * @param {VirtualMachine} vm .
     * @param {object=} props .
     */
    constructor (vm, props) {
        if (!props) {
            props = {
                verbose: false
            };
        }

        /**
         * @type {VirtualMachine}
         */
        this.vm = vm;

        /**
         * @type {Stepper}
         */
        this.stepper = new Stepper(Runtime.THREAD_STEP_INTERVAL);

        /**
         * @type {boolean}
         */
        this.verbose = Boolean(props.verbose);

        /**
         * @type {function}
         */
        this.log = () => {};

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
         * @type {RandomInputs}
         */
        this.randomInputs = new RandomInputs(this);

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
        this.randomInputs.performRandomInput();
        this.inputs.performInputs();

        this.sprites.update();
        this.vm.runtime._step();

        return this.constraints.checkConstraints();
    }

    /**
     * @param {Function} condition .
     * @param {number} timeout .
     * @returns {number} .
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
     * @returns {number} .
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

    /**
     * @return {number} .
     */
    getTotalTimeElapsed () {
        return Date.now() - this.startTime;
    }

    /**
     * @return {number} .
     */
    getRunTimeElapsed () {
        if (this.running) {
            return Date.now() - this.runStartTime;
        }
        return 0;
    }

    /**
     * @param {string} project .
     * @returns {Promise<void>} .
     */
    async setup (project) {
        if (this.vm.runtime.compatibilityMode) {
            this.vm.runtime.currentStepTime = Runtime.THREAD_STEP_INTERVAL_COMPATIBILITY;
            this.stepper.setStepTime(Runtime.THREAD_STEP_INTERVAL_COMPATIBILITY);
        } else {
            this.vm.runtime.currentStepTime = Runtime.THREAD_STEP_INTERVAL;
            this.stepper.setStepTime(Runtime.THREAD_STEP_INTERVAL);
        }
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

    end () {
        this.cancelRun();
        this.vm.stopAll();
        this.vm.runtime._step();

        this.inputs.resetMouse();
        this.inputs.resetKeyboard();
    }

    /**
     * @param {number} x .
     * @param {number} y .
     * @return {{x: number, y: number}} .
     */
    getScratchCoords (x, y) {
        const rect = this.vm.runtime.renderer.gl.canvas.getBoundingClientRect();
        const [nWidth, nHeight] = this.vm.runtime.renderer.getNativeSize();
        return {
            x: (nWidth / rect.width) * (x - (rect.width / 2)),
            y: -(nHeight / rect.height) * (y - (rect.height / 2))
        };
    }

    /**
     * @param {number} x .
     * @param {number} y .
     * @return {{x: number, y: number}} .
     */
    getClientCoords (x, y) {
        const rect = this.vm.runtime.renderer.gl.canvas.getBoundingClientRect();
        const [nWidth, nHeight] = this.vm.runtime.renderer.getNativeSize();
        return {
            x: (x * (rect.width / nWidth)) + (rect.width / 2),
            y: (-y * (rect.height / nHeight)) + (rect.height / 2)
        };
    }

    /**
     * @return {{width: number, height: number}} .
     */
    getStageSize () {
        const [width, height] = this.vm.runtime.renderer.getNativeSize();
        return {
            width,
            height
        };
    }

    /**
     * @return {DOMRect} .
     */
    getCanvasRect () {
        return this.vm.runtime.renderer.gl.canvas.getBoundingClientRect();
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
