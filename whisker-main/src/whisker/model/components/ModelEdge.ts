import {ModelNode} from "./ModelNode";

// todo construct super type without effect?

/**
 * Edge structure for a model with a condition and an effect. todo
 */
export class ModelEdge {

    readonly id: string;
    private readonly startNode: ModelNode;
    private readonly endNode: ModelNode;

    condition: string[] = [];
    private effect = () => undefined;

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
     * Test whether the condition on this edge is fulfilled.
     */
    testCondition(): boolean {
        for (let i = 0; i < this.condition.length; i++) {
            if (!eval(this.condition[i])) {
                return false;
            }
        }
        return true;
    }

    /**
     * Set the effect of the edge if the condition is later on fulfilled.
     * @param effect Function with no return value. todo ?
     */
    setEffect(effect: { (...param): void }): void {
        this.effect = effect;
    }

    // todo return effect function or only some result of it?
    getEffect(): { (): void } {
        return this.effect;
    }

    getStartNode(): ModelNode {
        return this.startNode;
    }

    getEndNode(): ModelNode {
        return this.endNode;
    }

}

/**
 * Method for checking if an edge condition is fulfilled with a key event. Todo needs duration or not?
 * @param string Name of the key.
 */
export function checkKeyEvent(string) {
    console.log("for now nothing happens with " + string)
}

/**
 * Method for checking if an edge condition is fulfilled with a click event. Todo needs also other params?
 *
 * @param x X coordinate of the mouse click.
 * @param y Y coordinate of the mouse click.
 */
export function checkClickEvent(x, y) {
    console.log("for now nothing happens with the mouse click at " + x + y)

}

/**
 * Method for checking if an edge condition is fulfilled for a value of a variable.
 * Todo needs different comparision =, <,>,<=, >=
 *
 * @param varName Name of the variable.
 * @param varValue Value to compare to the variable's current value.
 */
export function checkVarEvent(varName, varValue) {
    console.log("for now nothing happens with " + varName + " for value " + varValue)

}
