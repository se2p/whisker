const defaults = require('lodash.defaults');
const {Randomness} = require("../whisker/utils/Randomness");
const Coverage = require('../coverage/coverage');

/**
 * Connecting link for methods between whisker and the vm wrapper.
 */
class TestDriver {

    /**
     * @param {VMWrapper} vmWrapper The wrapper of the used virtual machine.
     * @param {object} props The properties of the test driver.
     */
    // TODO: get rid of clear... methods
    constructor(vmWrapper, props) {
        this.vmWrapper = vmWrapper;
        this.vm = vmWrapper.vm;

        /* Events */
        this.greenFlag = vmWrapper.greenFlag.bind(vmWrapper);
        this.end = vmWrapper.end.bind(vmWrapper);
        this.clickStage = vmWrapper.inputs.clickStage.bind(vmWrapper.inputs);
        this.clickSprite = vmWrapper.inputs.clickSprite.bind(vmWrapper.inputs);
        this.clickClone = vmWrapper.inputs.clickClone.bind(vmWrapper.inputs);
        this.clickCloneByCoords = vmWrapper.inputs.clickCloneByCoords.bind(vmWrapper.inputs);
        this.dragSprite = vmWrapper.inputs.dragSprite.bind(vmWrapper.inputs);
        this.keyPress = vmWrapper.inputs.keyPress.bind(vmWrapper.inputs);
        this.keyRelease = vmWrapper.inputs.keyRelease.bind(vmWrapper.inputs);
        this.mouseDown = vmWrapper.inputs.mouseDown.bind(vmWrapper.inputs);
        this.mouseDownForSteps = vmWrapper.inputs.mouseDownForSteps.bind(vmWrapper.inputs);
        this.mouseMove = vmWrapper.inputs.mouseMove.bind(vmWrapper.inputs);
        this.typeText = vmWrapper.inputs.typeText.bind(vmWrapper.inputs);
        this.sendSound = vmWrapper.inputs.sendSound.bind(vmWrapper.inputs);

        /* Sprite Information */
        this.getSprites = vmWrapper.sprites.getSprites.bind(vmWrapper.sprites);
        this.getSpritesAtPoint = vmWrapper.sprites.getSpritesAtPoint.bind(vmWrapper.sprites);
        this.getSpriteAtPoint = vmWrapper.sprites.getSpriteAtPoint.bind(vmWrapper.sprites);
        this.getSprite = vmWrapper.sprites.getSprite.bind(vmWrapper.sprites);
        this.getStage = vmWrapper.sprites.getStage.bind(vmWrapper.sprites);
        this.getNewSprites = vmWrapper.sprites.getNewSprites.bind(vmWrapper.sprites);
        this.getRotationStyle = vmWrapper.sprites.getRotationStyle.bind(vmWrapper.sprites);
        this.getSpriteVariable = vmWrapper.sprites.getSpriteVariable.bind(vmWrapper.sprites);
        this.onSpriteMoved = vmWrapper.sprites.onSpriteMoved.bind(vmWrapper.sprites);
        this.onSpriteVisualChange = vmWrapper.sprites.onSpriteVisualChange.bind(vmWrapper.sprites);
        this.onSayOrThink = vmWrapper.sprites.onSayOrThink.bind(vmWrapper.sprites);
        this.onVariableChange = vmWrapper.sprites.onVariableChange.bind(vmWrapper.sprites);

        /* Set Sprite Properties */
        this.setVisibility = vmWrapper.sprites.setVisibility.bind(vmWrapper.sprites);
        this.setSpriteVariable = vmWrapper.sprites.setSpriteVariable.bind(vmWrapper.sprites);

        /* Other Information */
        this.getStageSize = vmWrapper.getStageSize.bind(vmWrapper);
        this.getMousePos = vmWrapper.inputs.getMousePos.bind(vmWrapper.inputs);
        this.isMouseDown = vmWrapper.inputs.isMouseDown.bind(vmWrapper.inputs);
        this.isKeyDown = vmWrapper.inputs.isKeyDown.bind(vmWrapper.inputs);
        this.getGlobalVariable = vmWrapper.getGlobalVariable.bind(vmWrapper);
        this.getAnswer = vmWrapper.getAnswer.bind(vmWrapper);
        this.isQuestionAsked = vmWrapper.isQuestionAsked.bind(vmWrapper);

        /* Set Global Properties */
        this.setGlobalVariable = vmWrapper.setGlobalVariable.bind(vmWrapper);

        /* Running the program. */
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

        /* Further Test Tools  */
        this.seedScratch = (seed) => {
            Randomness.setInitialSeeds(seed);
            Randomness.seedScratch();
        }
        this.getTotalRealTimeElapsed = () => this.getTotalTimeElapsed() / vmWrapper.accelerationFactor;
        this.getRealRunTimeElapsed = () => this.getRunTimeElapsed() / vmWrapper.accelerationFactor;
        this.getAccelerationFactor = () => vmWrapper.accelerationFactor;
        this.isCoverageEnabled = Coverage.isCoverageEnabled.bind(null, vmWrapper.vm);
        this.getCoverage = Coverage.getCoverage;

        /* Inputs */
        this.addInput = vmWrapper.inputs.addInput.bind(vmWrapper.inputs);
        this.addInputs = vmWrapper.inputs.addInputs.bind(vmWrapper.inputs);
        this.reAddInput = vmWrapper.inputs.reAddInput.bind(vmWrapper.inputs);
        this.inputImmediate = vmWrapper.inputs.inputImmediate.bind(vmWrapper.inputs);
        this.removeInput = vmWrapper.inputs.removeInput.bind(vmWrapper.inputs);
        this.clearInputs = vmWrapper.inputs.clearInputs.bind(vmWrapper.inputs);
        this.resetMouse = vmWrapper.inputs.resetMouse.bind(vmWrapper.inputs);
        this.resetKeyboard = vmWrapper.inputs.resetKeyboard.bind(vmWrapper.inputs);

        /* Random inputs / Automated input generation. */
        this.registerRandomInputs = vmWrapper.randomInputs.registerRandomInputs.bind(vmWrapper.randomInputs);
        this.clearRandomInputs = vmWrapper.randomInputs.clearRandomInputs.bind(vmWrapper.randomInputs);
        this.setRandomInputInterval = vmWrapper.randomInputs.setRandomInputInterval.bind(vmWrapper.randomInputs);
        this.detectRandomInputs = vmWrapper.randomInputs.detectRandomInputs.bind(vmWrapper.randomInputs);

        /* Constraints. */
        this.addConstraint = vmWrapper.constraints.addConstraint.bind(vmWrapper.constraints);
        this.reAddConstraint = vmWrapper.constraints.reAddConstraint.bind(vmWrapper.constraints);
        this.removeConstraint = vmWrapper.constraints.removeConstraint.bind(vmWrapper.constraints);
        this.clearConstraints = vmWrapper.constraints.clearConstraints.bind(vmWrapper.constraints);

        /* Callbacks */
        this.addCallback = vmWrapper.callbacks.addCallback.bind(vmWrapper.callbacks);
        this.reAddCallback = vmWrapper.callbacks.reAddCallback.bind(vmWrapper.callbacks);
        this.removeCallback = vmWrapper.callbacks.removeCallback.bind(vmWrapper.callbacks);
        this.clearCallbacks = vmWrapper.callbacks.clearCallbacks.bind(vmWrapper.callbacks);

        if (props.extend) {
            defaults(this, props.extend);
        }
    }
}

module.exports = TestDriver;
