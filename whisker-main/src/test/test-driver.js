const defaults = require('lodash.defaults');
const random = require('../util/random');
const Coverage = require('../coverage/coverage');

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
        this.isRunning = vmWrapper.isRunning.bind(vmWrapper);
        this.isProjectRunning = vmWrapper.isProjectRunning.bind(vmWrapper);

        this.clickOnSprite = vmWrapper.inputs.clickOnSprite.bind(vmWrapper.inputs);
        this.clickOnClone = vmWrapper.inputs.clickOnClone.bind(vmWrapper.inputs);
        this.dragSprite = vmWrapper.dragSprite.bind(vmWrapper);
        this.keyPress = vmWrapper.inputs.keyPress.bind(vmWrapper.inputs);
        this.mouseDown = vmWrapper.inputs.mouseDown.bind(vmWrapper.inputs);
        this.mouseMove = vmWrapper.inputs.mouseMove.bind(vmWrapper.inputs);
        this.mouseMoveToEvent = vmWrapper.inputs.mouseMoveToEvent.bind(vmWrapper.inputs);
        this.typeText = vmWrapper.inputs.typeText.bind(vmWrapper.inputs);
        this.wait = vmWrapper.wait.bind(vmWrapper);

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
        this.addInputs = vmWrapper.inputs.addInputs.bind(vmWrapper.inputs);
        this.reAddInput = vmWrapper.inputs.reAddInput.bind(vmWrapper.inputs);
        this.inputImmediate = vmWrapper.inputs.inputImmediate.bind(vmWrapper.inputs);
        this.removeInput = vmWrapper.inputs.removeInput.bind(vmWrapper.inputs);
        this.clearInputs = vmWrapper.inputs.clearInputs.bind(vmWrapper.inputs);
        this.resetMouse = vmWrapper.inputs.resetMouse.bind(vmWrapper.inputs);
        this.resetKeyboard = vmWrapper.inputs.resetKeyboard.bind(vmWrapper.inputs);
        this.clickStage = vmWrapper.inputs.clickStage.bind(vmWrapper.inputs);
        this.getAnswer = vmWrapper.getAnswer.bind(vmWrapper);
        this.isQuestionAsked = vmWrapper.isQuestionAsked.bind(vmWrapper);

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

        this.seedScratch = random.seedScratch;

        this.getTotalRealTimeElapsed = () => this.getTotalTimeElapsed() / vmWrapper.accelerationFactor;
        this.getRealRunTimeElapsed = () => this.getRunTimeElapsed() / vmWrapper.accelerationFactor;
        this.getAccelerationFactor = () => vmWrapper.accelerationFactor;

        this.isCoverageEnabled = Coverage.isCoverageEnabled.bind(null, vmWrapper.vm);
        this.getCoverage = Coverage.getCoverage;

        if (props.extend) {
            defaults(this, props.extend);
        }
    }
}

module.exports = TestDriver;
