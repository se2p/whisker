import TestDriver from "../../../test/test-driver";
import {ModelResult} from "../../../test-runner/model-result";
import {AbstractEdge} from "../components/AbstractEdge";
import {getErrorMessage, getReasonAppendix} from "./ModelError";
import EventEmitter from "events";
import Sprite from "../../../vm/sprite";
import {ProgramModelEdge} from "../components/ProgramModelEdge";
import {Check} from "../checks/newCheck";
import {TimeAfterEnd, TimeBetween, TimeElapsed} from "../checks/Time";
import {Reason} from "../checks/CheckResult";
import {addToMultiMap, MultiMap} from "./ModelUtil";

type EffectCheck = {
    effect: Check,
    reason: Reason,
    edge: ProgramModelEdge,
    programEndStep: number,
    stepsSinceTransition: number,
};

/**
 * For edge condition or effect checks that need to listen to the onMoved of a sprite or keys before a step.
 */
export class CheckUtility extends EventEmitter {
    static readonly CHECK_UTILITY_EVENT = "CheckUtilityEvent";
    static readonly CHECK_LOG_FAIL = "CheckLogFail";
    private readonly _testDriver: TestDriver;
    private readonly _modelResult: ModelResult;
    private readonly _onMovedListener: MultiMap<string, string> = new Map();
    private readonly _onVisualListener: MultiMap<string, string> = new Map();
    private readonly _onSayOrThinkListener: MultiMap<string, string> = new Map();
    private readonly _variableListener: MultiMap<string, string> = new Map();

    private _effectChecks: EffectCheck[] = [];

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
        this._onMovedListener.clear();
        this._onVisualListener.clear();
        this._onSayOrThinkListener.clear();
        this._variableListener.clear();
    }

    /**
     * Register a listener on the movement of a sprite with a certain predicate to be fulfilled for the event to be
     * triggered.
     * @param spriteName Name of the sprite.
     * @param graphId Id of the graph which reacts to the event
     */
    registerOnMoveEvent(spriteName: string, graphId: string): void {
        addToMultiMap(this._onMovedListener, spriteName, graphId);
    }

    /**
     * Register a visual change event listener. (Attributes: size, direction, effect, visible, costume,
     * rotationStyle.  Also and x,y motions, but should be registered on move)
     * @param spriteName Name of the actual sprite.
     * @param graphId Id of the graph which reacts to the event
     */
    registerOnVisualChange(spriteName: string, graphId: string): void {
        addToMultiMap(this._onVisualListener, spriteName, graphId);
    }

    /**
     * Register an output event on the visual change checks.
     * @param spriteName Name of the sprite.
     * @param graphId Id of the graph which reacts to the event
     */
    registerOutput(spriteName: string, graphId: string): void {
        addToMultiMap(this._onSayOrThinkListener, spriteName, graphId);
    }

    /**
     * Register a variable change event for a variable.
     * @param varName Name of the variable triggering the event
     * @param graphId Id of the graph which reacts to the event
     */
    registerVarEvent(varName: string, graphId: string): void {
        addToMultiMap(this._variableListener, varName, graphId);
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
     * @param stepsSinceTransition Steps since the last transition of the model
     * @param endStep Steps in which the program ended.
     */
    registerEffectCheck(takenEdge: ProgramModelEdge, stepsSinceTransition: number, endStep: number): void {
        for (const effect of takenEdge.effects) {
            const check: EffectCheck = {
                effect: effect,
                reason: null,
                edge: takenEdge,
                stepsSinceTransition: stepsSinceTransition,
                programEndStep: endStep,
            };
            if (effect.isPure || this._doesEffectFail(check)) {
                this._effectChecks.push(check);
            }
        }
    }

    /**
     * Check the registered effects of this step.
     */
    checkEffects(): Check[] {
        const contradictingEffects: Check[] = [];
        const isContradicting: Record<number, boolean> = {};
        const newEffects: EffectCheck[] = [];

        // check for contradictions in effects and only test an effect if it does not contradict another one
        for (let i = 0; i < this._effectChecks.length; i++) {
            const check = this._effectChecks[i];
            const effect = check.effect;
            for (let j = i + 1; j < this._effectChecks.length; j++) {
                if (effect.contradicts(this._effectChecks[j].effect)) {
                    isContradicting[i] = true;
                    isContradicting[j] = true;
                }
            }

            if (isContradicting[i]) {
                contradictingEffects.push(effect);
            } else if (this._doesEffectFail(check)) {
                newEffects.push(check);
            }
        }

        this._effectChecks = newEffects;
        return contradictingEffects;
    }

    /**
     * Add a failed condition that was not fulfilled in a time limit.
     * @param output The time limit output.
     * @param reason Reason with details on the fail
     */
    addTimeLimitFailOutput(output: string, reason: Reason): void {
        this._addFailOutput(output, reason);
    }

    /**
     * Add an error to the error list of the test.
     * @param edgeLabel Label of the edge that had the error.
     * @param graphID ID of the graph, where the error was thrown.
     * @param e Error that was thrown
     */
    addErrorOutput(edgeLabel: string, graphID: string, e: Error): void {
        this._addErrorOutput(e, edgeLabelAndIdToIdentifier(graphID, edgeLabel));
    }

    removeEffectsOfModels(modelIds: Set<string>): void {
        this._effectChecks = this._effectChecks.filter(c => !modelIds.has(c.edge.graphID));
    }

    /**
     * Make outputs for the failed effects of the last step
     */
    makeFailedOutputs(): void {
        const step = this._testDriver.getTotalStepsExecuted();
        for (const e of this._effectChecks) {
            const output = getEffectFailedOutput(e.edge, e.effect);
            this._addFailOutput(output, e.reason, step);
        }
        this._effectChecks = [];
    }

    public debug(...msg: string[]): void {
        this.emit(CheckUtility.CHECK_LOG_FAIL, `Step ${this._testDriver.getTotalStepsExecuted()}: ${msg.join(" ")}`);
    }

    private _doesEffectFail(check: EffectCheck): boolean {
        try {
            const res = check.effect.check(check.stepsSinceTransition, check.programEndStep);
            if (res.passed === false) {
                if (check.reason === null) {
                    check.reason = res.reason;
                }
                return true;
            }
        } catch (e) {
            this.addErrorOutput(check.edge.label, check.edge.graphID, e);
        }
        return false;
    }

    private _checkForEvent(checks: MultiMap<string, string>, key: string): void {
        const modelIds = checks.get(key);
        if (modelIds && modelIds.size > 0) {
            this.emit(CheckUtility.CHECK_UTILITY_EVENT, modelIds);
        }
    }

    private _filterForFailing(checks: EffectCheck[]): EffectCheck[] {
        return checks.filter(c => this._doesEffectFail(c));
    }

    private _addFailOutput(output: string, reason: Reason, step = -1) {
        this._modelResult.addFail(output);
        if (step === -1) {
            this.debug(output, getReasonAppendix(reason));
        } else {
            this.emit(CheckUtility.CHECK_LOG_FAIL, `Step ${step}: ${output}${getReasonAppendix(reason)}`);
        }
    }

    private _addErrorOutput(e: Error, id: string): void {
        const message = getErrorMessage(e);
        const output = `Error ${id}: ${message}`;
        this.debug(output);
        this._modelResult.addError(output);
    }
}

function edgeLabelAndIdToIdentifier(graphId: string, label: string): string {
    return `${graphId}-${label}`;
}

function edgeToIdentifier(edge: AbstractEdge): string {
    return edgeLabelAndIdToIdentifier(edge.graphID, edge.label);
}

export function getEffectFailedOutput(edge: AbstractEdge, effect: Check): string {
    const conditions = edge.conditions;
    let containsAfterTime: string | null = null;
    let containsElapsed: string | null = null;

    for (const c of conditions) {
        if (c instanceof TimeBetween || c instanceof TimeAfterEnd) {
            containsAfterTime = c.millis.toString();
        } else if (c instanceof TimeElapsed) {
            containsElapsed = c.millis.toString();
        }
    }

    let result = `${edgeToIdentifier(edge)}: ${effect.toString()}`;
    if (containsElapsed != null) {
        result += ` before ${containsElapsed}ms elapsed`;
    }
    if (containsAfterTime != null) {
        result += ` after ${containsAfterTime}ms`;
    }
    return result;
}

