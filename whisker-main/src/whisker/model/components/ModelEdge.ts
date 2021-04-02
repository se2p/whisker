import {ModelNode} from "./ModelNode";

// todo construct super type without effect?

/**
 * Edge structure for a model with a condition and an effect. todo
 */
export class ModelEdge {

    private id: string;
    private startNode: ModelNode; // redundant?
    private endNode: ModelNode;

    private condition = () => true;
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
     * Set the condition for the edge effect to occur.
     * @param condition Function returning a boolean.
     */
    setCondition(condition: { (...param): boolean }): void {
        this.condition = condition;
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

}
