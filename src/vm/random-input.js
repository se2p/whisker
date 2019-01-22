const MathUtil = require('../util/math-util');

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
         * @type {object}
         */
        this.data = data;

        /**
         * @type {number}
         */
        this.weight = data.hasOwnProperty('weight') ? data.weight : 1;

        /**
         * @type {(Input|null)}
         */
        this.input = null;
    }

    /**
     * @param {Inputs} inputs .
     */
    register (inputs) {
        const randomData = {...this.data};

        if (randomData.isDown === 'random') {
            randomData.isDown = MathUtil.randomBoolean();
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
                answer += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            randomData.answer = answer;
        }

        this.input = inputs.inputImmediate(randomData);
    }

    /**
     * @return {boolean} .
     */
    isActive () {
        return this.input !== null && this.input.isActive();
    }

    /**
     * @param {(number|number[])} prop .
     * @return {?number} .
     */
    static getRandomProp (prop) {
        if (typeof prop === 'number') {
            return prop;
        } else if (prop instanceof Array) {
            if (prop.length === 1) {
                return prop[0];
            } else if (prop.length >= 2) {
                const [min, max] = prop;
                return MathUtil.randomInt(min, max);
            }
        }
    }
}

class RandomInputs {
    constructor (vmWrapper) {
        /**
         * @type {VMWrapper}
         */
        this.vmWrapper = vmWrapper;

        /**
         * @type {RandomInput[]}
         */
        this.randomInputs = [];

        /**
         * @type {number}
         */
        this.frequency = 100;

        /**
         * @type {number}
         */
        this.lastInputTime = 0;
    }

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

        let randomWeight = MathUtil.randomFloat(0, sumOfWeights);
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
     * @param {object[]} randomInputs .
     */
    registerRandomInputs (randomInputs) {
        this.randomInputs = this.randomInputs.concat(randomInputs.map(data => new RandomInput(data)));
    }

    clearRandomInputs () {
        this.randomInputs = [];
    }

    /**
     * @param {number} frequency .
     */
    setRandomInputInterval (frequency) {
        this.frequency = frequency;
    }

    detectRandomInputs (props) {
        if (typeof props === 'undefined') {
            props = {};
        }
        if (!props.hasOwnProperty('duration')) {
            props.duration = [0, 2 * this.frequency];
        }
        if (!props.hasOwnProperty('xOffset')) {
            props.xOffset = [0, 50];
        }
        if (!props.hasOwnProperty('yOffset')) {
            props.yOffset = [0, 50];
        }

        const textFields = new Set();

        for (const target of this.vmWrapper.vm.runtime.targets) {
            if (target.hasOwnProperty('blocks')) {
                const blocks = target.blocks._blocks;
                for (const blockId of Object.keys(blocks)) {
                    this._detectRandomInput(target, blocks[blockId], textFields, props);
                }
            }
        }

        const weight = (textFields.size > 2) ? 1 / Math.log2(textFields.size) : 1;
        for (const text of textFields) {
            this.registerRandomInputs([{
                device: 'text',
                answer: text,
                weight
            }]);
        }
    }

    /**
     * @param {RenderedTarget} target .
     * @param {object} block .
     * @param {Set<string>} textFields .
     * @param {{
     *      duration:(number[]|number),
     *      xOffset: (number[]|number),
     *      yOffset: (number[]|number)
     * }} props .
     * @private
     */
    _detectRandomInput (target, block, textFields, props) {
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
            if (fields.hasOwnProperty('DISTANCETOMENU') && fields.DISTANCETOMENU.value === '_mouse_') {
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
                    textFields.add(target.blocks.getFields(op2).TEXT.value);
                }
            }
            if (target.blocks.getOpcode(op2) === 'sensing_answer') {
                if (target.blocks.getOpcode(op1) === 'text') {
                    textFields.add(target.blocks.getFields(op1).TEXT.value);
                }
            }
            break;
        }
        }
    }
}

module.exports = {
    RandomInput,
    RandomInputs
};
