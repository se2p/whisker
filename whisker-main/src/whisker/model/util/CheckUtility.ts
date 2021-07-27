import TestDriver from "../../../test/test-driver";
import ModelResult from "../../../test-runner/model-result";
import {Effect} from "../components/Effect";
import {ProgramModelEdge} from "../components/ModelEdge";
import {getEffectFailedOutput} from "./ModelError";
import {ProgramModel} from "../components/ProgramModel";
import EventEmitter from "events";
import Sprite from "../../../vm/sprite";
import {CheckName} from "../components/Check";

/**
 * For edge condition or effect checks that need to listen to the onMoved of a sprite or keys before a step.
 */
export class CheckUtility extends EventEmitter {
    private readonly testDriver: TestDriver;
    private readonly modelResult: ModelResult;

    static readonly CHECK_UTILITY_EVENT = "CheckUtilityEvent"
    private onMovedChecks: { [key: string]: ((sprite) => void)[] } = {};
    private onVisualChecks: { [key: string]: ((sprite) => void)[] } = {};
    private onSayOrThinkChecks: { [key: string]: ((sprite) => void)[] } = {};
    private variableChecks: { [key: string]: (() => void)[] } = {};

    private registeredOnMove: string[] = [];
    private registeredVisualChange: string[] = [];
    private registeredOutput: string[] = [];
    private registeredVarEvents: string[] = [];

    private eventStrings: string[] = [];

    private effectChecks: { effect: Effect, edge: ProgramModelEdge, model: ProgramModel }[] = [];

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
        this.testDriver.vmWrapper.sprites.onModelSpriteMoved(sprite =>
            this.checkForEvent(this.onMovedChecks, sprite));
        this.testDriver.vmWrapper.sprites.onSayOrThink(sprite => {
            this.checkFailedOutputEvents();
            this.checkForEvent(this.onSayOrThinkChecks, sprite);
        });
        this.testDriver.vmWrapper.sprites.onSpriteVisualChangeModel(sprite =>
            this.checkForEvent(this.onVisualChecks, sprite));
        this.testDriver.vmWrapper.sprites.onVariableChange((varName: string) => {
            if (this.variableChecks[varName] != null) {
                this.variableChecks[varName].forEach(fun => fun());
                if (this.eventStrings.length > 0) {
                    this.emit(CheckUtility.CHECK_UTILITY_EVENT, this.eventStrings);
                }
                this.eventStrings = [];
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
     * Register an visual change event listener. (Attributes: size, direction, effect, visible, costume,
     * rotationStyle.  Also and x,y motions, but should be registered on move)
     * @param spriteName Name of the actual sprite.
     * @param eventString Function checking if the predicate for the event is fulfilled.
     * @param predicate String defining the event (see CheckUtility.getEventString)
     */
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


    private register(predicateChecker: { [key: string]: ((sprite) => void)[] }, eventString: string,
                     spriteName: string, predicate: (sprite: Sprite) => boolean) {
        // no check for this sprite till now
        if (predicateChecker[spriteName] == undefined || predicateChecker[spriteName] == null) {
            predicateChecker[spriteName] = [];
        }

        predicateChecker[spriteName].push((sprite) => {
            let predicateResult;
            try {
                predicateResult = predicate(sprite);
            } catch (e) {
                this.modelResult.addError(e);
                console.error(e);
            }
            if (predicateResult) {
                this.eventStrings.push(eventString);
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
                let predicateResult;
                try {
                    predicateResult = predicate();
                } catch (e) {
                    this.modelResult.addError(e);
                    console.error(e);
                }
                if (predicateResult) {
                    this.eventStrings.push(eventString);
                }
            })
        }
    }

    private checkForEvent(checks, sprite) {
        if (checks[sprite.name] != null) {
            checks[sprite.name].forEach(fun => fun(sprite));
            if (this.eventStrings.length > 0) {
                this.emit(CheckUtility.CHECK_UTILITY_EVENT, this.eventStrings);
            }
            this.eventStrings = [];
        }
    }

    resetAfterStep() {
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
     * Split up the event string.
     * @param eventString
     */
    static splitEventString(eventString: string): { name: CheckName, negated: boolean, args: any[] } {
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
    checkEffects(): Effect[] {
        let contradictingEffects = [];
        let doNotCheck = {};
        let newEffects = [];

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
                let effect = this.effectChecks[i].effect;
                let stepsSinceLastTransition = model.stepNbrOfLastTransition - model.stepNbrOfScndLastTransition + 1;
                try {
                    if (!effect.check(stepsSinceLastTransition, model.stepNbrOfProgramEnd)) {
                        newEffects.push(this.effectChecks[i]);
                    }
                } catch (e) {
                    this.failOnProgramModel(this.effectChecks[i].edge, effect);
                }
            } else {
                contradictingEffects.push(this.effectChecks[i].effect);
            }
        }

        this.effectChecks = newEffects
        return contradictingEffects;
    }

    private failOnProgramModel(edge, effect) {
        let output = getEffectFailedOutput(edge, effect);
        console.error(output, this.testDriver.getTotalStepsExecuted());
        this.modelResult.addFail(output);
    }

    checkEventEffects() {
        let newEffects = [];
        for (let i = 0; i < this.effectChecks.length; i++) {
            let model = this.effectChecks[i].model;
            let effect = this.effectChecks[i].effect;
            let stepsSinceLastTransition = model.stepNbrOfLastTransition - model.stepNbrOfScndLastTransition + 1;
            try {
                if (!effect.check(stepsSinceLastTransition, model.stepNbrOfProgramEnd)) {
                    newEffects.push(this.effectChecks[i]);
                }
            } catch (e) {
                this.failOnProgramModel(this.effectChecks[i].edge, effect);
            }
        }
        this.effectChecks = newEffects;
    }

    makeFailedOutputs() {
        for (let i = 0; i < this.failedOutputsEvents.length; i++) {
            this.failOnProgramModel(this.failedOutputsEvents[i].edge, this.failedOutputsEvents[i].effect);
        }
        this.failedOutputsEvents = [];
        for (let i = 0; i < this.effectChecks.length; i++) {
            if (this.effectChecks[i].effect.name != CheckName.Output) {
                this.failOnProgramModel(this.effectChecks[i].edge, this.effectChecks[i].effect);
            } else {
                this.failedOutputsEvents.push(this.effectChecks[i]);
            }
        }
        this.effectChecks = [];
    }

    private checkFailedOutputEvents() {
        let newFailedList = [];
        for (let i = 0; i < this.failedOutputsEvents.length; i++) {
            let model = this.failedOutputsEvents[i].model;
            let effect = this.failedOutputsEvents[i].effect;
            let stepsSinceLastTransition = model.stepNbrOfLastTransition - model.stepNbrOfScndLastTransition + 1;
            try {
                if (!effect.check(stepsSinceLastTransition, model.stepNbrOfProgramEnd)) {
                    newFailedList.push(this.failedOutputsEvents[i]);
                }
            } catch (e) {
                this.failOnProgramModel(this.failedOutputsEvents[i].edge, effect);
            }
        }
        this.failedOutputsEvents = newFailedList;
    }
}
