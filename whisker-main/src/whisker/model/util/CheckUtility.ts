import TestDriver from "../../../test/test-driver";
import ModelResult from "../../../test-runner/model-result";
import {Effect} from "../components/Effect";
import {ModelEdge} from "../components/ModelEdge";
import {getEffectFailedOutput, getErrorMessage, getErrorOnEdgeOutput} from "./ModelError";
import {ProgramModel} from "../components/ProgramModel";
import EventEmitter from "events";
import Sprite from "../../../vm/sprite";
import {ArgType, CheckName} from "../components/Check";
import {ProgramModelEdge} from "../components/ProgramModelEdge";

type EffectCheck = { effect: Effect, edge: ProgramModelEdge, model: ProgramModel };

/**
 * For edge condition or effect checks that need to listen to the onMoved of a sprite or keys before a step.
 */
export class CheckUtility extends EventEmitter {
    private readonly _testDriver: TestDriver;
    private readonly _modelResult: ModelResult;

    static readonly CHECK_UTILITY_EVENT = "CheckUtilityEvent";
    static readonly CHECK_LOG_FAIL = "CheckLogFail";
    private _onMovedChecks: Record<string, ((sprite: Sprite) => void)[]> = {};
    private _onVisualChecks: Record<string, ((sprite: Sprite) => void)[]> = {};
    private _onSayOrThinkChecks: Record<string, ((sprite: Sprite) => void)[]> = {};
    private _variableChecks: Record<string, (() => void)[]> = {};

    private _registeredOnMove: string[] = [];
    private _registeredVisualChange: string[] = [];
    private _registeredOutput: string[] = [];
    private _registeredVarEvents: string[] = [];

    private _eventStrings: string[] = [];

    private _effectChecks: EffectCheck[] = [];
    private _failedOutputsEvents: EffectCheck[] = [];

    // how often the errors or fails happened, change this boolean for printing all or only ten occurrences per error
    private _onlyTenOutputs = true;
    private _failOutputs: Record<string, number> = {};
    private _errorOutputs: Record<string, number> = {};

    //turn logs in console off an on
    private _logsInConsole = true;

    /**
     * Get an instance of a condition state saver.
     * @param testDriver Instance of the test driver.
     * @param nbrOfAllModels Number of all models.
     * @param modelResult For saving errors of the model.
     */
    constructor(testDriver: TestDriver, nbrOfAllModels: number, modelResult: ModelResult) {
        super();
        this._testDriver = testDriver;
        this._modelResult = modelResult;
        this.setMaxListeners(nbrOfAllModels);
        this._testDriver.vmWrapper.sprites.onSpriteMovedModel((sprite: Sprite) =>
            this._checkForEvent(this._onMovedChecks, sprite));
        this._testDriver.vmWrapper.sprites.onSayOrThinkModel((sprite: Sprite) => {
            this._checkFailedOutputEvents();
            this._checkForEvent(this._onSayOrThinkChecks, sprite);
        });
        this._testDriver.vmWrapper.sprites.onSpriteVisualChangeModel((sprite: Sprite) =>
            this._checkForEvent(this._onVisualChecks, sprite));
        this._testDriver.vmWrapper.sprites.onVariableChangeModel((varName: string) => {
            if (this._variableChecks[varName] != null) {
                this._variableChecks[varName].forEach(fun => fun());
                if (this._eventStrings.length > 0) {
                    this.emit(CheckUtility.CHECK_UTILITY_EVENT, this._eventStrings);
                }
                this._eventStrings = [];
            }
        });
    }

    stop(): void {
        this._testDriver.vmWrapper.sprites.onSpriteMovedModel(null);
        this._testDriver.vmWrapper.sprites.onSayOrThinkModel(null);
        this._testDriver.vmWrapper.sprites.onSpriteVisualChangeModel(null);
        this._testDriver.vmWrapper.sprites.onVariableChangeModel(null);
        this._onMovedChecks = {};
        this._onVisualChecks = {};
        this._onSayOrThinkChecks = {};
        this._variableChecks = {};
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
    registerOnMoveEvent(spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                        predicate: (sprite: Sprite) => boolean): void {
        if (!this._registeredOnMove.includes(eventString)) {
            this._registeredOnMove.push(eventString);
            this._register(this._onMovedChecks, eventString, spriteName, edgeLabel, graphID, predicate);
        }
    }

    /**
     * Register a visual change event listener. (Attributes: size, direction, effect, visible, costume,
     * rotationStyle.  Also and x,y motions, but should be registered on move)
     * @param spriteName Name of the actual sprite.
     * @param eventString Function checking if the predicate for the event is fulfilled.
     * @param edgeLabel Label of the edge containing the check that is registered on the event listener.
     * @param graphID ID of the parent graph of the check.
     * @param predicate String defining the event (see CheckUtility.getEventString)
     */
    registerOnVisualChange(spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                           predicate: (sprite: Sprite) => boolean): void {
        if (this._registeredVisualChange.indexOf(eventString) == -1) {
            this._registeredVisualChange.push(eventString);
            this._register(this._onVisualChecks, eventString, spriteName, edgeLabel, graphID, predicate);
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
                   predicate: (sprite: Sprite) => boolean): void {
        if (this._registeredOutput.indexOf(eventString) == -1) {
            this._registeredOutput.push(eventString);
            this._register(this._onSayOrThinkChecks, eventString, spriteName, edgeLabel, graphID, predicate);
        }
    }

    private _register(predicateChecker: Record<string, ((sprite: Sprite) => void)[]>, eventString: string,
                      spriteName: string, edgeLabel: string, graphID: string, predicate: (sprite: Sprite) => boolean) {
        // no check for this sprite till now
        if (predicateChecker[spriteName] == undefined || predicateChecker[spriteName] == null) {
            predicateChecker[spriteName] = [];
        }

        predicateChecker[spriteName].push((sprite) => {
            try {
                const predicateResult = predicate(sprite);
                if (predicateResult) {
                    this._eventStrings.push(eventString);
                }
            } catch (e) {
                this.addErrorOutput(edgeLabel, graphID, e);
            }
        });
    }

    /**
     * Register a variable change event for a variable.
     * @param varName Name of the variable.
     * @param edgeLabel Label of the edge containing the check that is registered on the event listener.
     * @param graphID ID of the parent graph of the check.
     * @param eventString Function checking if the predicate for the event is fulfilled.
     * @param predicate String defining the event (see CheckUtility.getEventString)
     */
    registerVarEvent(varName: string, eventString: string, edgeLabel: string, graphID: string, predicate: () => boolean): void {
        if (this._registeredVarEvents.indexOf(eventString) == -1) {
            this._registeredVarEvents.push(eventString);

            if (this._variableChecks[varName] == undefined || this._variableChecks[varName] == null) {
                this._variableChecks[varName] = [];
            }
            this._variableChecks[varName].push(() => {
                let predicateResult = false;
                try {
                    predicateResult = predicate();
                } catch (e) {
                    this.addErrorOutput(edgeLabel, graphID, e);
                }
                if (predicateResult) {
                    this._eventStrings.push(eventString);
                }
            });
        }
    }

    private _checkForEvent(checks: Record<string, ((sprite: Sprite) => void)[]>, sprite: Sprite): void {
        if (checks[sprite.name] != null) {
            checks[sprite.name].forEach(fun => fun(sprite));
            if (this._eventStrings.length > 0) {
                this.emit(CheckUtility.CHECK_UTILITY_EVENT, this._eventStrings);
            }
            this._eventStrings = [];
        }
    }

    /**
     * Check whether a key was pressed at the beginning of the step.
     * @param keyName Name of the key.
     */
    isKeyDown(keyName: string): boolean {
        return this._testDriver.vmWrapper.vm.runtime.ioDevices.keyboard.getKeyIsDown(keyName);
        // replaced because of bug in test driver...
        // return this.testDriver.isKeyDown(keyName);
    }

    /**
     * Get a string defining the event of a listener.
     */
    static getEventString(name: CheckName, negated: boolean, ...args: ArgType[]): string {
        let string = negated ? "!" + name : name;
        for (const arg of args) {
            string += ":" + arg;
        }
        return string;
    }

    /**
     * Split up the event string.
     * @param eventString
     */
    static splitEventString(eventString: string): { name: CheckName, negated: boolean, args: ArgType[] } {
        const negated = eventString.startsWith("!");
        if (negated) {
            eventString = eventString.substring(1, eventString.length);
        }
        const splits = eventString.split(":");
        return {
            negated: negated,
            name: CheckName[splits[0] as CheckName],
            args: splits.slice(1, splits.length)
        };
    }

    /**
     * Register the effects of an edge in this listener to test them later on.
     * @param takenEdge The taken edge of a model.
     * @param model Model of the edge.
     */
    registerEffectCheck(takenEdge: ProgramModelEdge, model: ProgramModel): void {
        takenEdge.effects.forEach(effect => {
            this._effectChecks.push({effect: effect, edge: takenEdge, model: model});
        });
    }

    /**
     * Check the registered effects of this step.
     */
    checkEffects(): Effect[] {
        const contradictingEffects: Effect[] = [];
        const doNotCheck: Record<number, boolean> = {};
        const newEffects: EffectCheck[] = [];

        // check for contradictions in effects and only test an effect if it does not contradict another one
        for (let i = 0; i < this._effectChecks.length; i++) {
            const effect = this._effectChecks[i].effect;
            for (let j = i + 1; j < this._effectChecks.length; j++) {
                if (effect.contradicts(this._effectChecks[j].effect)) {
                    doNotCheck[i] = true;
                    doNotCheck[j] = true;
                }
            }

            if (!doNotCheck[i]) {
                const model = this._effectChecks[i].model;
                const effect = this._effectChecks[i].effect;
                const stepsSinceLastTransition = model.lastTransitionStep - model.secondLastTransitionStep + 1;
                try {
                    if (!effect.check(stepsSinceLastTransition, model.programEndStep)) {
                        newEffects.push(this._effectChecks[i]);
                    }
                } catch (e) {
                    this.addErrorOutput(this._effectChecks[i].edge.label, this._effectChecks[i].edge.graphID, e);
                }
            } else {
                contradictingEffects.push(this._effectChecks[i].effect);
            }
        }

        this._effectChecks = newEffects;
        return contradictingEffects;
    }

    /**
     * Add a failed condition that was not fulfilled in a time limit.
     * @param output The time limit output.
     */
    addTimeLimitFailOutput(output: string): void {
        this._failOrError(output, this._failOutputs);
        this._modelResult.addFail(output);
    }

    /**
     * Add an edge's effect to the failed output of the test.
     * @param edge Edge that has a failed effect.
     * @param effect Effect that failed.
     */
    addFailOutput(edge: ModelEdge, effect: Effect): void {
        const output = getEffectFailedOutput(edge, effect);
        this._failOrError(output, this._failOutputs);
        this._modelResult.addFail(output);
    }

    /**
     * Add an error to the error list of the test.
     * @param edgeLabel Label of the edge that had the error.
     * @param graphID ID of the graph, where the error was thrown.
     * @param e Error that was thrown
     */
    addErrorOutput(edgeLabel: string, graphID: string, e: unknown): void {
        const message = getErrorMessage(e);
        const output = getErrorOnEdgeOutput(edgeLabel, graphID, message);
        this._failOrError(output, this._errorOutputs);
        this._modelResult.addError(output);
    }

    private _failOrError(output: string, failureList: Record<string, number>) {
        if (!this._logsInConsole) {
            return;
        }
        if (this._onlyTenOutputs) {
            if (failureList[output] == undefined) {
                failureList[output] = 0;
            }
            failureList[output]++;
            if (failureList[output] == 10) {
                this.emit(CheckUtility.CHECK_LOG_FAIL, output + "(10th time, no more outputs for this)");
                // logger.error(output + "(10th time, no more outputs for this)", this.testDriver.getTotalStepsExecuted());
            } else if (failureList[output] < 10) {
                this.emit(CheckUtility.CHECK_LOG_FAIL, output);
                // logger.error(output, this.testDriver.getTotalStepsExecuted());
            }
        } else {
            this.emit(CheckUtility.CHECK_LOG_FAIL, output);
            // logger.error(output, this.testDriver.getTotalStepsExecuted());
        }
    }

    /**
     * Check effects that are already registered for checking, triggered by an event.
     */
    checkEventEffects(): void {
        this._effectChecks = this._check(this._effectChecks);
    }

    /**
     * Make outputs for the failed effects of the last step, without the depending ones on the sayText attribute.
     */
    makeFailedOutputs(): void {
        for (const e of this._failedOutputsEvents) {
            this.addFailOutput(e.edge, e.effect);
        }
        this._failedOutputsEvents = [];
        for (const e of this._effectChecks) {
            if (!e.effect.dependsOnSayText) {
                this.addFailOutput(e.edge, e.effect);
            } else {
                this._failedOutputsEvents.push(e);
            }
        }
        this._effectChecks = [];
    }

    private _checkFailedOutputEvents() {
        this._failedOutputsEvents = this._check(this._failedOutputsEvents);
    }

    private _check(checks: EffectCheck[]): EffectCheck[] {
        const newFailedList = [];
        for (const c of checks) {
            const effect = c.effect;
            const stepsSinceLastTransition = c.model.lastTransitionStep
                - c.model.secondLastTransitionStep + 1;
            try {
                if (!effect.check(stepsSinceLastTransition, c.model.programEndStep)) {
                    newFailedList.push(c);
                }
            } catch (e) {
                this.addErrorOutput(c.edge.label, c.edge.graphID, e);
            }
        }
        return newFailedList;
    }
}
