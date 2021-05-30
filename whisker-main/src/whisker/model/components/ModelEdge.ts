import {ModelNode} from "./ModelNode";
import TestDriver from "../../../test/test-driver";
import {Effect} from "./Effect";
import {Condition} from "./Condition";
import {ModelResult} from "../../../test-runner/test-result";
import {ProgramModel} from "./ProgramModel";
import {CheckUtility} from "../util/CheckUtility";
import {getErrorOnEdgeOutput} from "../util/ModelError";
import {UserModel} from "./UserModel";
import {InputEffect} from "./InputEffect";

export class ModelEdge {
    readonly id: string;
    protected readonly startNode: ModelNode;
    conditions: Condition[] = [];
    protected readonly endNode: ModelNode;
    protected model: ProgramModel | UserModel;

    constructor(id, startNode, endNode) {
        this.id = id;
        this.startNode = startNode;
        this.endNode = endNode;
    }
    /**
     * Test whether the conditions on this edge are fulfilled.
     * @Returns the failed conditions.
     */
    checkConditions(testDriver: TestDriver, modelResult: ModelResult): Condition[] {
        let failedConditions = [];

        for (let i = 0; i < this.conditions.length; i++) {
            try {
                if (!this.conditions[i].check()) {
                    failedConditions.push(this.conditions[i]);
                }
            } catch (e) {
                let error = getErrorOnEdgeOutput(this.getModel(), this, e.message);
                console.error(error);
                failedConditions.push(this.conditions[i]);
                modelResult.addError(error);
            }
        }

        return failedConditions;
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
     * Register the check listener and test driver.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, result: ModelResult): void {
        this.conditions.forEach(cond => {
            cond.registerComponents(checkListener, testDriver, result);
        })
    }

    reset() {
        // in subtypes overwritten?
    }

    /**
     * Register a model that this edge belongs to.
     * @param model The model..
     */
    registerModel(model: ProgramModel | UserModel) {
        this.model = model;
    }

    getModel() {
        return this.model;
    }
}

/**
 * Edge structure for a model with effects that can be triggered based on its conditions.
 */
export class ProgramModelEdge extends ModelEdge{
    effects: Effect[] = [];
    failedEffects: Effect[] = [];

    /**
     * Create a new edge.
     * @param id ID of the edge.
     * @param startNode Start node of the edge
     * @param endNode End node of the edge
     */
    constructor(id: string, startNode: ModelNode, endNode: ModelNode) {
        super(id, startNode, endNode);
    }

    reset(): void {
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
     * Register the check listener and test driver.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, result: ModelResult): void {
        super.registerComponents(checkListener, testDriver, result);
        this.effects.forEach(effect => {
            effect.registerComponents(testDriver, result);
        })
    }
}

export class UserModelEdge extends ModelEdge {
    inputEffects: InputEffect[] = [];

    /**
     * Create a new edge.
     * @param id ID of the edge.
     * @param startNode Start node of the edge
     * @param endNode End node of the edge
     */
    constructor(id: string, startNode: ModelNode, endNode: ModelNode) {
        super(id, startNode, endNode);
    }

    /**
     * Add an effect to the edge.
     * @param effect Effect function as a string.
     */
    addInputEffect(effect: InputEffect): void {
        this.inputEffects.push(effect);
    }

    /**
     * todo
     */
    inputImmediate(t: TestDriver) {
        this.inputEffects.forEach(inputEffect => {
            inputEffect.inputImmediate(t);
        })
    }
}
