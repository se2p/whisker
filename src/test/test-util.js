const VMWrapper = require('../vm/vm-wrapper');
const defaults = require('lodash.defaults');

class WhiskerUtil {
    constructor (vm, project) {

        /**
         * @type {VMWrapper}
         */
        this.vmWrapper = new VMWrapper(vm);

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
     * @param {object} extraMembers .
     * @returns {object} .
     */
    getTestDriver (extraMembers) {
        const testDriver = {};
        testDriver.vm = this.vmWrapper.vm;

        testDriver.run = this.vmWrapper.run.bind(this.vmWrapper);
        testDriver.runForTime = this.vmWrapper.runForTime.bind(this.vmWrapper);
        testDriver.runUntil = this.vmWrapper.runUntil.bind(this.vmWrapper);
        testDriver.cancelRun = this.vmWrapper.cancelRun.bind(this.vmWrapper);
        testDriver.onConstraintFailure = this.vmWrapper.onConstraintFailure.bind(this.vmWrapper);
        testDriver.getTotalTimeElapsed = this.vmWrapper.getTotalTimeElapsed.bind(this.vmWrapper);
        testDriver.getRunTimeElapsed = this.vmWrapper.getRunTimeElapsed.bind(this.vmWrapper);

        testDriver.getSprites = this.vmWrapper.sprites.getSprites.bind(this.vmWrapper.sprites);
        testDriver.getSpritesAtPoint = this.vmWrapper.sprites.getSpritesAtPoint.bind(this.vmWrapper.sprites);
        testDriver.getSprite = this.vmWrapper.sprites.getSprite.bind(this.vmWrapper.sprites);
        testDriver.getStage = this.vmWrapper.sprites.getStage.bind(this.vmWrapper.sprites);

        testDriver.addCallback = this.vmWrapper.callbacks.addCallback.bind(this.vmWrapper.callbacks);
        testDriver.removeCallback = this.vmWrapper.callbacks.removeCallback.bind(this.vmWrapper.callbacks);
        testDriver.clearCallbacks = this.vmWrapper.callbacks.clearCallbacks.bind(this.vmWrapper.callbacks);

        testDriver.addInput = this.vmWrapper.inputs.addInput.bind(this.vmWrapper.inputs);
        testDriver.removeInput = this.vmWrapper.inputs.removeInput.bind(this.vmWrapper.inputs);
        testDriver.clearInputs = this.vmWrapper.inputs.clearInputs.bind(this.vmWrapper.inputs);
        testDriver.resetMouse = this.vmWrapper.inputs.resetMouse.bind(this.vmWrapper.inputs);
        testDriver.resetKeyboard = this.vmWrapper.inputs.resetKeyboard.bind(this.vmWrapper.inputs);

        testDriver.getMousePos = this.vmWrapper.inputs.getMousePos.bind(this.vmWrapper.inputs);
        testDriver.isMouseDown = this.vmWrapper.inputs.isMouseDown.bind(this.vmWrapper.inputs);
        testDriver.isKeyDown = this.vmWrapper.inputs.isKeyDown.bind(this.vmWrapper.inputs);

        testDriver.addConstraint = this.vmWrapper.constraints.addConstraint.bind(this.vmWrapper.constraints);
        testDriver.removeConstraint = this.vmWrapper.constraints.removeConstraint.bind(this.vmWrapper.constraints);
        testDriver.clearConstraints = this.vmWrapper.constraints.clearConstraints.bind(this.vmWrapper.constraints);

        testDriver.getStageSize = this.vmWrapper.getStageSize.bind(this.vmWrapper);
        testDriver.end = this.vmWrapper.stop.bind(this.vmWrapper);

        defaults(testDriver, extraMembers);
        return testDriver;
    }

    start () {
        this.vmWrapper.start();
    }

    end () {
        this.vmWrapper.stop();
    }
}

module.exports = WhiskerUtil;
