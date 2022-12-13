const Runtime = require('scratch-vm/src/engine/runtime');
const Stepper = require('./stepper');
const log = require('minilog')('vm-wrapper');
const Sprites = require('./sprites');
const {Callbacks} = require('./callbacks');
const {Inputs} = require('./inputs');
const {RandomInputs} = require('./random-input');
const {Constraints} = require('./constraints');
require('setimmediate'); // attaches setImmediate to the global scope as side effect

/**
 * Wraps the used virtual machine and extends existing functionality.
 */
class VMWrapper {
    constructor(vm, project) {

        /**
         * @type {VirtualMachine} The used virtual machine.
         */
        this.vm = vm;

        /**
         * {object} The original project json, which is used to reload the original VM state.
         */
        this._originalProjectJSON = project;

        /**
         * @type {Stepper} The stepper that counts steps of the virtual machine.
         */
        this.stepper = new Stepper(Runtime.THREAD_STEP_INTERVAL);

        /**
         * @type {Sprites} Sprite specific functionality.
         */
        this.sprites = new Sprites(this);

        /**
         * @type {Callbacks} Callback specific functionality.
         */
        this.callbacks = new Callbacks(this);

        /**
         * @type {Callbacks} Callback specific functionality for models.
         */
        this.modelCallbacks = new Callbacks(this);

        /**
         * @type {Inputs} Input specific functionality.
         */
        this.inputs = new Inputs(this);

        /**
         * @type {RandomInputs} Random input specific functionality.
         */
        this.randomInputs = new RandomInputs(this);

        /**
         * @type {Constraints} Constraint specific functionality.
         */
        this.constraints = new Constraints(this);

        /**
         * @type {string} Error text when action fails because of a constraint.
         */
        this.actionOnConstraintFailure = VMWrapper.ON_CONSTRAINT_FAILURE_FAIL;

        /**
         * @type {number} Time the virtual machine starts.
         */
        this.startTime = 0;

        /**
         * @type {number} The overall count of executed steps.
         */
        this.stepsExecuted = 0;

        /**
         * @type {number} The executed steps after a new run starts.
         */
        this.runStartStepsExecuted = 0;

        /**
         * @type {boolean} Indicates if the Scratch program has active threads that are being executed.
         */
        this._scratchRunning = false;

        /**
         * @type {boolean} Indicates if the virtual machine is aborted.
         */
        this.aborted = false;

        /**
         * @type {boolean} Indicates if Whisker is actively running and has not been stopped by a call to vm-wrapper.end().
         */
        this._whiskerRunning = false;

        /**
         * @type {string} Text for a question.
         */
        this.question = null;

        this._onRunStart = this.onRunStart.bind(this);
        this._onRunStop = this.onRunStop.bind(this);
        this._onQuestion = this.onQuestion.bind(this);
        this._onAnswer = this.onAnswer.bind(this);
        this._onTargetCreated = this.sprites.onTargetCreated.bind(this.sprites);
        this._onSayOrThink = this.sprites.doOnSayOrThink.bind(this.sprites);
        this._onVariableChange = this.sprites.doOnVariableChange.bind(this.sprites);
    }

    /**
     * If a run fails due to a constraint, gives back a message for the user to take a specific action.
     * @param {string} action The message about the action to take.
     * @returns {string} The action message..
     */
    onConstraintFailure(action) {
        if (action) {
            this.actionOnConstraintFailure = action;
        }
        return this.actionOnConstraintFailure;
    }

    /**
     * Takes a run step.
     * @returns {Promise<*>} Returns AssertionError, if constraint failed.
     */
    async step() {

        await this.vm.runtime.translateText2Speech();

        this.callbacks.callCallbacks(false);
        await this._yield();

        if (!this.isScratchRunning()) return;

        this.randomInputs.performRandomInput();
        await this._yield();

        this.inputs.performInputs();
        await this._yield();

        this.modelCallbacks.callCallbacks(false);
        await this._yield();

        this.sprites.update();
        await this._yield();

        this.vm.runtime._step();
        await this._yield();

        // do not stop even if this.isRunning=false!
        this.modelCallbacks.callCallbacks(true);
        await this._yield();

        if (!this.isScratchRunning()) return;

        this.callbacks.callCallbacks(true);
        await this._yield();

        if (!this.isScratchRunning()) return;

        const returnValue = this.constraints.checkConstraints();
        await this._yield();
        return returnValue;
    }

    /**
     * Starts another run for project testing.
     * @param {Function?} condition Run condition.
     * @param {number=} timeout Time after which run is aborted.
     * @param {number=} steps Number of steps the run is lasting.
     * @returns {number} Runtime in ms.
     */
    async run(condition, timeout, steps) {
        if (this.isScratchRunning()) {
            throw new Error('Warning: A run was started while another run was still going! Make sure you are not ' +
                'missing any await-statements in your test.');
        }

        condition = condition || (() => false);
        if (timeout !== undefined && steps === undefined) {
            steps = this.convertFromTimeToSteps(timeout);
        }
        steps = steps === undefined ? Infinity : steps;

        this._scratchRunning = true;
        this.runStartStepsExecuted = this.getTotalStepsExecuted();

        let constraintError = null;

        while (this.isScratchRunning() && this.getRunStepsExecuted() < steps && !condition()) {
            if (!this.vm.runtime.paused || this.vm.runtime.oneStep) {
                const previousStepsExecuted = this.vm.runtime.stepsExecuted;

                constraintError = await this.stepper.step(this.step.bind(this));

                this.stepsExecuted += this.vm.runtime.stepsExecuted - previousStepsExecuted;

                if (constraintError &&
                    (this.actionOnConstraintFailure === VMWrapper.ON_CONSTRAINT_FAILURE_FAIL ||
                        this.actionOnConstraintFailure === VMWrapper.ON_CONSTRAINT_FAILURE_STOP)) {
                    break;
                }
            } else {
                // The execution of a test is paused in the debugger. Without the timeout, the debugger GUI freezes.
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        if (this.aborted) {
            throw new Error('Run was aborted!');
        }

        this._scratchRunning = false;
        const stepsExecuted = this.getRunStepsExecuted();
        this.inputs.updateInputs(stepsExecuted);

        if (constraintError && this.actionOnConstraintFailure === VMWrapper.ON_CONSTRAINT_FAILURE_FAIL) {
            throw constraintError;
        }

        return this.getRunTimeElapsed();
    }

    /**
     * Starts another run for a specific amount of time.
     * @param {number} time Time constraint for runtime.
     * @returns {number} Runtime in ms.
     */
    async runForTime(time) {
        return await this.run(undefined, time);
    }

    /**
     * Starts another run until a specific condition occurs.
     * @param {Function} condition Condition that stops the run.
     * @param {number=} timeout Time constraint for runtime.
     * @returns {number} Runtime in ms.
     */
    async runUntil(condition, timeout) {
        return await this.run(condition, timeout);
    }

    /**
     * Starts another run until a specific callback.
     * @param {Function} callback Callback that stops run.
     * @param {number=} timeout Time constraint for runtime.
     * @returns {number} Runtime in ms .
     */
    async runUntilChanges(callback, timeout) {
        const initialValue = callback();
        return await this.run(() => callback() !== initialValue, timeout);
    }

    /**
     * Starts another run that lasts for a specific number of steps.
     * @param {number} steps Step constraint for run.
     * @returns {number} Runtime in steps.
     */
    async runForSteps(steps) {
        return this.convertFromTimeToSteps(await this.run(undefined, undefined, steps));
    }

    /**
     * Cancels the current run by setting the running property to false.
     */
    cancelScratchRun() {
        this._scratchRunning = false;
    }

    /**
     * Cancels and aborts the current run.
     */
    abort() {
        this.cancelScratchRun();
        this.aborted = true;
        log.warn("Run aborted");
    }

    /**
     * Gives back the current step time.
     * @return {number} Step time in ms.
     */
    getCurrentStepTime() {
        return this.vm.runtime.paused ? this.vm.runtime.oldStepTime : this.vm.runtime.currentStepTime;
    }

    /**
     * Gives back the total timespan since the start of the test suite taking the acceleration factor into account.
     * @return {number} Runtime in ms.
     */
    getTotalTimeElapsed() {
        return this.getTotalStepsExecuted() * this.getCurrentStepTime() * this.accelerationFactor;
    }

    /**
     * Gives back the timespan since the last run started taking the acceleration factor into account.
     * @return {number} Runtime in ms.
     */
    getRunTimeElapsed() {
        return this.getRunStepsExecuted() * this.getCurrentStepTime() * this.accelerationFactor;
    }

    /**
     * Gives back the total executed steps since the start of the test suite.
     * @return {number} Runtime in steps.
     */
    getTotalStepsExecuted() {
        return this.stepsExecuted;
    }

    /**
     * Gives back the executed steps since the start of the last run.
     * @return {number} Runtime in steps.
     */
    getRunStepsExecuted() {
        return this.stepsExecuted - this.runStartStepsExecuted;
    }

    /**
     * Runs the virtual machine for a specific number of steps.
     * @param {number} steps Number of steps to wait.
     * @returns {Promise<void>} Promise that resolves after targets are installed.
     */
    async wait(steps) {
        await this.runForSteps(steps);
    }

    /**
     * Initializes the vm wrapper with the project and acceleration factor that should be used for testing.
     * @param {string} project The project to test.
     * @param {number} accelerationFactor The used acceleration factor.
     * @returns {Promise<void>} Promise that resolves after targets are installed.
     */
    async setup(project, accelerationFactor = 1) {
        delete Runtime.THREAD_STEP_INTERVAL;
        Runtime.THREAD_STEP_INTERVAL = 1000 / 30 / accelerationFactor;
        this.vm.runtime.currentStepTime = Runtime.THREAD_STEP_INTERVAL;
        this.vm.runtime.accelerationFactor = accelerationFactor;
        this.stepper.setStepTime(Runtime.THREAD_STEP_INTERVAL);
        clearInterval(this.vm.runtime._steppingInterval);
        this.accelerationFactor = accelerationFactor;
        this.vm.runtime.virtualSound = -1;

        this.instrumentPrimitive('control_wait', 'DURATION');
        this.instrumentPrimitive('looks_sayforsecs', 'SECS');
        this.instrumentPrimitive('looks_thinkforsecs', 'SECS');
        this.instrumentPrimitive('motion_glidesecstoxy', 'SECS');
        this.instrumentPrimitive('motion_glideto', 'SECS');

        this.instrumentDevice('clock', 'projectTimer');

        const returnValue = await this.vm.loadProject(project);
        await this._yield();
        return returnValue;
    }

    /**
     * Instrumentation of a new runtime device.
     * @param deviceName Name of the device to set.
     * @param method Device method to set.
     */
    instrumentDevice(deviceName, method) {
        const device = this.vm.runtime.ioDevices[deviceName];
        let original = device[method];

        if (original.isInstrumented) {
            original = original.primitive;
        }

        const instrumented = () => original.call(device) * this.accelerationFactor;
        instrumented.isInstrumented = true;
        instrumented.primitive = original;
        device[method] = instrumented;
    }

    /**
     * Instrumentation of a new runtime primitive.
     * @param primitive Runtime primitive to set.
     * @param argument Primitive argument to set.
     */
    instrumentPrimitive(primitive, argument) {
        let original = this.vm.runtime._primitives[primitive];

        if (original.isInstrumented) {
            original = original.primitive;
        }

        const instrumented = (args, util) => {
            const clone = {...args};
            clone[argument] = args[argument] / this.accelerationFactor;
            return original(clone, util);
        };
        instrumented.isInstrumented = true;
        instrumented.primitive = original;
        this.vm.runtime._primitives[primitive] = instrumented;
    }

    /**
     * Records the current vm state and saves it in an object that can be used to restore that state by
     * using the resetState method.
     * @returns {object} current vm state.
     */
    _recordInitialState() {
        const initialState = {};
        for (const targetsKey in this.vm.runtime.targets) {
            initialState[targetsKey] = {
                name: this.vm.runtime.targets[targetsKey].sprite['name'],
                direction: this.vm.runtime.targets[targetsKey]["direction"],
                size: this.vm.runtime.targets[targetsKey]['size'],
                currentCostume: this.vm.runtime.targets[targetsKey]["currentCostume"],
                draggable: this.vm.runtime.targets[targetsKey]["draggable"],
                dragging: this.vm.runtime.targets[targetsKey]["dragging"],
                drawableID: this.vm.runtime.targets[targetsKey]['drawableID'],
                effects: Object.assign({}, this.vm.runtime.targets[targetsKey]["effects"]),
                videoState: this.vm.runtime.targets[targetsKey]["videoState"],
                videoTransparency: this.vm.runtime.targets[targetsKey]["videoTransparency"],
                visible: this.vm.runtime.targets[targetsKey]["visible"],
                volume: this.vm.runtime.targets[targetsKey]["volume"],
                x: this.vm.runtime.targets[targetsKey]["x"],
                y: this.vm.runtime.targets[targetsKey]["y"],
                variables: JSON.parse(JSON.stringify(this.vm.runtime.targets[targetsKey]["variables"]))
            };
        }
        return initialState;
    }

    /**
     * Loads supplied saveState. Usually used for resetting the VM state to a previously saved initial state.
     * @param {object} saveState of a previous vm state, can be generated using the recordState() method.
     */
    loadSaveState(saveState) {
        // Delete clones
        const clones = [];
        for (const targetsKey in this.vm.runtime.targets) {
            if (!this.vm.runtime.targets[targetsKey].isOriginal) {
                clones.push(this.vm.runtime.targets[targetsKey]);
            }
        }

        for (const target of clones) {
            this.vm.runtime.stopForTarget(target);
            this.vm.runtime.disposeTarget(target);
        }

        // Restore state of all others
        for (const targetsKey in this.vm.runtime.targets) {
            this.vm.runtime.targets[targetsKey]["direction"] = saveState[targetsKey]["direction"];
            this.vm.runtime.targets[targetsKey]["size"] = saveState[targetsKey]["size"];
            this.vm.runtime.targets[targetsKey]["currentCostume"] = saveState[targetsKey]["currentCostume"];
            this.vm.runtime.targets[targetsKey]["draggable"] = saveState[targetsKey]["draggable"];
            this.vm.runtime.targets[targetsKey]["dragging"] = saveState[targetsKey]["dragging"];
            this.vm.runtime.targets[targetsKey]["drawableID"] = saveState[targetsKey]["drawableID"];
            this.vm.runtime.targets[targetsKey]["effects"] = Object.assign({}, saveState[targetsKey]["effects"]);
            this.vm.runtime.targets[targetsKey]["videoState"] = saveState[targetsKey]["videoState"];
            this.vm.runtime.targets[targetsKey]["videoTransparency"] = saveState[targetsKey]["videoTransparency"];
            this.vm.runtime.targets[targetsKey]["visible"] = saveState[targetsKey]["visible"];
            this.vm.runtime.targets[targetsKey]["volume"] = saveState[targetsKey]["volume"];
            const x = saveState[targetsKey]["x"];
            const y = saveState[targetsKey]["y"];
            this.vm.runtime.targets[targetsKey].setXY(x, y, true, true);
            this.vm.runtime.targets[targetsKey]["variables"] = JSON.parse(JSON.stringify(saveState[targetsKey]["variables"]));
        }

        this.inputs.clearInputs();
        this.inputs.resetMouse();
        this.inputs.resetKeyboard();
    }

    /**
     * Start the vm wrapper by resetting it to its original state and starting the virtual machine.
     */
    start() {
        this.vm.runtime.stopAll();
        this.callbacks.clearCallbacks();
        this.inputs.clearInputs();
        this.constraints.clearConstraints();
        this.sprites.reset();

        this.inputs.resetMouse();
        this.inputs.resetKeyboard();

        this.vm.on(Runtime.PROJECT_RUN_START, this._onRunStart);
        this.vm.on(Runtime.PROJECT_RUN_STOP, this._onRunStop);
        this.vm.runtime.on('targetWasCreated', this._onTargetCreated);
        this.vm.runtime.on('QUESTION', this._onQuestion);
        this.vm.runtime.on('ANSWER', this._onAnswer);
        this.vm.runtime.on('SAY', this._onSayOrThink);
        this.vm.runtime.on('DELETE_SAY_OR_THINK', this._onSayOrThink);
        this.vm.runtime.on('CHANGE_VARIABLE', this._onVariableChange);

        this.vm.greenFlag();
        this.startTime = Date.now();
        this.vm.runtime.stepsExecuted = 0;
        this.vm.runtime.stepTimer = 0;
        this.vm.runtime.virtualSound = -1;

        this.aborted = false;
    }

    /**
     * Stop the vm wrapper by resetting it to its original state and stopping the virtual machine.
     */
    end() {
        this.cancelScratchRun();
        this.vm.stopAll();

        this.sprites.onSpriteMoved(null);
        this.sprites.onSpriteVisualChange(null);
        this.sprites.onSayOrThink(null);
        this.sprites.onVariableChange(null);

        this.vm.runtime._step();

        this.inputs.resetMouse();
        this.inputs.resetKeyboard();

        this.vm.removeListener(Runtime.PROJECT_RUN_START, this._onRunStart);
        this.vm.removeListener(Runtime.PROJECT_RUN_STOP, this._onRunStop);
        this.vm.runtime.removeListener('targetWasCreated', this._onTargetCreated);
        this.vm.runtime.removeListener('QUESTION', this._onQuestion);
        this.vm.runtime.removeListener('ANSWER', this._onAnswer);
        this.vm.runtime.removeListener('SAY', this._onSayOrThink);
        this.vm.runtime.removeListener('DELETE_SAY_OR_THINK', this._onSayOrThink);
        this.vm.runtime.removeListener('CHANGE_VARIABLE', this._onVariableChange);
    }

    /**
     * Resets the VM state to the state of the original .sb3 file.
     * This approach may lead to page crashed and should therefore be avoided.
     * Please use the recordState() and resetState() method for this purpose.
     * @returns {Promise<void>}
     * @deprecated
     */
    async resetVM() {
        await this.vm.loadProject(this._originalProjectJSON);
    }

    /**
     * Start the tested project by activating the greenFlag block.
     */
    // TODO: reset sprites on green flag?
    greenFlag() {
        this.vm.greenFlag();
    }

    /**
     * Converts coordinates to be relative to the scratch canvas.
     * @param {number} x The x coordinate on the client.
     * @param {number} y The y coordinate on the client.
     * @return {{x: number, y: number}} The converted coordinates.
     */
    getScratchCoords(x, y) {
        const rect = this.vm.runtime.renderer.gl.canvas.getBoundingClientRect();
        const [nWidth, nHeight] = this.vm.runtime.renderer.getNativeSize();
        return {
            x: (nWidth / rect.width) * (x - (rect.width / 2)),
            y: -(nHeight / rect.height) * (y - (rect.height / 2))
        };
    }

    /**
     * Converts scratch coordinates to be relative to the client.
     * @param {number} x The x coordinate on the scratch canvas.
     * @param {number} y The y coordinate on the scratch canvas.
     * @return {{x: number, y: number}} The converted coordinates.
     */
    getClientCoords(x, y) {
        const rect = this.vm.runtime.renderer.gl.canvas.getBoundingClientRect();
        const [nWidth, nHeight] = this.vm.runtime.renderer.getNativeSize();
        return {
            x: (x * (rect.width / nWidth)) + (rect.width / 2),
            y: (-y * (rect.height / nHeight)) + (rect.height / 2)
        };
    }

    /**
     * Gives back the width and height of the scratch stage.
     * @return {{width: number, height: number}} The stage size.
     */
    getStageSize() {
        const [width, height] = this.vm.runtime.renderer.getNativeSize();
        return {
            width,
            height
        };
    }

    /**
     * Converts the unit of time into the unit of steps.
     * @param {number} timeDuration The time in ms to convert.
     * @return {number} The converted time in steps.
     */
    convertFromTimeToSteps(timeDuration) {
        const stepDuration = this.getCurrentStepTime() * this.accelerationFactor;
        return timeDuration / stepDuration;
    }

    /**
     * Finds the RenderedTarget instance of a sprite using the sprite's name.
     * @param spriteName The name of the sprite we are searching the RenderedTarget instance for.
     * @return {RenderedTarget} The found target or undefined if no target with a matching name was found.
     */
    getTargetBySpriteName(spriteName) {
        for (const target of this.vm.runtime.targets) {
            if (target.sprite.name === spriteName) {
                return target;
            }
        }
        return undefined;
    }

    /**
     * Finds the RenderedTarget instance of a sprite using its coordinates.
     * @param {number} x The x coordinate of the target.
     * @param {number} y The y coordinate of the target.
     * @return {RenderedTarget} The found target.
     */
    getTargetBySpriteCoords(x, y) {
        for (const target of this.vm.runtime.targets) {
            if (target.x === x && target.y === y) {
                return target;
            }
        }
    }

    /**
     * Getter for a global variable that is accessible through all sprites.
     * @param {string} variableName the name of the variable we are querying.
     * @returns {string} the value of the variable if found, undefined otherwise.
     */
    getGlobalVariable(variableName) {
        return this.sprites.getSpriteVariable('Stage', variableName);
    }

    /**
     * Setter for a global variable that is accessible through all sprites.
     * @param {string} variableName the name of the variable whose value we want to change.
     * @param {string} value the value we assign to the queried variable.
     * @returns {boolean} true iff the value of the specified variable was changed, false otherwise.
     */
    setGlobalVariable(variableName, value) {
        return this.sprites.setSpriteVariable('Stage', variableName, value);
    }

    /**
     * Gives back the answer given to the ask-and-wait block.
     * @return {string} Answer text.
     */
    getAnswer() {
        return this.vm.runtime._primitives.sensing_answer();
    }

    /**
     * Tests whether the ask block is currently active for a given target (a sprite or the stage).
     * @return {boolean} true if ask block is active, false otherwise.
     */
    isQuestionAsked() {
        return this.question !== null;
    }

    /**
     * Sets the new ask block that is displayed.
     * @param question The new ask block.
     */
    onQuestion(question) {
        this.question = question; // question can be null when questions are cleared
    }

    /**
     * Resets the ask block if an answer is given.
     * @param answer The given answer.
     */
    onAnswer(answer) {
        this.question = null;
    }

    /**
     * Gives back a {@code DOMRect} object that provides information about the size of the scratch canvas and its
     * position relative to the viewport.
     * @return {DOMRect} The canvas rectangle object.
     */
    getCanvasRect() {
        return this.vm.runtime.renderer.gl.canvas.getBoundingClientRect();
    }

    /**
     * Tells if the currently loaded Scratch program has active threads that are being executed.
     * @returns {boolean} true if active, false otherwise.
     * @see isWhiskerRunning
     */
    isScratchRunning() {
        return this._scratchRunning;
    }

    /**
     * Tells if Whisker (more precisely, Whisker's {@link step()} function) is currently active. Always returns true,
     * unless Whisker has been stopped by a prior call to {@link end()}.
     *
     * The difference to {@link isScratchRunning()} is that isWhiskerRunning() does not necessarily tell you if the
     * Scratch program itself is currently running. For example, let a program with a single event handler be given:
     * ```
     * when [space v] key pressed
     * say [hello] for (2) seconds
     * ```
     * If Whisker sends a wait event, isWhiskerRunning() returns true since Whisker is interacting with the VM. However,
     * the Scratch program itself is not executed, since no event handler responds to the wait event, and therefore no
     * scripts are being executed. As a result, isScratchRunning() returns false.
     *
     * @returns {boolean} true if and only if Whisker has not been stopped by a call to {@link end()}, false otherwise
     * @see isScratchRunning
     */
    isWhiskerRunning() {
        return this._whiskerRunning;
    }

    /**
     * Sets Whisker to running on start.
     */
    onRunStart() {
        this._whiskerRunning = true;
    }

    /**
     * Sets Whisker to not running on stop.
     */
    onRunStop() {
        this._whiskerRunning = false;
    }

    /**
     * "Yield the thread" to give other awaits that might be unresolved a chance to resolve
     * before the next action is taken.
     */
    async _yield() {
        await new Promise(resolve => setImmediate(() => resolve()));
    }

    /**
     * Message to fail on constraint failure.
     * @returns {string} Failure message.
     */
    static get ON_CONSTRAINT_FAILURE_FAIL() {
        return 'fail';
    }

    /**
     * Message to stop on constraint failure.
     * @returns {string} Failure message.
     */
    static get ON_CONSTRAINT_FAILURE_STOP() {
        return 'stop';
    }

    /**
     * Message to do nothing on constraint failure.
     * @returns {string} Failure message.
     */
    static get ON_CONSTRAINT_FAILURE_NOTHING() {
        return 'nothing';
    }
}

module.exports = VMWrapper;
