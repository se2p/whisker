import TestDriver from "../../../test/test-driver";
import ModelResult from "../../../test-runner/model-result";
import {Effect} from "../components/Effect";
import {ModelEdge, ProgramModelEdge} from "../components/ModelEdge";
import {getEffectFailedOutput, getErrorOnEdgeOutput} from "./ModelError";
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

    static readonly CHECK_UTILITY_EVENT = "CheckUtilityEvent";
    static readonly CHECK_LOG_FAIL = "CheckLogFail";
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
    private failedOutputsEvents: { effect: Effect, edge: ProgramModelEdge, model: ProgramModel }[] = [];

    // how often the errors or fails happened, change this boolean for printing all or only ten occurrences per error
    private onlyTenOutputs = true;
    private failOutputs: { [key: string]: number } = {};
    private errorOutputs: { [key: string]: number } = {};

    //turn logs in console off an on
    private logsInConsole = true;

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
        this.testDriver.vmWrapper.sprites.onSpriteMovedModel(sprite =>
            this.checkForEvent(this.onMovedChecks, sprite));
        this.testDriver.vmWrapper.sprites.onSayOrThinkModel(sprite => {
            this.checkFailedOutputEvents();
            this.checkForEvent(this.onSayOrThinkChecks, sprite);
        });
        this.testDriver.vmWrapper.sprites.onSpriteVisualChangeModel(sprite =>
            this.checkForEvent(this.onVisualChecks, sprite));
        this.testDriver.vmWrapper.sprites.onVariableChangeModel((varName: string) => {
            if (this.variableChecks[varName] != null) {
                this.variableChecks[varName].forEach(fun => fun());
                if (this.eventStrings.length > 0) {
                    this.emit(CheckUtility.CHECK_UTILITY_EVENT, this.eventStrings);
                }
                this.eventStrings = [];
            }
        });
    }

    stop() {
        this.testDriver.vmWrapper.sprites.onSpriteMovedModel(null);
        this.testDriver.vmWrapper.sprites.onSayOrThinkModel(null);
        this.testDriver.vmWrapper.sprites.onSpriteVisualChangeModel(null);
        this.testDriver.vmWrapper.sprites.onVariableChangeModel(null);
        this.onMovedChecks = {};
        this.onVisualChecks = {};
        this.onSayOrThinkChecks = {};
        this.variableChecks = {};
    }

    /**
     * Register a listener on the movement of a sprite with a certain predicate to be fulfilled for the event to be
     * triggered.
     * @param spriteName Name of the sprite.
     * @param edgeLabel Label of the edge containing the check that is registered on the event listener.
     * @param graphID ID of the parent graph of the check.
     * @param predicate Function checking if the predicate for the event is fulfilled.
     * @param eventString String defining the event (see CheckUtility.getEventString)
     */
    registerOnMoveEvent(spriteName: string, eventString: string, edgeLabel, graphID: string,
                        predicate: (sprite: Sprite) => boolean) {
        if (this.registeredOnMove.indexOf(eventString) == -1) {
            this.registeredOnMove.push(eventString);
            this.register(this.onMovedChecks, eventString, spriteName, edgeLabel, graphID, predicate);
        }
    }

    /**
     * Register an visual change event listener. (Attributes: size, direction, effect, visible, costume,
     * rotationStyle.  Also and x,y motions, but should be registered on move)
     * @param spriteName Name of the actual sprite.
     * @param eventString Function checking if the predicate for the event is fulfilled.
     * @param edgeLabel Label of the edge containing the check that is registered on the event listener.
     * @param graphID ID of the parent graph of the check.
     * @param predicate String defining the event (see CheckUtility.getEventString)
     */
    registerOnVisualChange(spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                           predicate: (sprite: Sprite) => boolean) {
        if (this.registeredVisualChange.indexOf(eventString) == -1) {
            this.registeredVisualChange.push(eventString);
            this.register(this.onVisualChecks, eventString, spriteName, edgeLabel, graphID, predicate);
        }
    }

    /**
     * Register an output event on the visual change checks.
     * @param spriteName Name of the sprite.
     * @param eventString Function checking if the predicate for the event is fulfilled.
     * @param edgeLabel Label of the edge containing the check that is registered on the event listener.
     * @param graphID ID of the parent graph of the check.
     * @param predicate String defining the event (see CheckUtility.getEventString)
     */
    registerOutput(spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                   predicate: (sprite: Sprite) => boolean) {
        if (this.registeredOutput.indexOf(eventString) == -1) {
            this.registeredOutput.push(eventString);
            this.register(this.onSayOrThinkChecks, eventString, spriteName, edgeLabel, graphID, predicate);
        }
    }

    private register(predicateChecker: { [key: string]: ((sprite) => void)[] }, eventString: string,
                     spriteName: string, edgeLabel: string, graphID, predicate: (sprite: Sprite) => boolean) {
        // no check for this sprite till now
        if (predicateChecker[spriteName] == undefined || predicateChecker[spriteName] == null) {
            predicateChecker[spriteName] = [];
        }

        predicateChecker[spriteName].push((sprite) => {
            let predicateResult;
            try {
                predicateResult = predicate(sprite);
            } catch (e) {
                this.addErrorOutput(edgeLabel, graphID, e);
            }
            if (predicateResult) {
                this.eventStrings.push(eventString);
            }
        });
    }

    /**
     * Register an variable change event for a variable.
     * @param varName Name of the variable.
     * @param edgeLabel Label of the edge containing the check that is registered on the event listener.
     * @param graphID ID of the parent graph of the check.
     * @param eventString Function checking if the predicate for the event is fulfilled.
     * @param predicate String defining the event (see CheckUtility.getEventString)
     */
    registerVarEvent(varName: string, eventString: string, edgeLabel: string, graphID: string, predicate: () => boolean) {
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
                    this.addErrorOutput(edgeLabel, graphID, e);
                }
                if (predicateResult) {
                    this.eventStrings.push(eventString);
                }
            });
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

    /**
     * Check whether a key was pressed at the beginning of the step.
     * @param keyName Name of the key.
     */
    isKeyDown(keyName: string) {
        return this.testDriver.vmWrapper.vm.runtime.ioDevices.keyboard.getKeyIsDown(keyName);
        // replaced because of bug in test driver...
        // return this.testDriver.isKeyDown(keyName);
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
        };
    }

    /**
     * Register the effects of an edge in this listener to test them later on.
     * @param takenEdge The taken edge of a model.
     * @param model Model of the edge.
     */
    registerEffectCheck(takenEdge: ProgramModelEdge, model: ProgramModel) {
        takenEdge.effects.forEach(effect => {
            this.effectChecks.push({effect: effect, edge: takenEdge, model: model});
        });
    }

    /**
     * Check the registered effects of this step.
     */
    checkEffects(): Effect[] {
        let contradictingEffects = [];
        let doNotCheck = {};
        let newEffects = [];

        // check for contradictions in effects and only test an effect if it does not contradict another one
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
                let stepsSinceLastTransition = model.lastTransitionStep - model.secondLastTransitionStep + 1;
                try {
                    if (!effect.check(stepsSinceLastTransition, model.programEndStep)) {
                        newEffects.push(this.effectChecks[i]);
                    }
                } catch (e) {
                    this.addErrorOutput(this.effectChecks[i].edge.label, this.effectChecks[i].edge.graphID, e);
                }
            } else {
                contradictingEffects.push(this.effectChecks[i].effect);
            }
        }

        this.effectChecks = newEffects;
        return contradictingEffects;
    }

    /**
     * Add a failed condition that was not fulfilled in a time limit.
     * @param output The time limit output.
     */
    addTimeLimitFailOutput(output: string) {
        this.failOrError(output, this.failOutputs);
        this.modelResult.addFail(output);
    }

    /**
     * Add an edge's effect to the failed output of the test.
     * @param edge Edge that has a failed effect.
     * @param effect Effect that failed.
     */
    addFailOutput(edge: ModelEdge, effect) {
        let output = getEffectFailedOutput(edge, effect);
        this.failOrError(output, this.failOutputs);
        this.modelResult.addFail(output);
    }

    /**
     * Add an error to the error list of the test.
     * @param edgeLabel Label of the edge that had the error.
     * @param graphID ID of the graph, where the error was thrown.
     * @param e Error that was thrown
     */
    addErrorOutput(edgeLabel: string, graphID: string, e: Error) {
        let output = getErrorOnEdgeOutput(edgeLabel, graphID, e.message);
        this.failOrError(output, this.errorOutputs);
        this.modelResult.addError(output);
    }

    private failOrError(output: string, failureList: { [key: string]: number }) {
        if (!this.logsInConsole) {
            return;
        }
        if (this.onlyTenOutputs) {
            if (failureList[output] == undefined) {
                failureList[output] = 0;
            }
            failureList[output]++;
            if (failureList[output] == 10) {
                this.emit(CheckUtility.CHECK_LOG_FAIL, output + "(10th time, no more outputs for this)");
                // console.error(output + "(10th time, no more outputs for this)", this.testDriver.getTotalStepsExecuted());
            } else if (failureList[output] < 10) {
                this.emit(CheckUtility.CHECK_LOG_FAIL, output);
                // console.error(output, this.testDriver.getTotalStepsExecuted());
            }
        } else {
            this.emit(CheckUtility.CHECK_LOG_FAIL, output);
            // console.error(output, this.testDriver.getTotalStepsExecuted());
        }
    }

    /**
     * Check effects that are already registered for checking, triggered by an event.
     */
    checkEventEffects() {
        this.effectChecks = this.check(this.effectChecks);
    }

    /**
     * Make outputs for the failed effects of the last step, without the depending ones on the sayText attribute.
     */
    makeFailedOutputs() {
        for (let i = 0; i < this.failedOutputsEvents.length; i++) {
            this.addFailOutput(this.failedOutputsEvents[i].edge, this.failedOutputsEvents[i].effect);
        }
        this.failedOutputsEvents = [];
        for (let i = 0; i < this.effectChecks.length; i++) {
            if (!this.effectChecks[i].effect.dependsOnSayText) {
                this.addFailOutput(this.effectChecks[i].edge, this.effectChecks[i].effect);
            } else {
                this.failedOutputsEvents.push(this.effectChecks[i]);
            }
        }
        this.effectChecks = [];
    }

    private checkFailedOutputEvents() {
        this.failedOutputsEvents = this.check(this.failedOutputsEvents);
    }

    private check(checks: { effect: Effect, edge: ProgramModelEdge, model: ProgramModel }[]) {
        let newFailedList = [];
        for (let i = 0; i < checks.length; i++) {
            let effect = checks[i].effect;
            let stepsSinceLastTransition = checks[i].model.lastTransitionStep
                - checks[i].model.secondLastTransitionStep + 1;
            try {
                if (!effect.check(stepsSinceLastTransition, checks[i].model.programEndStep)) {
                    newFailedList.push(checks[i]);
                }
            } catch (e) {
                this.addErrorOutput(checks[i].edge.label, checks[i].edge.graphID, e);
            }
        }
        return newFailedList;
    }
}
