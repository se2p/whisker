import TestDriver from "../../../test/test-driver";
import ModelResult from "../../../test-runner/model-result";
import {Effect} from "../components/Effect";
import {ProgramModelEdge} from "../components/ModelEdge";
import {getEffectFailedOutput} from "./ModelError";
import {ProgramModel} from "../components/ProgramModel";
import EventEmitter from "events";
import {Check, CheckName} from "../components/Check";

/**
 * For edge condition or effect checks that need to listen to the onMoved of a sprite or keys before a step.
 */
export class CheckUtility extends EventEmitter {
    private readonly testDriver: TestDriver;
    private readonly modelResult: ModelResult;

    static readonly CHECK_UTILITY_EVENT = "CheckUtilityEvent"
    private onMovedChecks: { [key: string]: ((sprite) => boolean)[] } = {};
    private onSayOrThinkChecks: { [key: string]: ((sprite) => boolean)[] } = {};
    private variableChecks: ((varName) => string)[] = [];

    private registeredTouching: string[] = [];
    private registeredColor: string[] = [];
    private registeredSpriteMove: { [key: string]: string } = {};
    private registeredOutput: string[] = [];
    private registeredVarEvents: string[] = [];
    private eventStrings: string[] = [];
    private sayTexts: { [key: string]: string } = {}

    private effectChecks: { effect: Effect, edge: ProgramModelEdge, model: ProgramModel }[] = [];
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
        this.setupSpriteEvents();
    }


    /**
     * Register a movement listener on a sprite.
     * @param spriteRegex Regex defining the sprite name.
     * @param spriteName Name of the actual sprite.
     */
    registerMovement(spriteRegex: string, spriteName: string) {
        // no check for this sprite till now
        if (this.onMovedChecks[spriteName] == undefined || this.onMovedChecks[spriteName] == null) {
            this.onMovedChecks[spriteName] = [];
        }

        if (this.registeredSpriteMove[spriteName] == undefined || this.registeredSpriteMove[spriteName] == null) {
            this.registeredSpriteMove[spriteName] = spriteRegex;
        }
    }


    /**
     * Register a touching check for a sprite with another sprite. The check is also registered for the
     * other sprite as there have been inconsistencies.
     * @param spriteRegex1 Regex defining the first sprite name to find the same check again.
     * @param spriteRegex2 Regex defining the second sprite name to find the same check again.
     * @param spriteName1 Sprite's name that gets the condition check registered.
     * @param spriteName2 Name of the other sprite that the first needs to touch.
     * @param negated Whether this check is negated.
     */
    registerTouching(spriteRegex1: string, spriteRegex2: string, spriteName1: string, spriteName2: string,
                     negated: boolean): void {
        const touchingString = CheckUtility.getTouchingString(spriteName1, spriteName2, negated);
        const eventString = CheckUtility.getTouchingString(spriteRegex1, spriteRegex2, negated);

        // no check for this sprite till now
        if (this.onMovedChecks[spriteName1] == undefined || this.onMovedChecks[spriteName1] == null) {
            this.onMovedChecks[spriteName1] = [];
        }

        if (this.registeredTouching.indexOf(touchingString) == -1) {
            this.registeredTouching.push(touchingString);
            this.onMovedChecks[spriteName1].push((sprite) => {
                return !negated == sprite.isTouchingSprite(spriteName2) && this.updateEventString(eventString);
            });
        }
    }

    /**
     * Registers a color touching check for a sprite with a RGB color value (as an array).
     * @param spriteRegex Regex defining the first sprite name to find the same check again.
     * @param negated Whether this check is negated
     * @param spriteName Name of the sprite that gets the check.
     * @param r RGB red value.
     * @param g RGB green value.
     * @param b RGB blue value.
     */
    registerColor(spriteRegex: string, spriteName: string, r: number, g: number, b: number, negated: boolean): void {
        const colorString = CheckUtility.getColorString(spriteName, r, g, b, negated);
        const eventString = CheckUtility.getColorString(spriteRegex, r, g, b, negated);

        // no check for this sprite till now
        if (this.onMovedChecks[spriteName] == undefined || this.onMovedChecks[spriteName] == null) {
            this.onMovedChecks[spriteName] = [];
        }

        if (this.registeredColor.indexOf(colorString) == -1) {
            this.registeredColor.push(colorString);
            this.onMovedChecks[spriteName].push((sprite) => {
                return !negated == sprite.isTouchingColor([r, g, b]) && this.updateEventString(eventString);
            });
        }
    }

    /**
     * Register an output event on the visual change checks.
     * @param spriteRegex  Regex defining the first sprite name to find the same check again.
     * @param spriteName Name of the sprite.
     * @param output Output as clear text that is saved in the check, e.g. -8.
     * @param outputExpr Expression that can be evaluated checking the output for equality.
     * @param negated Whether the check is negated.
     */
    registerOutput(spriteRegex: string, spriteName: string, output: string, outputExpr: string, negated: boolean) {
        const outputString = CheckUtility.getOutputString(spriteName, output, negated);
        const eventString = CheckUtility.getOutputString(spriteRegex, output, negated);

        if (this.onSayOrThinkChecks[spriteName] == undefined || this.onSayOrThinkChecks[spriteName] == null) {
            this.onSayOrThinkChecks[spriteName] = [];
        }

        if (this.registeredOutput.indexOf(outputString) == -1) {
            this.registeredOutput.push(outputString);
            this.sayTexts[spriteName] = "";
            this.onSayOrThinkChecks[spriteName].push((sprite) => {
                let correctOutput = sprite.sayText && sprite.sayText.indexOf(eval(outputExpr)(this.testDriver)) != -1;
                return !negated == correctOutput && this.updateEventString(eventString);
            })
        }
    }

    /**
     * Register an variable change event for a variable of a sprite.
     * @param spriteRegex Regex defining the sprite name.
     * @param spriteName Name of the actual sprite.
     * @param varRegex Regex defining the variable name.
     * @param varName Name of the actual variable.
     */
    registerVarEvent(spriteRegex: string, spriteName: string, varRegex: string, varName: string) {
        const varString = CheckUtility.getVarEventString(spriteName, varName);
        const eventString = CheckUtility.getVarEventString(spriteRegex, varRegex);
        if (this.registeredVarEvents.indexOf(varString) == -1) {
            this.registeredVarEvents.push(varString);

            this.variableChecks.push((currentVarName) => {
                if (varName == currentVarName) {
                    return eventString;
                }
                return undefined;
            })
        }
    }

    private setupSpriteEvents() {
        this.testDriver.vmWrapper.sprites.onModelSpriteMoved((sprite) => {
            let change = false;
            // check for x and y attribute change listeners
            if (this.registeredSpriteMove[sprite.name] != undefined && this.registeredSpriteMove[sprite.name] != null) {
                this.updateEventString(this.registeredSpriteMove[sprite.name]);
                change = true;
            }

            // check color and touching sprite
            if (this.onMovedChecks[sprite.name] != null) {
                this.onMovedChecks[sprite.name].forEach(fun => {
                    // checks if any color or touching predicates are fulfilled and updates the eventStrings
                    if (fun(sprite)) {
                        change = true;
                    }
                });
            }

            if (change) {
                this.emit(CheckUtility.CHECK_UTILITY_EVENT, this.eventStrings);
            }
        })
        this.testDriver.vmWrapper.sprites.onSayOrThink((sprite) => {
            if (this.sayTexts[sprite.name] != null
                && this.sayTexts[sprite.name] != undefined && this.sayTexts[sprite.name] != sprite.sayText) {
                this.sayTexts[sprite.name] = sprite.sayText;
                let change = false;
                this.onSayOrThinkChecks[sprite.name].forEach(fun => {
                    if (fun(sprite)) {
                        change = true;
                    }
                });
                if (change) {
                    this.emit(CheckUtility.CHECK_UTILITY_EVENT, this.eventStrings);
                }
            }
        })
        this.testDriver.vmWrapper.sprites.onVariableChange((varName) => {
            let eventString;
            for (let i = 0; i < this.variableChecks.length; i++) {
                eventString = this.variableChecks[i](varName);
                if (eventString) {
                    this.emit(CheckUtility.CHECK_UTILITY_EVENT, [eventString]);
                    return;
                }
            }
        })
    }

    private updateEventString(event: string): boolean {
        if (this.eventStrings.indexOf(event) != -1) {
            return false;
        }

        if (this.eventStrings.length == 0) {
            this.eventStrings.push(event);
            return true;
        }

        const negated = event.startsWith("!");
        let invertedEvent;

        if (negated) {
            invertedEvent = event.substring(1, event.length);
        } else {
            invertedEvent = "!" + event;
        }

        let newEventString = [];
        // if the event strings array contains the inverted event remove that one
        for (let i = 0; i < this.eventStrings.length; i++) {
            if (this.eventStrings[i] != invertedEvent) {
                newEventString.push(this.eventStrings[i]);
            }
        }
        this.eventStrings = newEventString;
        this.eventStrings.push(event);
        return true;
    }

    reset() {
        this.eventStrings = [];
    }

    /**
     * Check whether a key was pressed at the beginning of the step.
     * @param keyName Name of the key.
     */
    isKeyDown(keyName: string) {
        return this.testDriver.isKeyDown(keyName);
    }

    static getEventString(check: Check): string {
        if (check.name == CheckName.SpriteTouching) {
            return CheckUtility.getTouchingString(check.args[0], check.args[1], check.negated);
        } else if (check.name == CheckName.SpriteColor) {
            return CheckUtility.getColorString(check.args[0], check.args[1], check.args[2], check.args[3], check.negated);
        } else if (check.name == CheckName.Output) {
            return CheckUtility.getOutputString(check.args[0], check.args[1], check.negated);
        } else if (check.name == CheckName.VarChange || check.name == CheckName.VarComp) {
            return CheckUtility.getVarEventString(check.args[0], check.args[1]);
        }
        return "";
    }

    /**
     * Get the string defining a touching event.
     */
    static getTouchingString(sprite1: string, sprite2: string, negated: boolean): string {
        let s = negated ? "!" : "";
        return s + sprite1 + ":" + sprite2;
    }

    /**
     * Get the string defining a color event.
     */
    static getColorString(spriteName: string, r: number, g: number, b: number, negated: boolean): string {
        let s = negated ? "!" : "";
        return s + spriteName + ":" + r + ":" + g + ":" + b;
    }

    /**
     * Get the string defining an output event.
     */
    static getOutputString(spriteName: string, output: string, negated: boolean) {
        let s = negated ? "!" : "";
        return s + spriteName + ":" + output;
    }

    /**
     * Get the string defining a variable change event.
     */
    static getVarEventString(spriteNameRegex: string, varNameRegex: string) {
        return spriteNameRegex + ":" + varNameRegex;
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
     * Check the registered effects of this step.
     */
    checkEffects(modelResult: ModelResult): Effect[] {
        let result = this.check(modelResult, false);
        this.effectChecks = [];
        return result;
    }

    checkEndEffects(modelResult: ModelResult): Effect[] {
        let result = this.check(modelResult, true);
        this.effectChecks = [];
        return result;
    }

    private failOnProgramModel(edge, effect, modelResult) {
        let output = getEffectFailedOutput(edge, effect);
        console.error(output, this.testDriver.getTotalStepsExecuted());
        modelResult.addFail(output);
    }

    private check(modelResult: ModelResult, makeFailOutput: boolean) {
        let contradictingEffects = [];
        let doNotCheck = {};
        let failedEffects = [];

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
                let stepsSinceLastTransition = model.stepNbrOfLastTransition - model.stepNbrOfScndLastTransition + 1;
                try {
                    if (!effect.check(stepsSinceLastTransition, model.stepNbrOfProgramEnd)) {
                        failedEffects.push(this.effectChecks[i]);
                        if (makeFailOutput) {
                            this.failOnProgramModel(this.effectChecks[i].edge, this.effectChecks[i].effect, modelResult);
                        }
                    }
                } catch (e) {
                    failedEffects.push(this.effectChecks[i]);
                    this.failOnProgramModel(this.effectChecks[i].edge, this.effectChecks[i].effect, modelResult);
                }
            } else {
                contradictingEffects.push(this.effectChecks[i].effect);
            }
        }

        this.failedChecks = failedEffects;
        return contradictingEffects;
    }

    /**
     * Check the failed effects of last step.
     */
    checkFailedEffects(modelResult: ModelResult) {
        if (!this.failedChecks || this.failedChecks.length == 0) {
            return;
        }
        for (let i = 0; i < this.failedChecks.length; i++) {
            let effect = this.failedChecks[i].effect;
            let model = this.failedChecks[i].model;
            try {
                if (!effect.check(model.stepNbrOfLastTransition - model.stepNbrOfScndLastTransition,
                    model.stepNbrOfProgramEnd)) {
                    this.failOnProgramModel(this.failedChecks[i].edge, effect, modelResult);
                }
            } catch (e) {
                this.failOnProgramModel(this.failedChecks[i].edge, effect, modelResult);
            }
        }
        this.failedChecks = [];
    }
}
