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
 *     duration: [ ]
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

        for (const prop of ['duration', 'x', 'y', 'xOffset', 'yOffset']) {
            if (randomData.hasOwnProperty(prop)) {
                randomData[prop] = RandomInput.getRandomProp(randomData[prop]);
            }
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
                return MathUtil.randomFloat(min, max);
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

        const runTimeElapsed = this.vmWrapper.getRunTimeElapsed();

        if (runTimeElapsed < this.lastInputTime + this.frequency) {
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
                this.lastInputTime = runTimeElapsed;
                randomInput.register(this.vmWrapper.inputs);
                return;
            }
            randomWeight -= randomInput.weight;
        }
    }

    /**
     * @param {RandomInput[]} randomInputs .
     */
    registerRandomInputs (randomInputs) {
        this.randomInputs =
            this.randomInputs.concat(randomInputs.map(data => new RandomInput(data)));
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
}

module.exports = {
    RandomInput,
    RandomInputs
};
