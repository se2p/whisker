import TestDriver from "../../../test/test-driver";
import ModelResult from "../../../test-runner/model-result";
import {Effect} from "../components/Effect";
import {ProgramModelEdge} from "../components/ModelEdge";
import {getEffectFailedOutput, getErrorOnEdgeOutput} from "./ModelError";
import {ProgramModel} from "../components/ProgramModel";

/**
 * For edge condition or effect checks that need to listen to the onMoved of a sprite or keys before a step.
 */
export class CheckUtility {
    private readonly testDriver: TestDriver;

    private touched: { [key: string]: boolean } = {};
    private colorTouched: { [key: string]: boolean } = {};

    private effectChecks: { effect: Effect, edge: ProgramModelEdge, model: ProgramModel }[] = [];
    private failedChecks: { effect: Effect, edge: ProgramModelEdge, model: ProgramModel }[] = [];

    /**
     * Get an instance of a condition state saver.
     * @param testDriver Instance of the test driver.
     */
    constructor(testDriver: TestDriver) {
        this.testDriver = testDriver;
    }

    /**
     * Register a touching check for a sprite with another sprite. The check is also registered for the
     * other sprite as there have been inconsistencies.
     * @param spriteName1 Sprite's name that gets the condition check registered.
     * @param spriteName2 Name of the other sprite that the first needs to touch.
     */
    registerTouching(spriteName1: string, spriteName2: string): void {
        this._registerTouching(spriteName1, spriteName2);
    }

    private _registerTouching(spriteName1: string, spriteName2: string): void {
        let touchingString = CheckUtility.getTouchingString(spriteName1, spriteName2);

        if (this.touched[touchingString] == undefined) {
            this.touched[touchingString] = false;

            this.testDriver.addModelSpriteMoved((sprite) => {
                if (sprite.name == spriteName1 && sprite.isTouchingSprite(spriteName2)) {
                    this.touched[touchingString] = true;
                }
            });
        }
    }

    /**
     * Registers a color touching check for a sprite with a RGB color value (as an array).
     * @param spriteName Name of the sprite that gets the check.
     * @param r RGB red value.
     * @param g RGB green value.
     * @param b RGB blue value.
     */
    registerColor(spriteName: string, r: number, g: number, b: number): void {
        let colorString = CheckUtility.getColorString(spriteName, r, g, b);

        if (this.colorTouched[colorString] == undefined) {

            this.colorTouched[colorString] = false;

            this.testDriver.addModelSpriteMoved((sprite) => {
                // this test gets all very short touches with a color (when in the same step e.g. the sprites is
                // moved again and a test isTouchingColor would not register it after step). as this also created
                // the problem that even if the sprite is hidden, moves (touches randomly the color), and is then
                // made visible again it triggers this, test for visibility here too. this could also fail in some
                // cases...
                if (sprite.name == spriteName && sprite.isTouchingColor([r, g, b]) && sprite.visible) {
                    this.colorTouched[colorString] = true;
                }
            });
        }
    }

    /**
     * Reset the fulfilled checks of the last step.
     */
    reset() {
        for (const touchedKey in this.touched) {
            this.touched[touchedKey] = false;
        }
        for (const colorKey in this.colorTouched) {
            this.colorTouched[colorKey] = false;
        }
    }

    /**
     * Check whether two sprites touched in the current step and they did not in the last step.
     * @param spriteName1 Name of the first sprite.
     * @param spriteName2 Name of the second sprite.
     */
    areTouching(spriteName1: string, spriteName2: string): boolean {
        let combi1 = CheckUtility.getTouchingString(spriteName1, spriteName2);
        let combi2 = CheckUtility.getTouchingString(spriteName2, spriteName1);
        return (this.touched[combi1] || this.touched[combi2]
            || this.testDriver.getSprite(spriteName1).isTouchingSprite(spriteName2));
    }

    /**
     * Check whether a sprite is touching a color.
     */
    isTouchingColor(spriteName: string, r: number, g: number, b: number): boolean {
        return (this.colorTouched[CheckUtility.getColorString(spriteName, r, g, b)]
            || this.testDriver.getSprite(spriteName).isTouchingColor([r, g, b]));
    }

    /**
     * Check whether a key was pressed at the beginning of the step.
     * @param keyName Name of the key.
     */
    isKeyDown(keyName: string) {
        return this.testDriver.isKeyDown(keyName);
    }

    private static getTouchingString(sprite1: string, sprite2: string): string {
        return sprite1 + ":" + sprite2;
    }

    private static getColorString(spriteName: string, r: number, g: number, b: number): string {
        return spriteName + ":" + r + ":" + g + ":" + b;
    }

    /**
     * Register the effects of an edge in this listener to test them later on.
     * @param takenEdge The taken edge of a model.
     * @param model Model of the edge.
     */
    registerEffectCheck(takenEdge: ProgramModelEdge, model: ProgramModel) {
        takenEdge.effects.forEach(effect => {
            this.effectChecks.push({effect: effect, edge: takenEdge, model: model});
        })
    }

    /**
     * Check the effects of an edge immediately and throw an error if they are not fulfilled. For the constraints model.
     * @param edge The taken edge of the constraints model.
     * @param model Model of the edge.
     * @param modelResult To save errors into.
     */
    checkEffectsConstraint(edge: ProgramModelEdge, model: ProgramModel, modelResult: ModelResult) {
        let effects = edge.effects;
        let stepsSinceLastTransition = model.stepNbrOfLastTransition - model.stepNbrOfScndLastTransition;
        for (let i = 0; i < effects.length; i++) {
            if (!effects[i].check(stepsSinceLastTransition, model.stepNbrOfProgramEnd)) {
                let error = getEffectFailedOutput(edge, effects[i]);
                console.log("bowl", this.testDriver.getSprite("Bowl").x);
                console.log("punkte", this.testDriver.getStage().getVariable("Punkte").value);
                console.error(error, this.testDriver.getTotalStepsExecuted());
                modelResult.addFail(error);
            }
        }
    }

    /**
     * Check the registered effects of this step.
     */
    checkEffects(modelResult: ModelResult) {
        let doNotCheck = {};

        // check for contradictions in effects
        for (let i = 0; i < this.effectChecks.length; i++) {
            let effect = this.effectChecks[i].effect;

            for (let j = i + 1; j < this.effectChecks.length; j++) {
                if (effect.contradicts(this.effectChecks[j].effect)) {
                    doNotCheck[i] = true;
                    doNotCheck[j] = true;
                }
            }

            if (!doNotCheck[i]) {
                let model = this.effectChecks[i].model;
                let stepsSinceLastTransition = model.stepNbrOfLastTransition - model.stepNbrOfScndLastTransition;
                try {
                    if (!effect.check(stepsSinceLastTransition, model.stepNbrOfProgramEnd)) {
                        this.failedChecks.push(this.effectChecks[i]);
                    }
                } catch (e) {
                    let error = getErrorOnEdgeOutput(this.effectChecks[i].edge, e.message);
                    console.error(error);
                    this.failedChecks.push(this.effectChecks[i]);
                    modelResult.addError(error);
                }
            }
        }

        // Get the contradicting edges and return them for outputs
        let contradictingEffects = [];
        for (let i = 0; i < this.effectChecks.length; i++) {
            if (doNotCheck[i]) {
                contradictingEffects.push(this.effectChecks[i].effect);
            }
        }
        this.effectChecks = [];
        return contradictingEffects;
    }

    /**
     * Check the failed effects of this step.
     */
    checkFailedEffects(modelResult: ModelResult) {
        if (!this.failedChecks || this.failedChecks.length == 0) {
            return;
        }

        let t = this.testDriver;
        function makeFailedOutput(edge, effect) {
            let output = getEffectFailedOutput(edge, effect);
            console.log("Zeit", t.getStage().getVariable("Zeit").value);
            let bowl = t.getSprite("Bowl");
            console.log("bowl movement", bowl.x, bowl.old.x)
            console.error(output, t.getTotalStepsExecuted());
            modelResult.addFail(output);
        }

        for (let i = 0; i < this.failedChecks.length; i++) {
            let effect = this.failedChecks[i].effect;
            let model = this.failedChecks[i].model;
            try {
                if (!effect.check(model.stepNbrOfLastTransition - model.stepNbrOfScndLastTransition,
                    model.stepNbrOfProgramEnd)) {
                    makeFailedOutput(this.failedChecks[i].edge, effect);
                }
            } catch (e) {
                makeFailedOutput(this.failedChecks[i].edge, effect);
            }
        }
        this.failedChecks = [];
    }
}
