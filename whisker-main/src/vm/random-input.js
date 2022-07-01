const {Randomness} = require("../whisker/utils/Randomness");

/**
 * {
 *     device,
 *     isDown: true / false / 'random'
 *     key,
 *     x: [ ],
 *     y: [ ],
 *     sprite,
 *     xOffset: [ ],
 *     yOffset: [ ],
 *     duration: [ ],
 *     answer, // for text
 *     length: [ ] // for text
 *     chars: [ ] // for text
 *     TODO "group": only have one input active at a time for every group?
 * }
 */
class RandomInput {
    constructor (data) {
        /**
         * @type {object} Given input data.
         */
        this.data = data;

        /**
         * @type {number} Weight property of data input.
         */
        this.weight = data.hasOwnProperty('weight') ? data.weight : 1;

        /**
         * @type {(Input|null)} Converted input from given data.
         */
        this.input = null;
    }

    /**
     * Registers the random input data.
     * @param {Inputs} inputs Input from vm wrapper to register.
     */
    register (inputs) {
        const randomData = {...this.data};

        if (randomData.isDown === 'random') {
            randomData.isDown = Randomness.getInstance().randomBoolean();
        }

        for (const prop of ['duration', 'x', 'y', 'xOffset', 'yOffset', 'length']) {
            if (randomData.hasOwnProperty(prop)) {
                randomData[prop] = RandomInput.getRandomProp(randomData[prop]);
            }
        }

        if (randomData.device === 'text') {
            let answer = (typeof randomData.answer === 'undefined') ? '' : randomData.answer;
            const length = (typeof randomData.length === 'undefined') ? 0 : randomData.length;
            const chars = (typeof randomData.answer === 'undefined') ?
                '0123456789abcdefghijklmnopqrstuvwxyzABCDDEFGHIJKLMNOPQRSTUVWXYZ' : randomData.chars;

            for (let i = 0; i < length; i++) {
                answer += chars.charAt(Randomness.getInstance().nextInt(0, chars.length - 1));
            }

            randomData.answer = answer;
        }

        this.input = inputs.inputImmediate(randomData);
    }

    /**
     * Evaluates if a current input exists or is active.
     * @return {boolean} true if input exists, false otherwise.
     */
    isActive () {
        return this.input !== null && this.input.isActive();
    }

    /**
     * Gives back a random property from a given properties array.
     * @param {(number|number[])} prop The properties to choose from.
     * @return {?number} A random property.
     */
    static getRandomProp (prop) {
        if (typeof prop === 'number') {
            return prop;
        } else if (prop instanceof Array) {
            if (prop.length === 1) {
                return prop[0];
            } else if (prop.length >= 2) {
                const [min, max] = prop;
                return Randomness.getInstance().nextInt(min, max);
            }
        }
    }
}


class RandomInputs {
    constructor (vmWrapper) {
        /**
         * @type {VMWrapper} The given vm wrapper.
         */
        this.vmWrapper = vmWrapper;

        /**
         * @type {RandomInput[]} Array of random inputs.
         */
        this.randomInputs = [];

        /**
         * @type {number} The random input interval time.
         */
        this.frequency = 100;

        /**
         * @type {number} The last time an input data was given.
         */
        this.lastInputTime = 0;
    }

    /**
     * Generated a random input and registers it.
     */
    performRandomInput () {
        if (!this.randomInputs.length) {
            return;
        }

        const timeElapsed = this.vmWrapper.getTotalTimeElapsed();

        if (timeElapsed < this.lastInputTime + this.frequency) {
            return;
        }

        const inactiveInputs = this.randomInputs.filter(randomInput => !randomInput.isActive());

        if (!inactiveInputs.length) {
            return;
        }

        let sumOfWeights = 0;
        for (const randomInput of inactiveInputs) {
            sumOfWeights += randomInput.weight;
        }

        if (!sumOfWeights) {
            return;
        }

        let randomWeight = Randomness.getInstance().nextDoubleMinMax(0, sumOfWeights);
        for (const randomInput of inactiveInputs) {
            if (randomInput.weight > randomWeight) {
                this.lastInputTime = timeElapsed;
                randomInput.register(this.vmWrapper.inputs);
                return;
            }
            randomWeight -= randomInput.weight;
        }
    }

    /**
     * Generates an array of random inputs.
     * @param {object[]} randomInputs An array of random inputs.
     */
    registerRandomInputs (randomInputs) {
        this.randomInputs = this.randomInputs.concat(randomInputs.map(data => new RandomInput(data)));
    }

    /**
     * Clears the stored array of random inputs.
     */
    clearRandomInputs () {
        this.randomInputs = [];
    }

    /**
     * Sets a new value for the random input interval times.
     * @param {number} frequency The new frequency value.
     */
    setRandomInputInterval (frequency) {
        this.frequency = frequency;
    }

    /**
     * Detects random inputs.
     * @param props A list of properties.
     */
    detectRandomInputs (props) {
        if (typeof props === 'undefined') {
            props = {};
        }
        if (!props.hasOwnProperty('duration')) {
            props.duration = [0, 2 * this.frequency];
        }
        if (!props.hasOwnProperty('xOffset')) {
            props.xOffset = [-50, 50];
        }
        if (!props.hasOwnProperty('yOffset')) {
            props.yOffset = [-50, 50];
        }

        for (const target of this.vmWrapper.vm.runtime.targets) {
            if (target.hasOwnProperty('blocks')) {
                for (const blockId of Object.keys(target.blocks._blocks)) {
                    this._detectRandomInput(target, target.blocks.getBlock(blockId), props);
                }
            }
        }
    }

    /**
     * Detects random input of a specific target block.
     * @param {RenderedTarget} target The target sprite.
     * @param {object} block A block to work on.
     * @param {{
     *      duration:(number[]|number),
     *      xOffset: (number[]|number),
     *      yOffset: (number[]|number)
     * }} props A list of properties.
     * @private
     */
    _detectRandomInput (target, block, props) {
        if (typeof block.opcode === 'undefined') {
            return;
        }

        const fields = target.blocks.getFields(block);
        const stageSize = this.vmWrapper.getStageSize();

        switch (target.blocks.getOpcode(block)) {
        case 'event_whenkeypressed':
        case 'sensing_keyoptions':
            this.registerRandomInputs([{
                device: 'keyboard',
                key: fields.KEY_OPTION.value,
                duration: props.duration
            }]);
            break;
        case 'sensing_mousex':
        case 'sensing_mousey':
            this.registerRandomInputs([{
                device: 'mouse',
                x: [-(stageSize.width / 2), stageSize.width / 2],
                y: [-(stageSize.height / 2), stageSize.height / 2]
            }]);
            break;
        case 'sensing_distancetomenu':
            if (fields.hasOwnProperty('DISTANCETOMENU') && fields.DISTANCETOMENU.value === '_mouse_') {
                this.registerRandomInputs([{
                    device: 'mouse',
                    x: [-(stageSize.width / 2), stageSize.width / 2],
                    y: [-(stageSize.height / 2), stageSize.height / 2]
                }]);
            }
            break;
        case 'event_whenthisspriteclicked': {
            const sprite = this.vmWrapper.sprites.wrapTarget(target);
            if (sprite === this.vmWrapper.sprites.getStage()) {
                this.registerRandomInputs([{
                    device: 'mouse',
                    isDown: 'toggle',
                    x: [-(stageSize.width / 2), stageSize.width / 2],
                    y: [-(stageSize.height / 2), stageSize.height / 2],
                    duration: props.duration
                }]);
            } else {
                this.registerRandomInputs([{
                    device: 'mouse',
                    isDown: 'toggle',
                    sprite: this.vmWrapper.sprites.wrapTarget(target),
                    xOffset: props.xOffset,
                    yOffset: props.yOffset,
                    duration: props.duration
                }]);
            }
            break;
        }
        case 'event_whenstageclicked':
            this.registerRandomInputs([{
                device: 'mouse',
                isDown: 'toggle',
                x: [-(stageSize.width / 2), stageSize.width / 2],
                y: [-(stageSize.height / 2), stageSize.height / 2],
                duration: props.duration
            }]);
            break;
        case 'sensing_mousedown':
            this.registerRandomInputs([{
                device: 'mouse',
                isDown: 'toggle',
                duration: props.duration
            }]);
            break;
        case 'sensing_touchingobjectmenu':
            if (fields.hasOwnProperty('TOUCHINGOBJECTMENU') && fields.TOUCHINGOBJECTMENU.value === '_mouse_') {
                const sprite = this.vmWrapper.sprites.wrapTarget(target);
                if (sprite === this.vmWrapper.sprites.getStage()) {
                    this.registerRandomInputs([{
                        device: 'mouse',
                        x: [-(stageSize.width / 2), stageSize.width / 2],
                        y: [-(stageSize.height / 2), stageSize.height / 2]
                    }]);
                } else {
                    this.registerRandomInputs([{
                        device: 'mouse',
                        sprite: this.vmWrapper.sprites.wrapTarget(target),
                        xOffset: props.xOffset,
                        yOffset: props.yOffset
                    }]);
                }
            }
            break;
        case 'sensing_askandwait':
            this.registerRandomInputs([{
                device: 'text',
                length: [1, 3]
            }]);
            break;
        case 'operator_equals': {
            const inputs = target.blocks.getInputs(block);
            const op1 = target.blocks.getBlock(inputs.OPERAND1.block);
            const op2 = target.blocks.getBlock(inputs.OPERAND2.block);
            if (target.blocks.getOpcode(op1) === 'sensing_answer') {
                if (target.blocks.getOpcode(op2) === 'text') {
                    this.registerRandomInputs([{
                        device: 'text',
                        answer: target.blocks.getFields(op2).TEXT.value
                    }]);
                }
            }
            if (target.blocks.getOpcode(op2) === 'sensing_answer') {
                if (target.blocks.getOpcode(op1) === 'text') {
                    this.registerRandomInputs([{
                        device: 'text',
                        answer: target.blocks.getFields(op1).TEXT.value
                    }]);
                }
            }
            break;
        }
        case 'motion_pointtowards_menu':
            if (fields.hasOwnProperty('TOWARDS') && fields.TOWARDS.value === '_mouse_') {
                this.registerRandomInputs([{
                    device: 'mouse',
                    x: [-(stageSize.width / 2), stageSize.width / 2],
                    y: [-(stageSize.height / 2), stageSize.height / 2]
                }]);
            }
            break;
        }
    }
}

module.exports = {
    RandomInput,
    RandomInputs
};
