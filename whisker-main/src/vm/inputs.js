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
         * @type {Inputs}
         */
        this._inputs = inputs;

        /**
         * @type {number}
          */
        this._steps = steps;

        /**
         * @type {object}
         */
        this._data = data;

        if (this._data.hasOwnProperty('key')) {
            this._data.key = Input.scratchKeyToKeyString(this._data.key);
        }

        /**
         * @type {boolean}
         */
        this._active = false;

        /**
         * @type {*}
         * Initial state is always null.
         */
        this._state = null;

        /**
         * @type {number}
         */
        this._stepsExecutedBefore = 0;

        /**
         * @type {?any}
         */
        this.name = name;
    }

    /**
     * @param {number} executedSteps .
     * @returns {boolean} If the input is done and should be removed.
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
                this._performSingle(data);
                return true;
            }
        }
        return false;
    }

    // TODO: split this method for every possible input device
    _performSingle(data) {
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
            default:
                throw new Error(`Invalid device for input ${data.device}`);
        }
    }

    /**
     * @param {object} data .
     * @returns {object} .
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
        if(data.duration !== undefined && data.steps === undefined){
            data.steps = this._inputs.vmWrapper.convertFromTimeToSteps(data.duration);
        }

        // Safety check to ensure having a step duration >= 1
        if(data.steps < 1){
            data.steps = 1;
        }

        return data;
    }

    _reset () {
        this._active = false;
        this._state = null;
        this._steps = 0;
        this._stepsExecutedBefore = 0;
    }

    isActive () {
        return this._active;
    }

    /**
     * @param {string} scratchKey .
     * @return {string} .
     */
    static scratchKeyToKeyString (scratchKey) {
        switch (scratchKey) {
        case 'space':
            return ' ';
        case 'left arrow':
            return 'Left';
        case 'up arrow':
            return 'Up';
        case 'right arrow':
            return 'Right';
        case 'down arrow':
            return 'Down';
        default:
            return scratchKey;
        }
    }
}

class Inputs {
    constructor (vmWrapper) {

        /**
         * @type {VMWrapper}
         */
        this.vmWrapper = vmWrapper;

        /**
         * @type {Input[]}
         */
        this.inputs = [];
    }

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
     * @param {number} steps.
     * @param {object} data .
     * @param {any=} name .
     * @returns {Input} .
     */
    addInput (steps, data, name) {
        const input = new Input(this, steps, {...data}, name);
        input._active = true;
        this.inputs.push(input);
        return input;
    }

    /**
     * @param {[{steps: number, input: object}]} inputs .
     */
    addInputs (inputs) {
        for (const data of inputs) {
            if(data.time !== undefined && data.steps === undefined){
                data.steps = this.vmWrapper.convertFromTimeToSteps(data.time);
            }
            this.addInput(data.steps, data.input);
        }
    }

    /**
     * @param {number} steps.
     * @param {Input} input .
     * @returns {Input} .
     */
    reAddInput (steps, input) {
        input._steps = steps;
        input._active = true;
        this.inputs.push(input);
        return input;
    }

    /**
     * @param {(object|Input)} dataOrInput .
     * @param {any=} name .
     * @returns {Input} .
     */
    inputImmediate (dataOrInput, name) {
        let input;
        const executedSteps = this.vmWrapper.isRunning()
        ? this.vmWrapper.getRunStepsExecuted() : 0

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
     * @param {Input} input .
     * @return {boolean} .
     */
    removeInput (input) {
        input._reset();
        const index = this.inputs.indexOf(input);
        if (index !== -1) {
            this.inputs.splice(index, 1);
        }
        return index !== -1;
    }

    clearInputs () {
        for (const input of this.inputs) {
            input._reset();
        }
        this.inputs = [];
    }

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

    resetKeyboard () {
        this.vmWrapper.vm.runtime.ioDevices.keyboard._keysPressed = [];
    }

    /**
     * @param {number} stepsExecuted
     */
    updateInputs (stepsExecuted) {
        for (const input of this.inputs) {
            input._stepsExecutedBefore += stepsExecuted;
        }
    }

    /**
     * @returns {{x: number, y: number}} .
     */
    getMousePos () {
        return {
            x: this.vmWrapper.vm.runtime.ioDevices.mouse.getScratchX(),
            y: this.vmWrapper.vm.runtime.ioDevices.mouse.getScratchY()
        };
    }

    /**
     * @returns {boolean} .
     */
    isMouseDown () {
        return this.vmWrapper.vm.runtime.ioDevices.mouse.getIsDown();
    }

    /**
     * @param {string} key .
     * @returns {boolean} .
     */
    isKeyDown (key) {
        const keyString = Input.scratchKeyToKeyString(key);
        const scratchKey = this.vmWrapper.vm.runtime.ioDevices.keyboard._keyStringToScratchKey(keyString);
        return this.vmWrapper.vm.runtime.ioDevices.keyboard.getKeyIsDown(scratchKey);
    }

    /**
     * Activates "when stage clicked" hats.
     */
    clickStage () {
        const stage = this.vmWrapper.sprites.getStage().getScratchTarget();
        this.vmWrapper.vm.runtime.startHats('event_whenstageclicked', null, stage);
    }
}

module.exports = {
    Input,
    Inputs
};
