import {ModelNode} from "./ModelNode";
import TestDriver from "../../../test/test-driver";
import {Effect} from "../util/EdgeEvent";
import {Condition} from "./Condition";
import {ConditionState} from "../util/ConditionState";

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

    /**
     * Check existences of sprites, existences of variables and ranges of arguments.
     * @param testDriver Instance of the test driver.
     * @param conditionState State saver of the conditions.
     */
    registerAndTestConditions(testDriver: TestDriver, conditionState: ConditionState) {
        this.conditions.forEach(cond => {
            cond.registerAndTestConditions(testDriver, conditionState);
        })
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
 * @param spriteName Name of the sprite having the variable.
 * @param varName Name of the variable
 * @param mode
 */
export function varChangeEffect(spriteName: string, varName: string, mode: string) {
    console.log("Effect: " + varName + mode);
}

/**
 * Change an attribute of a sprite.
 * @param spriteName Name of the sprite
 * @param varName Name of the variable
 * @param varValue New value of the variable // todo only mode to compare? >,<,=
 */
export function spriteChangeEffect(spriteName: string, varName: string, varValue: string) {
    // console.log("Effect: " + spriteName + "." + varName  + varValue);
}
