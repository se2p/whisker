import {ModelNode} from "./ModelNode";
import TestDriver from "../../../test/test-driver";
import {Effect} from "./Effect";
import {Condition} from "./Condition";
import ModelResult from "../../../test-runner/model-result";
import {ProgramModel} from "./ProgramModel";
import {CheckUtility} from "../util/CheckUtility";
import {getErrorOnEdgeOutput, TIME_LIMIT_ERROR} from "../util/ModelError";
import {UserModel} from "./UserModel";
import {InputEffect} from "./InputEffect";

/**
 * Super type for the edges. All edge types have their id, the conditions and start and end node in common (defined
 * here).
 */
export abstract class ModelEdge {
    readonly id: string;
    protected readonly startNode: ModelNode;
    conditions: Condition[] = [];
    protected readonly endNode: ModelNode;

    protected constructor(id: string, startNode: ModelNode, endNode: ModelNode) {
        this.id = id;
        this.startNode = startNode;
        this.endNode = endNode;
    }

    /**
     * Test whether the conditions on this edge are fulfilled.
     * @Returns the failed conditions.
     */
    checkConditions(t: TestDriver, modelResult: ModelResult): Condition[] {
        let failedConditions = [];

        for (let i = 0; i < this.conditions.length; i++) {
            try {
                if (!this.conditions[i].check(t)) {
                    failedConditions.push(this.conditions[i]);
                }
            } catch (e) {
                let error = e.message;
                failedConditions.push(this.conditions[i]);
                if (e.message.startsWith(TIME_LIMIT_ERROR)) {
                    modelResult.addFail(error);
                } else {
                    error = getErrorOnEdgeOutput(this.getModel(), this, e.message);
                    console.error(error, t.getTotalStepsExecuted());
                    modelResult.addError(error);
                }
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

    /**
     * Register a model that this edge belongs to.
     * @param model The model..
     */
    abstract registerModel(model);

    /**
     * Get the model of this edge.
     */
    abstract getModel();
}

/**
 * Edge structure for a program model with effects that can be triggered based on its conditions.
 */
export class ProgramModelEdge extends ModelEdge {
    effects: Effect[] = [];
    failedEffects: Effect[] = [];
    private model: ProgramModel;

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

    /**
     * Register a program model that this edge belongs to.
     */
    registerModel(model: ProgramModel) {
        this.model = model;
    }

    /**
     * Get the program model this edge belongs to.
     */
    getModel(): ProgramModel {
        return this.model;
    }
}

/**
 * Edge structure that has input effects triggered if the conditions are fulfilled.
 */
export class UserModelEdge extends ModelEdge {
    inputEffects: InputEffect[] = [];
    private model: UserModel;

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

    /**
     * Register a user model that this edge belongs to.
     */
    registerModel(model: UserModel) {
        this.model = model;
    }

    /**
     * Get the user model this edge belongs to.
     */
    getModel(): UserModel {
        return this.model;
    }
}
