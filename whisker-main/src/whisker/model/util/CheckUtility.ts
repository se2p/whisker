import TestDriver from "../../../test/test-driver";
import ModelResult from "../../../test-runner/model-result";
import {Effect} from "../components/Effect";
import {ProgramModelEdge} from "../components/ModelEdge";
import {getEffectFailedOutput} from "./ModelError";
import {ProgramModel} from "../components/ProgramModel";
import EventEmitter from "events";
import Sprite from "../../../vm/sprite";
import {Check, CheckName} from "../components/Check";

/**
 * For edge condition or effect checks that need to listen to the onMoved of a sprite or keys before a step.
 */
export class CheckUtility extends EventEmitter {
    private readonly testDriver: TestDriver;
    private readonly modelResult: ModelResult;

    static readonly CHECK_UTILITY_EVENT = "CheckUtilityEvent"
    private onMovedChecks: { [key: string]: ((sprite) => boolean)[] } = {};
    private onVisualChecks: { [key: string]: ((sprite) => boolean)[] } = {};
    private onSayOrThinkChecks: { [key: string]: ((sprite) => boolean)[] } = {};
    private variableChecks: { [key: string]: (() => void)[] } = {};

    private registeredOnMove: string[] = [];
    private registeredVisualChange: string[] = [];
    private registeredOutput: string[] = [];
    private registeredVarEvents: string[] = [];

    private eventStrings: string[] = [];

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
        this.testDriver.vmWrapper.sprites.onModelSpriteMoved(sprite => this.checkForEvent(this.onMovedChecks, sprite));
        this.testDriver.vmWrapper.sprites.onSayOrThink(sprite => this.checkForEvent(this.onSayOrThinkChecks, sprite));
        this.testDriver.vmWrapper.sprites.onSpriteVisualChangeModel(sprite => this.checkForEvent(this.onVisualChecks, sprite));
        this.testDriver.vmWrapper.sprites.onVariableChange((varName: string) => {
            if (this.variableChecks[varName] != null) {
                this.variableChecks[varName].forEach(fun => fun());
            }
        });
    }

    /**
     * Register a listener on the movement of a sprite with a certain predicate to be fulfilled for the event to be
     * triggered.
     * @param spriteName Name of the sprite.
     * @param predicate Function checking if the predicate for the event is fulfilled.
     * @param eventString String defining the event (see CheckUtility.getEventString)
     */
    registerOnMoveEvent(spriteName: string, eventString: string, predicate: (sprite: Sprite) => boolean) {
        if (this.registeredOnMove.indexOf(eventString) == -1) {
            this.registeredOnMove.push(eventString);
            this.register(this.onMovedChecks, eventString, spriteName, predicate);
        }
    }

    /**
     * Register an visual change event listener.
     * @param spriteName Name of the actual sprite.
     * @param eventString Function checking if the predicate for the event is fulfilled.
     * @param predicate String defining the event (see CheckUtility.getEventString)
     */
    // todo add them to the check generator (size, visible, ... what more?)
    registerOnVisualChange(spriteName: string, eventString: string, predicate: (sprite: Sprite) => boolean) {
        if (this.registeredVisualChange.indexOf(eventString) == -1) {
            this.registeredVisualChange.push(eventString);
            this.register(this.onVisualChecks, eventString, spriteName, predicate);
        }
    }

    /**
     * Register an output event on the visual change checks.
     * @param spriteName Name of the sprite.
     * @param eventString Function checking if the predicate for the event is fulfilled.
     * @param predicate String defining the event (see CheckUtility.getEventString)
     */
    registerOutput(spriteName: string, eventString: string, predicate: (sprite: Sprite) => boolean) {
        if (this.registeredOutput.indexOf(eventString) == -1) {
            this.registeredOutput.push(eventString);
            this.register(this.onSayOrThinkChecks, eventString, spriteName, predicate);
        }
    }


    private register(predicateChecker: { [key: string]: ((sprite) => boolean)[] }, eventString: string,
                     spriteName: string, predicate: (sprite: Sprite) => boolean) {
        // no check for this sprite till now
        if (predicateChecker[spriteName] == undefined || predicateChecker[spriteName] == null) {
            predicateChecker[spriteName] = [];
        }

        predicateChecker[spriteName].push((sprite) => {
            try {
                return predicate(sprite) && this.updateEventString(eventString);
            } catch (e) {
                // todo cant put this in the result error list .... ignore?
                console.error(e);
                return false;
            }
        });
    }

    /**
     * Register an variable change event for a variable.
     * @param varName Name of the variable.
     * @param eventString Function checking if the predicate for the event is fulfilled.
     * @param predicate String defining the event (see CheckUtility.getEventString)
     */
    registerVarEvent(varName: string, eventString: string, predicate: () => boolean) {
        if (this.registeredVarEvents.indexOf(eventString) == -1) {
            this.registeredVarEvents.push(eventString);

            if (this.variableChecks[varName] == undefined || this.variableChecks[varName] == null) {
                this.variableChecks[varName] = [];
            }
            this.variableChecks[varName].push(() => {
                if (predicate()) {
                    this.emit(CheckUtility.CHECK_UTILITY_EVENT, [eventString]);
                }
            })
        }
    }

    private checkForEvent(checks, sprite) {
        if (checks[sprite.name] != null) {
            let change = false;
            checks[sprite.name].forEach(fun => {
                if (fun(sprite)) {
                    change = true;
                }
            });
            if (change) {
                this.emit(CheckUtility.CHECK_UTILITY_EVENT, this.eventStrings);
            }
        }
    }

    private updateEventString(event: string): boolean {
        if (this.eventStrings.indexOf(event) != -1) {
            return false;
        }

        if (this.eventStrings.length == 0) {
            this.eventStrings.push(event);
            return true;
        }

        let newEventString = [];
        const check1 = CheckUtility.splitEventString(event);
        for (let i = 0; i < this.eventStrings.length; i++) {
            const check2 = CheckUtility.splitEventString(this.eventStrings[i]);
            if (!Check.testForContradictingOnDummies(check1, check2)) {
                newEventString.push(this.eventStrings[i]);
            }
        }
        this.eventStrings = newEventString;
        this.eventStrings.push(event);
        return true;
    }

    private static splitEventString(eventString: string): { name: CheckName, negated: boolean, args: any[] } {
        const negated = eventString.startsWith("!");
        if (negated) {
            eventString = eventString.substring(1, eventString.length);
        }
        const splits = eventString.split(":");
        return {
            negated: negated,
            name: CheckName[splits[0]],
            args: splits.slice(1, splits.length)
        }
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

    /**
     * Get a string defining the event of a listener.
     */
    static getEventString(name: CheckName, negated: boolean, ...args): string {
        let string = negated ? "!" + name : name;
        for (let i = 0; i < args.length; i++) {
            string += ":" + args[i];
        }
        return string;
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
