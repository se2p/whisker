import TestDriver from "../../../test/test-driver";
import ModelResult from "../../../test-runner/model-result";
import {Effect} from "../components/Effect";
import {ProgramModelEdge} from "../components/ModelEdge";
import {getEffectFailedOutput, getErrorOnEdgeOutput} from "./ModelError";
import {ProgramModel} from "../components/ProgramModel";
import EventEmitter from "events";

/**
 * For edge condition or effect checks that need to listen to the onMoved of a sprite or keys before a step.
 */
export class CheckUtility extends EventEmitter {
    private readonly testDriver: TestDriver;
    private readonly modelResult: ModelResult;

    static readonly EVENT_TOUCHING = "EventTouching";
    static readonly EVENT_COLOR = "EventColor";
    private touched: { [key: string]: boolean } = {};
    private colorTouched: { [key: string]: boolean } = {};

    private effectChecks: { effect: Effect, edge: ProgramModelEdge, model: ProgramModel }[] = [];
    private constraintChecks: { edge: ProgramModelEdge, model: ProgramModel }[] = [];
    private failedChecks: { effect: Effect, edge: ProgramModelEdge, model: ProgramModel }[] = [];

    /**
     * Get an instance of a condition state saver.
     * @param testDriver Instance of the test driver.
     * @param nbrOfAllModels Number of all models.
     * @param modelResult For saving errors of the model.
     */
    constructor(testDriver: TestDriver, nbrOfAllModels: number, modelResult: ModelResult) {
        super();
        this.testDriver = testDriver;
        this.modelResult = modelResult;
        this.setMaxListeners(nbrOfAllModels);
    }

    /**
     * Register a touching check for a sprite with another sprite. The check is also registered for the
     * other sprite as there have been inconsistencies.
     * @param spriteName1 Sprite's name that gets the condition check registered.
     * @param spriteName2 Name of the other sprite that the first needs to touch.
     */
    registerTouching(spriteName1: string, spriteName2: string): void {
        let touchingString = CheckUtility.getTouchingString(spriteName1, spriteName2);

        if (this.touched[touchingString] == undefined) {
            this.touched[touchingString] = false;

            this.testDriver.addModelSpriteMoved((sprite) => {
                if (sprite.name == spriteName1 && (this.touched[touchingString] != sprite.isTouchingSprite(spriteName2))) {
                    this.emit(CheckUtility.EVENT_TOUCHING, this.testDriver, spriteName1, spriteName2);
                    this.touched[touchingString] = !this.touched[touchingString];
                    console.log("emitting", touchingString, this.touched[touchingString]);
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
                if (sprite.name == spriteName && (this.colorTouched[colorString] != sprite.isTouchingColor([r, g, b]))) {
                    this.emit(CheckUtility.EVENT_COLOR, this.testDriver, spriteName, r, g, b);
                    this.colorTouched[colorString] = !this.colorTouched[colorString];
                    console.log("emitting", colorString, this.colorTouched[colorString])
                }
            });
        }
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
     * Register the effects of an constraint model edge in this listener to test them later on.
     * @param takenEdge The taken edge of a model.
     * @param model Model of the edge.
     */
    registerConstraintCheck(takenEdge: ProgramModelEdge, model: ProgramModel) {
        this.constraintChecks.push({edge: takenEdge, model: model});
    }

    /**
     * Check the effects of the constraint models.
     */
    checkConstraintEffects(modelResult: ModelResult) {
        for (let i = 0; i < this.constraintChecks.length; i++) {
            let edge = this.constraintChecks[i].edge;
            let effects = edge.effects;
            let model = this.constraintChecks[i].model;

            // todo make it possible to check for contradictions?
            // for (let j = i + 1; j < this.effectChecks.length; j++) {
            //     if (effect.contradicts(this.effectChecks[j].effect)) {
            //         doNotCheck[i] = true;
            //         doNotCheck[j] = true;
            //     }
            // }


            let stepsSinceLastTransition = model.stepNbrOfLastTransition - model.stepNbrOfScndLastTransition;
            for (let i = 0; i < effects.length; i++) {
                if (!effects[i].check(stepsSinceLastTransition, model.stepNbrOfProgramEnd)) {
                    let error = getEffectFailedOutput(edge, effects[i]);
                    console.error(error);
                    modelResult.addFail(error);
                }
            }
        }
        this.constraintChecks = [];
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

        // let t = this.testDriver;
        function makeFailedOutput(edge, effect) {
            let output = getEffectFailedOutput(edge, effect);
            console.error(output);
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
