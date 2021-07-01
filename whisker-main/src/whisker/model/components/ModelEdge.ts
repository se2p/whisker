import TestDriver from "../../../test/test-driver";
import {Effect} from "./Effect";
import {Condition} from "./Condition";
import ModelResult from "../../../test-runner/model-result";
import {CheckUtility} from "../util/CheckUtility";
import {getErrorOnEdgeOutput, getTimeLimitFailedAfterOutput, getTimeLimitFailedAtOutput} from "../util/ModelError";
import {InputEffect} from "./InputEffect";
import {ModelTester} from "../ModelTester";

/**
 * Super type for the edges. All edge types have their id, the conditions and start and end node in common (defined
 * here).
 */
export abstract class ModelEdge {
    readonly id: string;
    /* Id of the source node */
    readonly from: string;
    /* Id of the target node*/
    readonly to: string;
    conditions: Condition[] = [];

    readonly forceTestAfter: number;
    readonly forceTestAt: number;
    private forceTestAfterSteps: number;
    private forceTestAtSteps: number;
    private failedForcedTest: boolean;

    protected constructor(id: string, from: string, to: string, forceTestAfter: number, forceTestAt: number) {
        this.id = id;
        this.from = from;
        this.to = to;
        this.forceTestAfter = forceTestAfter;
        if (this.forceTestAfter != -1) {
            this.forceTestAfter = forceTestAfter + ModelTester.TIME_LEEWAY;
        }
        this.forceTestAt = forceTestAt;
        if (this.forceTestAt != -1) {
            this.forceTestAt = forceTestAt + ModelTester.TIME_LEEWAY;
        }
        this.failedForcedTest = false;
    }

    /**
     * Test whether the conditions on this edge are fulfilled.
     * @param t Instance of the test driver
     * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
     * @param stepsSinceEnd Number of steps since the after run model tests started.
     * @param modelResult Saver of the result of the test (fails).
     * @Returns the failed conditions.
     */
    checkConditions(t: TestDriver, stepsSinceLastTransition: number, stepsSinceEnd: number, modelResult: ModelResult): Condition[] {
        if (this.failedForcedTest) {
            return this.conditions;
        }

        let failedConditions = [];

        // times up... force testing of conditions and if they are not fulfilled make add as failed
        if ((this.forceTestAtSteps && this.forceTestAtSteps < t.getTotalStepsExecuted())
            || (this.forceTestAfterSteps && this.forceTestAfterSteps < stepsSinceLastTransition)) {

            for (let i = 0; i < this.conditions.length; i++) {
                try {
                    if (!this.conditions[i].check(stepsSinceLastTransition, stepsSinceEnd)) {
                        this.failedForcedTest = true;
                        failedConditions.push(this.conditions[i]);
                        modelResult.addFail(this.getTimeLimitFailedOutput(this.conditions[i], t));
                    }
                } catch (e) {
                    let error = e.message;
                    failedConditions.push(this.conditions[i]);
                    error = getErrorOnEdgeOutput(this, e.message);
                    console.error(error, t.getTotalStepsExecuted());
                    modelResult.addError(error);
                }
            }
            return failedConditions;
        }

        // time limit not reached
        for (let i = 0; i < this.conditions.length; i++) {
            try {
                if (!this.conditions[i].check(stepsSinceLastTransition, stepsSinceEnd)) {
                    failedConditions.push(this.conditions[i]);
                }
            } catch (e) {
                let error = e.message;
                failedConditions.push(this.conditions[i]);
                error = getErrorOnEdgeOutput(this, e.message);
                console.error(error, t.getTotalStepsExecuted());
                modelResult.addError(error);
            }
        }

        return failedConditions;
    }

    getTimeLimitFailedOutput(condition: Condition, t: TestDriver) {
        if (this.forceTestAtSteps && this.forceTestAtSteps < t.getTotalStepsExecuted()) {
            return getTimeLimitFailedAtOutput(this, condition, this.forceTestAt)
        } else {
            return getTimeLimitFailedAfterOutput(this, condition, this.forceTestAfter);
        }
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
    registerComponents(checkListener: CheckUtility, t: TestDriver, result: ModelResult, caseSensitive: boolean): void {
        if (this.forceTestAt != -1) {
            this.forceTestAtSteps = t.vmWrapper.convertFromTimeToSteps(this.forceTestAt);
        }
        if (this.forceTestAfter != -1) {
            this.forceTestAfterSteps = t.vmWrapper.convertFromTimeToSteps(this.forceTestAfter);
        }
        this.conditions.forEach(cond => {
            cond.registerComponents(checkListener, t, result, caseSensitive);
        })
    }

    reset(): void {
        this.failedForcedTest = false;
        this.forceTestAtSteps = undefined;
        this.forceTestAfterSteps = undefined;
    }
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
     * @param forceTestAfter Force testing this condition after given amount of milliseconds.
     * @param forceTestAt Force testing this condition after the test run a given amount of milliseconds.
     */
    constructor(id: string, from: string, to: string, forceTestAfter: number, forceTestAt: number) {
        super(id, from, to, forceTestAfter, forceTestAt);
    }

    reset(): void {
        super.reset();
        this.failedEffects = [];
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
     * @param forceTestAfter Force testing this condition after given amount of milliseconds.
     * @param forceTestAt Force testing this condition after the test run a given amount of milliseconds.
     */
    constructor(id: string, from: string, to: string, forceTestAfter: number, forceTestAt: number) {
        super(id, from, to, forceTestAfter, forceTestAt);
    }

    /**
     * Add an effect to the edge.
     * @param effect Effect function as a string.
     */
    addInputEffect(effect: InputEffect): void {
        this.inputEffects.push(effect);
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
