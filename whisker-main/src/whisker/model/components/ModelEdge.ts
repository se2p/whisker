import TestDriver from "../../../test/test-driver";
import {Effect} from "./Effect";
import {Condition} from "./Condition";
import ModelResult from "../../../test-runner/model-result";
import {CheckUtility} from "../util/CheckUtility";
import {getErrorOnEdgeOutput, getTimeLimitFailedOutput, TIME_LIMIT_ERROR} from "../util/ModelError";
import {InputEffect} from "./InputEffect";

/**
 * Super type for the edges. All edge types have their id, the conditions and start and end node in common (defined
 * here).
 */
export abstract class ModelEdge {
    readonly id: string;
    readonly from: string;
    readonly to: string;
    conditions: Condition[] = [];

    protected constructor(id: string, from: string, to: string) {
        this.id = id;
        this.from = from;
        this.to = to;
    }

    /**
     * Test whether the conditions on this edge are fulfilled.
     * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
     * @param stepsSinceEnd Number of steps since the after run model tests started.
     * @Returns the failed conditions.
     */
    checkConditions(t: TestDriver, stepsSinceLastTransition: number, stepsSinceEnd: number, modelResult: ModelResult): Condition[] {
        let failedConditions = [];

        for (let i = 0; i < this.conditions.length; i++) {
            try {
                if (!this.conditions[i].check(t.getTotalStepsExecuted(), stepsSinceLastTransition, stepsSinceEnd)) {
                    failedConditions.push(this.conditions[i]);
                }
            } catch (e) {
                let error = e.message;
                failedConditions.push(this.conditions[i]);
                if (e.message.startsWith(TIME_LIMIT_ERROR)) {
                    modelResult.addFail(getTimeLimitFailedOutput(this, this.conditions[i]));
                } else {
                    error = getErrorOnEdgeOutput(this, e.message);
                    console.error(error, t.getTotalStepsExecuted());
                    modelResult.addError(error);
                }
            }
        }

        return failedConditions;
    }


    /**
     * Returns the id of the target node of this edge.
     */
    getEndNodeId() {
        return this.to;
    }
    /**
     * Add a condition to the edge. Conditions in the evaluation all need to be fulfilled for the effect to be valid.
     * @param condition Condition function as a string.
     */
    addCondition(condition: Condition): void {
        this.conditions.push(condition);
    }

    /**
     * Register the check listener and test driver on the edge's conditions.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, result: ModelResult, caseSensitive: boolean): void {
        this.conditions.forEach(cond => {
            cond.registerComponents(checkListener, testDriver, result, caseSensitive);
        })
    }

    /**
     * Reset subtype specific states.
     */
    abstract reset(): void;
}

/**
 * Edge structure for a program model with effects that can be triggered based on its conditions.
 */
export class ProgramModelEdge extends ModelEdge {
    effects: Effect[] = [];
    failedEffects: Effect[] = [];

    /**
     * Create a new edge.
     * @param id ID of the edge.
     * @param from Index of the source node.
     * @param to Index of the target node.
     */
    constructor(id: string, from: string, to: string) {
        super(id, from, to);
    }

    reset(): void {
        this.failedEffects = [];
        this.conditions.forEach(cond => {
            cond.reset();
        })
    }

    /**
     * Add an effect to the edge.
     * @param effect Effect function as a string.
     */
    addEffect(effect: Effect): void {
        this.effects.push(effect);
    }

    /**
     * Register the check listener and test driver on the conditions and effects.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, result: ModelResult, caseSensitive: boolean): void {
        super.registerComponents(checkListener, testDriver, result, caseSensitive);
        this.effects.forEach(effect => {
            effect.registerComponents(testDriver, result, caseSensitive);
        })
    }
}

/**
 * Edge structure that has input effects triggered if the conditions are fulfilled.
 */
export class UserModelEdge extends ModelEdge {
    inputEffects: InputEffect[] = [];

    /**
     * Create a new edge.
     * @param id ID of the edge.
     * @param from Index of the source node.
     * @param to Index of the target node.
     */
    constructor(id: string, from: string, to: string) {
        super(id, from, to);
    }

    /**
     * Add an effect to the edge.
     * @param effect Effect function as a string.
     */
    addInputEffect(effect: InputEffect): void {
        this.inputEffects.push(effect);
    }

    reset() {
        this.conditions.forEach(cond => {
            cond.reset();
        })
    }

    /**
     * Start the input effects of this edge.
     */
    inputImmediate(t: TestDriver) {
        this.inputEffects.forEach(inputEffect => {
            inputEffect.inputImmediate(t);
        })
    }

    /**
     *  Register the check listener and test driver on the conditions and input effects.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, result: ModelResult, caseSensitive: boolean): void {
        super.registerComponents(checkListener, testDriver, result, caseSensitive);
        this.inputEffects.forEach(effect => {
            effect.registerComponents(testDriver, caseSensitive);
        })
    }
}
