import {ModelNode} from "./ModelNode";
import TestDriver from "../../../test/test-driver";
import {Effect} from "./Effect";
import {Condition} from "./Condition";
import {ModelResult} from "../../../test-runner/test-result";
import {ProgramModel} from "./ProgramModel";
import {CheckUtility} from "../util/CheckUtility";

/**
 * Edge structure for a model with effects that can be triggered based on its conditions.
 */
export class ModelEdge {

    readonly id: string;
    private readonly startNode: ModelNode;
    private readonly endNode: ModelNode;
    private programModel: ProgramModel;

    conditions: Condition[] = [];
    effects: Effect[] = [];

    failedEffects: Effect[] = [];

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
     * Register a model that this edge belongs to.
     * @param programModel The model..
     */
    registerProgramModel(programModel: ProgramModel) {
        this.programModel = programModel;
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
                e.message = "Edge '" + this.id + "': " + e.message;
                console.error(e);
                failedConditions.push(this.conditions[i]);
                modelResult.error.push(e);
            }
        }

        return failedConditions;
    }

    reset(): void {
        this.failedEffects = [];
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
     * Register the check listener and test driver.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, result: ModelResult): void {
        this.conditions.forEach(cond => {
            cond.registerComponents(checkListener, testDriver, result);
        })
        this.effects.forEach(effect => {
            effect.registerComponents(testDriver, result);
        })
    }

    getModel() {
        return this.programModel;
    }
}
