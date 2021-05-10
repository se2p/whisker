import {ModelNode} from "./ModelNode";
import TestDriver from "../../../test/test-driver";
import {Effect} from "./Effect";
import {Condition} from "./Condition";
import {ModelResult} from "../../../test-runner/test-result";
import {ProgramModel} from "./ProgramModel";
import {CheckListener} from "../util/CheckListener";

/**
 * Edge structure for a model with effects that can be triggered based on its conditions.
 */
export class ModelEdge {

    readonly id: string;
    private readonly startNode: ModelNode;
    private readonly endNode: ModelNode;

    conditions: Condition[] = [];
    effects: Effect[] = [];

    numberOfEffectFailures: number = 0;
    failedEffects: Effect[] = [];
    private lastStepCondChecked = -1;

    /**
     * Create a new edge.
     * @param id ID of the edge.
     * @param startNode Start node of the edge
     * @param endNode End node of the edge
     */
    constructor(id: string, startNode: ModelNode, endNode: ModelNode) {
        this.id = id;
        this.startNode = startNode;
        this.endNode = endNode;
    }

    /**
     * Test whether the conditions on this edge are fulfilled.
     * @Returns the failed conditions.
     */
    getFailedConditions(testDriver: TestDriver, modelResult: ModelResult): Condition[] {
        if (this.lastStepCondChecked == testDriver.getTotalStepsExecuted()) {
            return this.conditions; // dont check in the same step twice
        }

        this.lastStepCondChecked = testDriver.getTotalStepsExecuted();
        let failedConditions = [];

        for (let i = 0; i < this.conditions.length; i++) {
            try {
                if (!this.conditions[i].check(testDriver)) {
                    failedConditions.push(this.conditions[i]);
                }
            } catch (e) {
                e.message = "Edge '" + this.id + "': " + e.message;
                console.error(e);
                failedConditions.push(this.conditions[i]);
                modelResult.error.push(e);
            }
        }

        return failedConditions;
    }

    /**
     * Run all effects of the edge.
     */
    checkEffects(testDriver, modelResult: ModelResult, model: ProgramModel): boolean {
        if (this.failedEffects.length != 0) {
            return this.checkFailedEffects(testDriver, model);
        }

        for (let i = 0; i < this.effects.length; i++) {
            try {
                if (!this.effects[i].check(testDriver, model)) {
                    this.failedEffects.push(this.effects[i]);
                }
            } catch (e) {
                e.message = "Edge '" + this.id + "': " + e.message;
                console.error(e);
                this.failedEffects.push(this.effects[i]);
                modelResult.error.push(e);
            }
        }

        if (this.failedEffects.length > 0) {
            this.numberOfEffectFailures = 1;
        }

        return this.failedEffects.length == 0;
    }

    /**
     * Recheck failed effects.
     */
    private checkFailedEffects(testDriver: TestDriver, model: ProgramModel): boolean {
        if (this.numberOfEffectFailures === 0) {
            console.error("There are no failed effects to check...");
            return false;
        }

        let newFailures = [];
        for (let i = 0; i < this.failedEffects.length; i++) {
            try {
                if (!this.failedEffects[i].check(testDriver, model)) {
                    newFailures.push(this.failedEffects[i]);
                }
            } catch (e) {
                newFailures.push(this.failedEffects[i]);
            }
        }

        // no new failures
        if (newFailures.length === 0) {
            this.failedEffects = [];
            this.numberOfEffectFailures = 0;
            return true;
        } else {
            this.numberOfEffectFailures++;
            this.failedEffects = newFailures;
            return false;
        }
    }

    reset(): void {
        this.numberOfEffectFailures = 0;
        this.failedEffects = [];
        this.lastStepCondChecked = -1;
    }

    /**
     * Get the start node of the edge.
     */
    getStartNode(): ModelNode {
        return this.startNode;
    }

    /**
     * Get the end node of the edge
     */
    getEndNode(): ModelNode {
        return this.endNode;
    }

    /**
     * Add a condition to the edge. Conditions in the evaluation all need to be fulfilled for the effect to be valid.
     * @param condition Condition function as a string.
     */
    addCondition(condition: Condition): void {
        this.conditions.push(condition);
    }

    /**
     * Add an effect to the edge.
     * @param effect Effect function as a string.
     */
    addEffect(effect: Effect): void {
        this.effects.push(effect);
    }

    /**
     * Check existences of sprites, existences of variables and ranges of arguments.
     * @param testDriver Instance of the test driver.
     */
    testEdgeForErrors(testDriver: TestDriver): void {
        try {
            this.conditions.forEach(cond => {
                cond.testConditionsForErrors(testDriver);
            })
            this.effects.forEach(effect => {
                effect.testEffectsForErrors(testDriver);
            })
        } catch (e) {
            throw new Error("Edge '" + this.id + "':\n" + e.message);
        }
    }

    /**
     * Register the condition state.
     */
    registerCheckListener(checkListener: CheckListener): void {
        this.conditions.forEach(cond => {
            cond.registerCheckListener(checkListener);
        })
    }
}
