import {ModelNode} from "./ModelNode";
import TestDriver from "../../../test/test-driver";
import {Effect} from "../util/EdgeEvent";
import {Condition} from "../edgeConditions/Condition";

// todo construct super type without effect?

/**
 * Edge structure for a model with effects that can be triggered based on its conditions.
 */
export class ModelEdge {

    readonly id: string;
    private readonly startNode: ModelNode;
    private readonly endNode: ModelNode;

    conditions: Condition[] = [];
    private effects: Effect[] = [];

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
     * @param testDriver Instance of the test driver.
     * @return Promise<boolean>, if the conditions are fulfilled.
     */
    testConditions(testDriver: TestDriver): boolean {
        let fulfilled = true;

        for (let i = 0; i < this.conditions.length; i++) {
            fulfilled = this.conditions[i].check(testDriver);

            // stop if one condition is not fulfilled
            if (!fulfilled) {
                break;
            }
        }
        return fulfilled;
    }

    /**
     * todo
     * @param testDriver
     */
    registerConditions(testDriver: TestDriver): void {
        this.conditions.forEach(cond => {
            cond.register(testDriver);
        })
    }

    /**
     * todo
     */
    resetConditions() {
        this.conditions.forEach(cond => {
            cond.reset();
        })
    }
    /**
     * Run all effects of the edge.
     */
    runEffect(): void {
        for (let i = 0; i < this.effects.length; i++) {
            eval(this.effects[i].effectFunc);
        }
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
}

/**
 * Print out the output given.
 * @param output Output to print.
 */
export function outputEffect(output: string) {
    console.log("Effect: " + output);
}

/**
 * Print out the value of the given variable of scratch. todo implement
 * @param varName Name of the variable.
 */
export function varOutputEffect(varName: string) {
    console.log("Effect: " + varName);
}

/**
 * Change the value of a integer variable. todo ?
 * @param varName Name of the variable
 * @param mode
 */
export function varChangeEffect(varName: string, mode: string) {
    console.log("Effect: " + varName + mode);
}
