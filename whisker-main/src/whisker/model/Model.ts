import {ModelNode} from "./components/ModelNode";

/**
 * Graph structure for a program model representing the program behaviour of a Scratch program.
 *
 *
 * (later also an user model representing the user behaviour when using the Scratch program ??)
 *
 * ############# Assumptions ##################
 * - Only one start node, unique
 * - Each edge has a condition (input event, condition for a variable,....)
 */
export class Model {

    public startNode: ModelNode;
    public currentState: ModelNode;

    constructor(startNode: ModelNode) {
        this.currentState = startNode;
        this.startNode = startNode;
    }


    step(condition) { // todo param is a ioEvent of scratch

        // ask the currentNode for a transition for the input event and get effect of the edge if its condition is
        // fulfilled
        const edge = this.currentState.getEdgeForInputEvent(condition);
        if (edge != null) {
            const fun = edge.getEffect();
            fun();
        }

        // todo give out the result?
    }

    /**
     * Reset the graph to the start state.
     */
    reset(): void {
        this.currentState = this.startNode;
    }
}
