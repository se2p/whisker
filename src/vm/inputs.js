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
    constructor (inputs, time, data, name) {

        /**
         * @type {Inputs}
         */
        this._inputs = inputs;

        /**
         * @type {number}
         */
        this._time = time;

        /**
         * @type {object}
         */
        this._data = data;

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
        this._timeElapsedBefore = 0;

        /**
         * @type {?any}
         */
        this.name = name;
    }

    /**
     * @param {number} elapsedTime .
     * @returns {boolean} If the input is done and should be removed.
     */
    _perform (elapsedTime) {
        if (elapsedTime >= this._time - this._timeElapsedBefore) {
            if (!this._state) {
                this._inputs.vmWrapper.vm.postIOData(this._data.device, this._convertData(this._data));
                if (this._data.duration) {
                    this._state = true;
                } else {
                    return true;
                }
            }
            if (this._state && elapsedTime >= this._data.duration + this._time - this._timeElapsedBefore) {
                const data = this._convertData(this._data);
                data.isDown = !data.isDown;
                this._inputs.vmWrapper.vm.postIOData(this._data.device, data);
                return true;
            }
        }
        return false;
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

        if (data.device !== 'mouse') {
            return data;
        }

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

        return data;
    }

    _reset () {
        this._active = false;
        this._state = null;
        this._time = 0;
        this._timeElapsedBefore = 0;
    }

    isActive () {
        return this._active;
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
        const runTimeElapsed = this.vmWrapper.getRunTimeElapsed();
        const inputsToPerform = [...this.inputs];

        for (const input of inputsToPerform) {
            if (input._perform(runTimeElapsed)) {
                this.removeInput(input);
            }
        }
    }

    /**
     * @param {number} time .
     * @param {(object|Input)} dataOrInput .
     * @param {any=} name .
     * @returns {Input} .
     */
    addInput (time, dataOrInput, name) {
        let input;

        if (dataOrInput instanceof Input) {
            input = dataOrInput;
            this.removeInput(input);
            input._time = time;
        } else {
            input = new Input(this, time, {...dataOrInput}, name);
        }

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
        const runTimeElapsed = this.vmWrapper.getRunTimeElapsed();

        if (dataOrInput instanceof Input) {
            input = dataOrInput;
        } else {
            input = new Input(this, runTimeElapsed, {...dataOrInput}, name);
        }

        input._active = true;

        if (!input._perform(runTimeElapsed)) {
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
        this.vmWrapper.vm.postIOData('mouse', {
            x: clientPos.x,
            y: clientPos.y,
            isDown: false
        });
    }

    resetKeyboard () {
        this.vmWrapper.vm.runtime.ioDevices.keyboard._keysPressed = [];
    }

    /**
     * @param {number} runTimeElapsed .
     */
    updateInputs (runTimeElapsed) {
        for (const input of this.inputs) {
            input._timeElapsedBefore += runTimeElapsed;
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
        const scratchKey = this.vmWrapper.vm.runtime.ioDevices.keyboard._keyStringToScratchKey(key);
        return this.vmWrapper.vm.runtime.ioDevices.keyboard.getKeyIsDown(scratchKey);
    }
}

module.exports = {
    Input,
    Inputs
};