const Util = require("./util");

/**
 * Input data parameters:
 * {
 *     device,
 *     isDown,
 *     key,
 *     x,
 *     y,
 *     sprite,
 *     xOffset,
 *     yOffset,
 *     duration
 *         Just used to release keys for now
 *         Maybe use it to smoothly move the mouse later
 *         A duration of 0 means only one action
 * }
 */
class Input {
    constructor (inputs, steps, data, name) {

        /**
         * @type {Inputs} The given inputs.
         */
        this._inputs = inputs;

        /**
         * @type {number} The given steps duration.
         */
        this._steps = steps;

        /**
         * @type {object} The given data object.
         */
        this._data = data;

        if (this._data.hasOwnProperty('key')) {
            this._data.key = Util.scratchKeyToKeyString(this._data.key);
        }

        /**
         * @type {boolean} Indicates if the input is currently active.
         */
        this._active = false;

        /**
         * @type {*} Initial state is always null.
         */
        this._state = null;

        /**
         * @type {number} The number of executed steps before the input.
         */
        this._stepsExecutedBefore = 0;

        /**
         * @type {?any} The input name.
         */
        this.name = name;
    }

    /**
     * Performs the scratch input.
     * @param {number} executedSteps Indicates the steps to execute.
     * @returns {boolean} true if the input is done and should be removed, false otherwise.
     */
    // TODO: split this method for every possible input device
    _perform (executedSteps) {
        if (executedSteps >= this._steps - this._stepsExecutedBefore) {
            const data = this._convertData(this._data);
            if (!this._state) {
                this._performSingle(data);
                if (data.steps && this._data.device !== 'drag') {
                    this._state = true;
                } else {
                    return true;
                }
            }
            if (this._state && executedSteps >= data.steps + this._steps - this._stepsExecutedBefore) {
                data.isDown = !data.isDown;
                data.volume = -1;
                this._performSingle(data);
                return true;
            }
        }
        return false;
    }

    /**
     * Performs a single data input and executes it according to the input device.
     * @param data The recorded input.
     * @private
     */
    // TODO: split this method for every possible input device
    _performSingle (data) {
        switch (data.device) {
            case 'mouse':
            case 'keyboard':
                this._inputs.vmWrapper.vm.postIOData(data.device, data);
                break;
            case 'text':
                this._inputs.vmWrapper.vm.runtime.emit('ANSWER', data.answer);
                break;
            case 'drag':
                this._inputs.vmWrapper.sprites.getSprite(data.sprite).getScratchTarget().setXY(data.x, data.y)
                break;
            case 'microphone':
                this._inputs.vmWrapper.vm.runtime.virtualSound = data.volume;
                break;
            default:
                throw new Error(`Invalid device for input ${data.device}`);
        }
    }

    /**
     * Converts the given data input.
     * @param {object} data The input data.
     * @returns {object} The converted data.
     */
    _convertData (data) {
        data = {...data};

        if (data.isDown === 'toggle') {
            if (data.device === 'mouse') {
                data.isDown = !this._inputs.isMouseDown();
            } else if (data.device === 'keyboard') {
                data.isDown = !this._inputs.isKeyDown(data.key);
            }
        }

        if (data.device === 'mouse') {
            if (data.sprite) {
                data.x = data.sprite.x;
                data.y = data.sprite.y;
            } else {
                const mousePos = this._inputs.getMousePos();
                if (!data.hasOwnProperty('x')) {
                    data.x = mousePos.x;
                }
                if (!data.hasOwnProperty('y')) {
                    data.y = mousePos.y;
                }
            }

            data.x += data.xOffset || 0;
            data.y += data.yOffset || 0;

            /* Convert coordinates to client coordinates. */
            const {x, y} = this._inputs.vmWrapper.getClientCoords(data.x, data.y);
            data.x = x;
            data.y = y;

            const canvasRect = this._inputs.vmWrapper.getCanvasRect();
            data.canvasWidth = canvasRect.width;
            data.canvasHeight = canvasRect.height;

        } else if (data.device === 'drag') {
            if (!data.hasOwnProperty('x')) {
                data.x = data.sprite.x;
            }
            if (!data.hasOwnProperty('y')) {
                data.y = data.sprite.y;
            }

            data.x += data.xOffset || 0;
            data.y += data.yOffset || 0;
        }


        //Convert time to steps; Ensures backwards compatibility with old Whisker-Tests.
        if (data.duration !== undefined && data.steps === undefined) {
            data.steps = this._inputs.vmWrapper.convertFromTimeToSteps(data.duration);
        }

        // Safety check to ensure having a step duration >= 1
        if (data.steps < 1) {
            data.steps = 1;
        }

        return data;
    }

    /**
     * Resets the input state and steps.
     * @private
     */
    _reset () {
        this._active = false;
        this._state = null;
        this._steps = 0;
        this._stepsExecutedBefore = 0;
    }

    /**
     * Evaluates if the input is currently active.
     * @returns {boolean} true if input is active, false otherwise.
     */
    isActive () {
        return this._active;
    }
}

class Inputs {
    constructor (vmWrapper) {

        /**
         * @type {VMWrapper} The given vm wrapper.
         */
        this.vmWrapper = vmWrapper;

        /**
         * @type {Input[]} The stored inputs.
         */
        this.inputs = [];
    }

    /**
     * Executes the stored inputs.
     */
    performInputs () {
        const stepsExecuted = this.vmWrapper.getRunStepsExecuted();
        const inputsToPerform = [...this.inputs];

        for (const input of inputsToPerform) {
            if (input._perform(stepsExecuted)) {
                this.removeInput(input);
            }
        }
    }

    /**
     * Adds one input to execute.
     * @param {number} steps The step duration.
     * @param {object} data The input data.
     * @param {any=} name The input name.
     * @returns {Input} The added input.
     */
    addInput (steps, data, name) {
        const input = new Input(this, steps, {...data}, name);
        input._active = true;
        this.inputs.push(input);
        return input;
    }

    /**
     * Adds an array of inputs to execute.
     * @param {[{steps: number, input: object}]} inputs An array of input data with corresponding steps.
     */
    addInputs (inputs) {
        for (const data of inputs) {
            if (data.time !== undefined && data.steps === undefined) {
                data.steps = this.vmWrapper.convertFromTimeToSteps(data.time);
            }
            this.addInput(data.steps, data.input);
        }
    }

    /**
     * Re-adds an input to execute.
     * @param {number} steps The step duration.
     * @param {Input} input The input to add.
     * @returns {Input} The added input.
     */
    reAddInput (steps, input) {
        input._steps = steps;
        input._active = true;
        this.inputs.push(input);
        return input;
    }

    /**
     * Executes a specific input data immediately.
     * @param {(object|Input)} dataOrInput  The input or data to execute.
     * @param {any=} name The name of the input.
     * @returns {Input} The executed input.
     */
    inputImmediate (dataOrInput, name) {
        let input;
        const executedSteps = this.vmWrapper.isScratchRunning()
            ? this.vmWrapper.getRunStepsExecuted() : 0;

        if (dataOrInput instanceof Input) {
            input = dataOrInput;
        } else {
            input = new Input(this, executedSteps, {...dataOrInput}, name);
        }

        input._active = true;
        if (input._perform(executedSteps)) {
            input._reset();
        } else {
            this.inputs.push(input);
        }

        return input;
    }

    /**
     * Deletes a specific input from the inputs array.
     * @param {Input} input The input to remove.
     * @return {boolean} true if the input was successfully removed, false otherwise.
     */
    removeInput (input) {
        input._reset();
        const index = this.inputs.indexOf(input);
        if (index !== -1) {
            this.inputs.splice(index, 1);
        }
        return index !== -1;
    }

    /**
     * Clears the whole input array after resetting the input data inside.
     */
    clearInputs () {
        for (const input of this.inputs) {
            input._reset();
        }
        this.inputs = [];
    }

    /**
     * Resets the mouse to its default settings.
     */
    resetMouse () {
        const clientPos = this.vmWrapper.getClientCoords(0, 0);
        const canvasRect = this.vmWrapper.getCanvasRect();

        this.vmWrapper.vm.postIOData('mouse', {
            x: clientPos.x,
            y: clientPos.y,
            isDown: false,
            canvasWidth: canvasRect.width,
            canvasHeight: canvasRect.height
        });
    }

    /**
     * Resets the keyboard to its default settings.
     */
    resetKeyboard () {
        this.vmWrapper.vm.runtime.ioDevices.keyboard._keysPressed = [];
    }

    /**
     * Updates the executed steps before the input is executed.
     * @param {number} stepsExecuted The steps to add.
     */
    updateInputs (stepsExecuted) {
        for (const input of this.inputs) {
            input._stepsExecutedBefore += stepsExecuted;
        }
    }

    /**
     * Gives back the current position of the mouse on the scratch canvas.
     * @returns {{x: number, y: number}} The mouse pos.
     */
    getMousePos () {
        return {
            x: this.vmWrapper.vm.runtime.ioDevices.mouse.getScratchX(),
            y: this.vmWrapper.vm.runtime.ioDevices.mouse.getScratchY()
        };
    }

    /**
     * Evaluates if the mouse is currently pressed.
     * @returns {boolean} true if mouse is down, false otherwise.
     */
    isMouseDown () {
        return this.vmWrapper.vm.runtime.ioDevices.mouse.getIsDown();
    }

    /**
     * Evaluates if a specific key is currently pressed.
     * @param {string} keyString The key to check.
     * @returns {boolean} true if key is pressed, false otherwise.
     */
    isKeyDown (keyString) {
        const scratchKey = Util.keyStringToScratchKey(keyString);
        return this.vmWrapper.vm.runtime.ioDevices.keyboard.getKeyIsDown(scratchKey);
    }

    /**
     * Clicks the stage on the scratch canvas.
     * Activates "when stage clicked" hats.
     */
    clickStage () {
        const stage = this.vmWrapper.sprites.getStage().getScratchTarget();
        this.vmWrapper.vm.runtime.startHats('event_whenstageclicked', null, stage);
    }

    /**
     * Clicks a specific {@link Sprite} for a number of steps.
     * @param {string} spriteName The name of the sprite to click.
     * @param {number} steps The time in steps.
     */
    clickSprite (spriteName, steps= 1 ) {
        if (this.vmWrapper.getTargetBySpriteName(spriteName) != null) {
            this.vmWrapper.vm.runtime.startHats('event_whenthisspriteclicked', null, this.vmWrapper.getTargetBySpriteName(spriteName));
        }
    }

    /**
     * Clicks the given clone of a sprite for a number of steps.
     * @param {Sprite} clone The given clone to click.
     * @param {number} steps The time in steps.
     */
    clickClone (clone, steps= 1) {
        this.inputImmediate({
            device: 'mouse',
            x: clone.x,
            y: clone.y,
            isDown: true,
            steps: steps
        });
    }

    /**
     * Clicks the clone of a sprite by its (x, y) position on the scratch canvas for a number of steps.
     * @param x The x coordinate of the clone.
     * @param y The y coordinate of the clone.
     * @param {number} steps The time in steps.
     */
    clickCloneByCoords (x, y, steps = 1) {
        if (this.vmWrapper.getTargetBySpriteCoords(x, y) != null) {
            this.inputImmediate({
                device: 'mouse',
                x: x,
                y: y,
                isDown: true,
                steps: steps
            });
        }
    }

    /**
     * Drags a specific {@link Sprite} to the position (x, y) on the scratch canvas.
     * When writing Whisker-Tests we first have to find the corresponding target by searching for its name.
     * @param {string} spriteName The name of the sprite to move.
     * @param {number} x The x coordinate of the end position.
     * @param {number} y The y coordinate of the end position.
     * @param {number | null} cloneID determines whether and which clone should be dragged.
     */
    dragSprite (spriteName, x, y, cloneID) {
        let target = this.vmWrapper.getTargetBySpriteName(spriteName);
        if(cloneID !== null){
            target = target.sprite.clones.find(target => target.cloneID === cloneID);
        }
        if (target != null) {
            target.setXY(x, y, true, true);
        }
    }

    /**
     * Presses a specific key for a number of steps.
     * The given scratch key has to be converted into a keyboard key event.
     * @param {string} key The key to press.
     * @param {number} steps The time in steps.
     */
    keyPress (key, steps) {
        const keyString = Util.scratchKeyToKeyString(key);
        this.inputImmediate({
            device: 'keyboard',
            key: keyString,
            isDown: true,
            steps: steps
        });
    }

    /**
     * Releases a specific key for a number of steps.
     * The given scratch key has to be converted into a keyboard key event.
     * @param {string} key The key to release.
     * @param {number} steps The time in steps.
     */
    keyRelease (key, steps) {
        const keyString = Util.scratchKeyToKeyString(key);
        this.inputImmediate({
            device: 'keyboard',
            key: keyString,
            isDown: false,
            steps: steps
        });
    }

    /**
     * Sets the mouse down property to the given value.
     * @param {boolean} value Indicates if the mouse is pressed or not.
     */
    mouseDown (value) {
        this.inputImmediate({
            device: 'mouse',
            isDown: value
        });
    }

    /**
     * Presses the left mouse button for the given amount of steps.
     * @param {number} steps The number of steps indicating how long the mouse button should be pressed.
     */
    mouseDownForSteps (steps = 1) {
        this.inputImmediate({
            device: 'mouse',
            isDown: true,
            steps: steps
        });
    }

    /**
     * Moves the mouse to a specific position (x, y) for a number of steps.
     * @param {number} x The x coordinate of the end position.
     * @param {number} y The y coordinate of the end position.
     * @param {number} steps The time in steps.
     */
    mouseMove (x, y, steps) {
        this.inputImmediate({
            device: 'mouse',
            x: Math.trunc(x),
            y: Math.trunc(y),
            steps: steps
        });
    }

    /**
     * Sets the answer string for a scratch ask block.
     * @param {string} answer The given input answer.
     */
    typeText (answer) {
        this.inputImmediate({
            device: 'text',
            answer: answer
        });
    }

    /**
     * Sends a sound to the Scratch-VM by simulating a given volume.
     * @param {number} volume of the simulated sound.
     * @param {number} steps defines for how many steps the sound should be sent to the Scratch-VM.
     */
    sendSound(volume, steps = 1){
        Math.max(Math.min(volume, 100), 0);
        this.inputImmediate({
            device: 'microphone',
            volume: volume,
            steps: steps
        });
    }
}

module.exports = {
    Input,
    Inputs
};
