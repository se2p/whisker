const defaults = require('lodash.defaults');

class Input {
    constructor (inputs, time, device, data, name) {

        /**
         * @type {Inputs}
         */
        this._inputs = inputs;

        /**
         * @type {number}
         * @private
         */
        this._time = time;

        /**
         * @type {string}
         * @private
         */
        this._device = device;

        /**
         * @type {object}
         * @private
         */
        this._data = data;

        /**
         * @type {boolean}
         */
        this._active = true;

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
     * @param {VirtualMachine} vm .
     * @returns {boolean} .
     */
    _perform (elapsedTime, vm) {
        if (elapsedTime >= this._time - this._timeElapsedBefore) {
            vm.postIOData(this._device, this._inputs.convertData(this._data));
            return true;
        }
        return false;
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

    /**
     * @param {number} elapsedTime .
     */
    performInputs (elapsedTime) {
        const inputsToPerform = [...this.inputs];

        for (const input of inputsToPerform) {
            if (input._perform(elapsedTime, this.vmWrapper.vm)) {
                this.removeInput(input);
            }
        }
    }

    /**
     * @param {(number|Input)} timeOrInput .
     * @param {string=} device .
     * @param {object=} data .
     * @param {any=} name .
     * @returns {Input} .
     */
    addInput (timeOrInput, device, data, name) {
        let input;

        if (timeOrInput instanceof Input) {
            input = timeOrInput;
            this.removeInput(input);
        } else {
            input = new Input(this, timeOrInput, device, {...data}, name);
        }

        input._active = true;
        this.inputs.push(input);
        return input;
    }

    /**
     * @param {Input} input .
     * @return {boolean} .
     */
    removeInput (input) {
        input._active = false;
        input._timeElapsedBefore = 0;
        const index = this.inputs.indexOf(input);
        if (index !== -1) {
            this.inputs.splice(index, 1);
        }
        return index !== -1;
    }

    clearInputs () {
        for (const input of this.inputs) {
            input._active = false;
            input._timeElapsedBefore = 0;
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

    // TODO remove
    getClientMousePos () {
        return {
            x: this.vmWrapper.vm.runtime.ioDevices.mouse.getClientX(),
            y: this.vmWrapper.vm.runtime.ioDevices.mouse.getClientY()
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
        return this.vmWrapper.vm.runtime.ioDevices.keyboard.isKeyDown(key);
    }

    /**
     * @param {object} data .
     * @returns {object} .
     */
    convertData (data) {
        const newData = {};

        /* Convert coordinates to client coordinates. */
        if (data.x || data.y) {
            const x = data.x || 0;
            const y = data.y || 0;
            const clientCoords = this.vmWrapper.getClientCoords(x, y);

            if (data.x) {
                newData.x = clientCoords.x;
            }
            if (data.y) {
                newData.y = clientCoords.y;
            }

            const canvasRect = this.vmWrapper.vm.runtime.renderer.gl.canvas.getBoundingClientRect();
            newData.canvasWidth = canvasRect.width;
            newData.canvasHeight = canvasRect.height;
        }

        defaults(newData, data);
        return newData;
    }
}

module.exports = {
    Input,
    Inputs
};
