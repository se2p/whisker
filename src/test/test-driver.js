const defaults = require('lodash.defaults');
const random = require('../util/random');

class TestDriver {
    /**
     * @param {VMWrapper} vmWrapper .
     * @param {object} props .
     */
    // TODO: get rid of clear... methods
    constructor (vmWrapper, props) {
        this.vmWrapper = vmWrapper;
        this.vm = vmWrapper.vm;

        this.run = vmWrapper.run.bind(vmWrapper);
        this.runForTime = vmWrapper.runForTime.bind(vmWrapper);
        this.runUntil = vmWrapper.runUntil.bind(vmWrapper);
        this.runUntilChanges = vmWrapper.runUntilChanges.bind(vmWrapper);
        this.runForSteps = vmWrapper.runForSteps.bind(vmWrapper);
        this.cancelRun = vmWrapper.cancelRun.bind(vmWrapper);
        this.onConstraintFailure = vmWrapper.onConstraintFailure.bind(vmWrapper);
        this.getTotalTimeElapsed = vmWrapper.getTotalTimeElapsed.bind(vmWrapper);
        this.getRunTimeElapsed = vmWrapper.getRunTimeElapsed.bind(vmWrapper);
        this.getTotalStepsExecuted = vmWrapper.getTotalStepsExecuted.bind(vmWrapper);
        this.getRunStepsExecuted = vmWrapper.getRunStepsExecuted.bind(vmWrapper);
        this.isProjectRunning = vmWrapper.isProjectRunning.bind(vmWrapper);

        this.getSprites = vmWrapper.sprites.getSprites.bind(vmWrapper.sprites);
        this.getSpritesAtPoint = vmWrapper.sprites.getSpritesAtPoint.bind(vmWrapper.sprites);
        this.getSpriteAtPoint = vmWrapper.sprites.getSpriteAtPoint.bind(vmWrapper.sprites);
        this.getSprite = vmWrapper.sprites.getSprite.bind(vmWrapper.sprites);
        this.getStage = vmWrapper.sprites.getStage.bind(vmWrapper.sprites);
        this.getNewSprites = vmWrapper.sprites.getNewSprites.bind(vmWrapper.sprites);
        this.onSpriteMoved = vmWrapper.sprites.onSpriteMoved.bind(vmWrapper.sprites);
        this.onSpriteVisualChange = vmWrapper.sprites.onSpriteVisualChange.bind(vmWrapper.sprites);

        this.addCallback = vmWrapper.callbacks.addCallback.bind(vmWrapper.callbacks);
        this.reAddCallback = vmWrapper.callbacks.reAddCallback.bind(vmWrapper.callbacks);
        this.removeCallback = vmWrapper.callbacks.removeCallback.bind(vmWrapper.callbacks);
        this.clearCallbacks = vmWrapper.callbacks.clearCallbacks.bind(vmWrapper.callbacks);

        this.addInput = vmWrapper.inputs.addInput.bind(vmWrapper.inputs);
        this.reAddInput = vmWrapper.inputs.reAddInput.bind(vmWrapper.inputs);
        this.inputImmediate = vmWrapper.inputs.inputImmediate.bind(vmWrapper.inputs);
        this.removeInput = vmWrapper.inputs.removeInput.bind(vmWrapper.inputs);
        this.clearInputs = vmWrapper.inputs.clearInputs.bind(vmWrapper.inputs);
        this.resetMouse = vmWrapper.inputs.resetMouse.bind(vmWrapper.inputs);
        this.resetKeyboard = vmWrapper.inputs.resetKeyboard.bind(vmWrapper.inputs);

        this.getMousePos = vmWrapper.inputs.getMousePos.bind(vmWrapper.inputs);
        this.isMouseDown = vmWrapper.inputs.isMouseDown.bind(vmWrapper.inputs);
        this.isKeyDown = vmWrapper.inputs.isKeyDown.bind(vmWrapper.inputs);

        this.registerRandomInputs = vmWrapper.randomInputs.registerRandomInputs.bind(vmWrapper.randomInputs);
        this.clearRandomInputs = vmWrapper.randomInputs.clearRandomInputs.bind(vmWrapper.randomInputs);
        this.setRandomInputInterval = vmWrapper.randomInputs.setRandomInputInterval.bind(vmWrapper.randomInputs);
        this.detectRandomInputs = vmWrapper.randomInputs.detectRandomInputs.bind(vmWrapper.randomInputs);

        this.addConstraint = vmWrapper.constraints.addConstraint.bind(vmWrapper.constraints);
        this.reAddConstraint = vmWrapper.constraints.reAddConstraint.bind(vmWrapper.constraints);
        this.removeConstraint = vmWrapper.constraints.removeConstraint.bind(vmWrapper.constraints);
        this.clearConstraints = vmWrapper.constraints.clearConstraints.bind(vmWrapper.constraints);

        this.greenFlag = vmWrapper.greenFlag.bind(vmWrapper);
        this.getStageSize = vmWrapper.getStageSize.bind(vmWrapper);
        this.end = vmWrapper.end.bind(vmWrapper);

        this.seedWhisker = random.seedWhisker;
        this.seedScratch = random.seedScratch;

        if (props.extend) {
            defaults(this, props.extend);
        }
    }
}

module.exports = TestDriver;
