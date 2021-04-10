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
    async testCondition(vmWrapper): Promise<boolean> {
        let fulfilled = true;

        for (let i = 0; i < this.conditions.length; i++) {

            // get the check function for the condition by eval and give it the vm wrapper
            eval(this.conditions[i]).then(function (checkEvent) {
                fulfilled = checkEvent(vmWrapper);
            });

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
export async function checkKeyEvent(scratchKey): Promise<(VMWrapper) => boolean> {
    return function (vmWrapper: VMWrapper): boolean {
        if (vmWrapper.inputs.inputs.length > 0) {
            const inputs = vmWrapper.inputs.inputs;

            // try to find the input equal to the string
            for (let i = 0; i < inputs.length; i++) {
                console.log("current input: '" + inputs[i]._data.key + " '");
                if (inputs[i]._data.key === Input.scratchKeyToKeyString(scratchKey)) {
                    return true;
                }
            }
            return false;
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
export async function checkClickEvent(x, y): Promise<(VMWrapper) => boolean> {
    return function (vmWrapper: VMWrapper): boolean {
        console.log("for now nothing happens with the mouse click at " + x + y, vmWrapper);
        return false;
    }

}

/**
 * Method for checking if an edge condition is fulfilled for a value of a variable.
 * Todo needs different comparision =, <,>,<=, >=
 *
 * @param varName Name of the variable.
 * @param varValue Value to compare to the variable's current value.
 */
export async function checkVarEvent(varName, varValue): Promise<(VMWrapper) => boolean> {
    return function (vmWrapper: VMWrapper): boolean {
        console.log("for now nothing happens with " + varName + " for value " + varValue, vmWrapper);
        return false;
    }
}

/**
 * Print out the output given.
 * @param output Output to print.
 */
export async function outputEffect(output) {
    console.log(output);
}

/**
 * Print out the value of the given variable of scratch. todo implement
 * @param varName Name of the variable.
 */
export async function outputVarEffect(varName: string) {
    console.log(varName);
}
