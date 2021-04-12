import {ModelNode} from "./ModelNode";
import {Input} from "../../../vm/inputs";
import VMWrapper from "../../../vm/vm-wrapper";

// todo construct super type without effect?

/**
 * Edge structure for a model with effects that can be triggered based on its conditions.
 */
export class ModelEdge {

    readonly id: string;
    private readonly startNode: ModelNode;
    private readonly endNode: ModelNode;

    private conditions: string[] = [];
    private effects: string[] = [];

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
     * @param vmWrapper Instance of the vm wrapper.
     * @return Promise<boolean>, if the conditions are fulfilled.
     */
    testCondition(vmWrapper): boolean {
        let fulfilled = true;

        for (let i = 0; i < this.conditions.length; i++) {
            fulfilled = eval(this.conditions[i])(vmWrapper);

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
            eval(this.effects[i]);
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
    addCondition(condition: string): void {
        this.conditions.push(condition);
    }

    /**
     * Add an effect to the edge.
     * @param effect Effect function as a string.
     */
    addEffect(effect: string): void {
        this.effects.push(effect);
    }

}

/**
 * Method for checking if an edge condition is fulfilled with a key event. Todo needs duration or not?
 * @param scratchKey Name of the key.
 */
export function checkKeyEvent(scratchKey: string): (VMWrapper) => boolean {
    return function (vmWrapper: VMWrapper): boolean {
        if (vmWrapper.inputs.inputs.length > 0) {
            const inputs = vmWrapper.inputs.inputs;

            // try to find the input equal to the string
            for (let i = 0; i < inputs.length; i++) {
                console.log("current input: '" + inputs[i]._data.key + "'");
                if (inputs[i]._data.key === Input.scratchKeyToKeyString(scratchKey)) {
                    return true;
                }
            }
            return false;
        } else {
            console.log("inputs empty")
        }
        return false;
    }
}

/**
 * Method for checking if an edge condition is fulfilled with a click event. Todo needs also other params?
 *
 * @param x X coordinate of the mouse click.
 * @param y Y coordinate of the mouse click.
 */
export function checkClickEvent(x, y): (VMWrapper) => boolean {
    return function (vmWrapper: VMWrapper): boolean {
        console.log("for now nothing happens with the mouse click at " + x + y, vmWrapper);
        return false;
    }

}

/**
 * Method for checking if an edge condition is fulfilled for a value of a variable.
 *
 * @param varName Name of the variable.
 * @param comparison Modus of comparision, e.g. =, <, >, <=, >=
 * @param varValue Value to compare to the variable's current value.
 */
export function checkVarTestEvent(varName: string, comparison: string, varValue: string): (VMWrapper) => boolean {
    return function (vmWrapper: VMWrapper): boolean {
        console.log("for now nothing happens with " + varName + comparison + varValue, vmWrapper);
        return false;
    }
}

/**
 * Check whether the sprites with the given names are touching.
 *
 * @param spriteName1 Name of the first sprite.
 * @param spriteName2 Name of the second sprite.
 */
export function checkSpriteTouchingEvent(spriteName1: string, spriteName2: string): (VMWrapper) => boolean {
    return function (vmWrapper: VMWrapper): boolean {
        console.log("for now nothing happens with sprites: " + spriteName1 + " and " + spriteName2, vmWrapper);
        return false;
    }
}

export function checkSpriteColorEvent(spriteName: string, colorName: string) : (VMWrapper) => boolean {
    return function (vmWrapper: VMWrapper): boolean {
        console.log("for now nothing happens with sprite " + spriteName + " and color " + colorName, vmWrapper);
        return false;
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
