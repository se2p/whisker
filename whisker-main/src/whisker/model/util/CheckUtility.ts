import TestDriver from "../../../test/test-driver";
import {ModelResult} from "../../../test-runner/model-result";
import {AbstractEdge} from "../components/AbstractEdge";
import {getEffectFailedOutput, getErrorMessage, getErrorOnEdgeOutput} from "./ModelError";
import EventEmitter from "events";
import Sprite from "../../../vm/sprite";
import {ProgramModelEdge} from "../components/ProgramModelEdge";
import {EndModel, ProgramModel} from "../components/ProgramModel";
import {Check} from "../checks/newCheck";

type EffectCheck = {
    effect: Check,
    reason: Record<string, unknown>,
    edge: ProgramModelEdge,
    model: ProgramModel | EndModel
};

/**
 * For edge condition or effect checks that need to listen to the onMoved of a sprite or keys before a step.
 */
export class CheckUtility extends EventEmitter {
    static readonly CHECK_UTILITY_EVENT = "CheckUtilityEvent";
    static readonly CHECK_LOG_FAIL = "CheckLogFail";
    private readonly _testDriver: TestDriver;
    private readonly _modelResult: ModelResult;
    private _onMovedListener: Record<string, boolean> = {};
    private _onVisualListener: Record<string, boolean> = {};
    private _onSayOrThinkListener: Record<string, boolean> = {};
    private _variableListener: Record<string, boolean> = {};

    private _effectChecks: EffectCheck[] = [];

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
            this._checkForEvent(this._onMovedListener, sprite.name));
        this._testDriver.vmWrapper.sprites.onSayOrThinkModel((sprite: Sprite) => {
            this._checkForEvent(this._onSayOrThinkListener, sprite.name);
        });
        this._testDriver.vmWrapper.sprites.onSpriteVisualChangeModel((sprite: Sprite) =>
            this._checkForEvent(this._onVisualListener, sprite.name));
        this._testDriver.vmWrapper.sprites.onVariableChangeModel((varName: string) => {
            this._checkForEvent(this._variableListener, varName);
        });
    }

    stop(): void {
        this._testDriver.vmWrapper.sprites.onSpriteMovedModel(null);
        this._testDriver.vmWrapper.sprites.onSayOrThinkModel(null);
        this._testDriver.vmWrapper.sprites.onSpriteVisualChangeModel(null);
        this._testDriver.vmWrapper.sprites.onVariableChangeModel(null);
        this._onMovedListener = {};
        this._onVisualListener = {};
        this._onSayOrThinkListener = {};
        this._variableListener = {};
    }

    /**
     * Register a listener on the movement of a sprite with a certain predicate to be fulfilled for the event to be
     * triggered.
     * @param spriteName Name of the sprite.
     */
    registerOnMoveEvent(spriteName: string): void {
        this._onMovedListener[spriteName] = true;
    }

    /**
     * Register a visual change event listener. (Attributes: size, direction, effect, visible, costume,
     * rotationStyle.  Also and x,y motions, but should be registered on move)
     * @param spriteName Name of the actual sprite.
     */
    registerOnVisualChange(spriteName: string): void {
        this._onVisualListener[spriteName] = true;
    }

    /**
     * Register an output event on the visual change checks.
     * @param spriteName Name of the sprite.
     */
    registerOutput(spriteName: string): void {
        this._onSayOrThinkListener[spriteName] = true;
    }

    /**
     * Register a variable change event for a variable.
     */
    registerVarEvent(varName: string): void {
        this._variableListener[varName] = true;
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
     * Check whether any key was pressed at the beginning of the step.
     */
    isAnyKeyDown(): boolean {
        return this._testDriver.isKeyDown("any");
    }

    /**
     * Register the effects of an edge in this listener to test them later on.
     * @param takenEdge The taken edge of a model.
     * @param model Model of the edge.
     */
    registerEffectCheck(takenEdge: ProgramModelEdge, model: ProgramModel | EndModel): void {
        takenEdge.effects.forEach(effect => {
            this._effectChecks.push({effect: effect, reason: undefined, edge: takenEdge, model: model});
        });
    }

    /**
     * Check the registered effects of this step.
     */
    checkEffects(): Check[] {
        const contradictingEffects: Check[] = [];
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
                    const res = effect.check(stepsSinceLastTransition, model.programEndStep);
                    if (res.passed === false) {
                        this._effectChecks[i].reason = res.reason;
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
     * @param reason Insights on why the effect failed.
     */
    addFailOutput(edge: AbstractEdge, effect: Check, reason: Record<string, unknown>): void {
        const output = getEffectFailedOutput(edge, effect, {step: this._testDriver.getTotalStepsExecuted(), ...reason});
        this._failOrError(output, this._failOutputs);
        this._modelResult.addFail(output);
    }

    /**
     * Add an error to the error list of the test.
     * @param edgeLabel Label of the edge that had the error.
     * @param graphID ID of the graph, where the error was thrown.
     * @param e Error that was thrown
     */
    addErrorOutput(edgeLabel: string, graphID: string, e: Error): void {
        const message = getErrorMessage(e);
        const output = getErrorOnEdgeOutput(edgeLabel, graphID, message);
        this._failOrError(output, this._errorOutputs);
        this._modelResult.addError(output);
    }

    /**
     * Make outputs for the failed effects of the last step, without the depending ones on the sayText attribute.
     */
    makeFailedOutputs(): void {
        for (const e of this._effectChecks) {
            this.addFailOutput(e.edge, e.effect, e.reason);
        }
        this._effectChecks = [];
    }

    private _checkForEvent(checks: Record<string, boolean>, key: string): void {
        if (checks[key] === true) {
            this.emit(CheckUtility.CHECK_UTILITY_EVENT);
        }
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
}
