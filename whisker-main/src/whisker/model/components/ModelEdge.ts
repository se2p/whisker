import {ModelNode} from "./ModelNode";

// todo construct super type without effect?

/**
 * Edge structure for a model with a condition and an effect. todo
 */
export class ModelEdge {

    private readonly id: string;
    private readonly startNode: ModelNode;
    private readonly endNode: ModelNode;

    condition: string; //todo string, eval austesten, hilfsfunctionen
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
        return eval(this.condition);
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
