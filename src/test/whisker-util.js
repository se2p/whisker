const VMWrapper = require('../vm/vm-wrapper');
const defaults = require('lodash.defaults');

class WhiskerUtil {
    constructor (vm, project, props) {

        /**
         * @type {VMWrapper}
         */
        this.vmWrapper = new VMWrapper(vm, props);

        /**
         * @type {string}
         */
        this.project = project;
    }

    /**
     * @returns {Promise<void>} .
     */
    async prepare () {
        return await this.vmWrapper.setup(this.project);
    }

    /**
     * @param {object=} props .
     * @returns {object} .
     */
    getTestDriver (props) {
        const testDriver = {};

        testDriver.vm = this.vmWrapper.vm;

        testDriver.run = this.vmWrapper.run.bind(this.vmWrapper);
        testDriver.runForTime = this.vmWrapper.runForTime.bind(this.vmWrapper);
        testDriver.runUntil = this.vmWrapper.runUntil.bind(this.vmWrapper);
        testDriver.runUntilChanges = this.vmWrapper.runUntilChanges.bind(this.vmWrapper);
        testDriver.runForSteps = this.vmWrapper.runForSteps.bind(this.vmWrapper);
        testDriver.cancelRun = this.vmWrapper.cancelRun.bind(this.vmWrapper);
        testDriver.onConstraintFailure = this.vmWrapper.onConstraintFailure.bind(this.vmWrapper);
        testDriver.getTotalTimeElapsed = this.vmWrapper.getTotalTimeElapsed.bind(this.vmWrapper);
        testDriver.getRunTimeElapsed = this.vmWrapper.getRunTimeElapsed.bind(this.vmWrapper);
        testDriver.getTotalStepsExecuted = this.vmWrapper.getTotalStepsExecuted.bind(this.vmWrapper);
        testDriver.getRunStepsExecuted = this.vmWrapper.getRunStepsExecuted.bind(this.vmWrapper);

        testDriver.getSprites = this.vmWrapper.sprites.getSprites.bind(this.vmWrapper.sprites);
        testDriver.getSpritesAtPoint = this.vmWrapper.sprites.getSpritesAtPoint.bind(this.vmWrapper.sprites);
        testDriver.getSpriteAtPoint = this.vmWrapper.sprites.getSpriteAtPoint.bind(this.vmWrapper.sprites);
        testDriver.getSprite = this.vmWrapper.sprites.getSprite.bind(this.vmWrapper.sprites);
        testDriver.getStage = this.vmWrapper.sprites.getStage.bind(this.vmWrapper.sprites);
        testDriver.getNewSprites = this.vmWrapper.sprites.getNewSprites.bind(this.vmWrapper.sprites);
        testDriver.onSpriteMoved = this.vmWrapper.sprites.onSpriteMoved.bind(this.vmWrapper.sprites);
        testDriver.onSpriteVisualChange = this.vmWrapper.sprites.onSpriteVisualChange.bind(this.vmWrapper.sprites);

        testDriver.addCallback = this.vmWrapper.callbacks.addCallback.bind(this.vmWrapper.callbacks);
        testDriver.reAddCallback = this.vmWrapper.callbacks.reAddCallback.bind(this.vmWrapper.callbacks);
        testDriver.removeCallback = this.vmWrapper.callbacks.removeCallback.bind(this.vmWrapper.callbacks);
        testDriver.clearCallbacks = this.vmWrapper.callbacks.clearCallbacks.bind(this.vmWrapper.callbacks);

        testDriver.addInput = this.vmWrapper.inputs.addInput.bind(this.vmWrapper.inputs);
        testDriver.reAddInput = this.vmWrapper.inputs.reAddInput.bind(this.vmWrapper.inputs);
        testDriver.inputImmediate = this.vmWrapper.inputs.inputImmediate.bind(this.vmWrapper.inputs);
        testDriver.removeInput = this.vmWrapper.inputs.removeInput.bind(this.vmWrapper.inputs);
        testDriver.clearInputs = this.vmWrapper.inputs.clearInputs.bind(this.vmWrapper.inputs);
        testDriver.resetMouse = this.vmWrapper.inputs.resetMouse.bind(this.vmWrapper.inputs);
        testDriver.resetKeyboard = this.vmWrapper.inputs.resetKeyboard.bind(this.vmWrapper.inputs);

        testDriver.getMousePos = this.vmWrapper.inputs.getMousePos.bind(this.vmWrapper.inputs);
        testDriver.isMouseDown = this.vmWrapper.inputs.isMouseDown.bind(this.vmWrapper.inputs);
        testDriver.isKeyDown = this.vmWrapper.inputs.isKeyDown.bind(this.vmWrapper.inputs);

        testDriver.registerRandomInputs = this.vmWrapper.randomInputs.registerRandomInputs
            .bind(this.vmWrapper.randomInputs);
        testDriver.clearRandomInputs = this.vmWrapper.randomInputs.clearRandomInputs
            .bind(this.vmWrapper.randomInputs);
        testDriver.setRandomInputInterval = this.vmWrapper.randomInputs.setRandomInputInterval
            .bind(this.vmWrapper.randomInputs);

        testDriver.addConstraint = this.vmWrapper.constraints.addConstraint.bind(this.vmWrapper.constraints);
        testDriver.reAddConstraint = this.vmWrapper.constraints.reAddConstraint.bind(this.vmWrapper.constraints);
        testDriver.removeConstraint = this.vmWrapper.constraints.removeConstraint.bind(this.vmWrapper.constraints);
        testDriver.clearConstraints = this.vmWrapper.constraints.clearConstraints.bind(this.vmWrapper.constraints);

        testDriver.getStageSize = this.vmWrapper.getStageSize.bind(this.vmWrapper);
        testDriver.end = this.vmWrapper.end.bind(this.vmWrapper);

        if (props.extend) {
            defaults(testDriver, props.extend);
        }

        return testDriver;
    }

    start () {
        this.vmWrapper.start();
    }

    end () {
        this.vmWrapper.end();
    }
}

module.exports = WhiskerUtil;
