import {ModelNode} from "./components/ModelNode";
import {ModelEdge} from "./components/ModelEdge";

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

    private id: string;
    private modelType: ModelType;

    private startNode: ModelNode;
    private currentState: ModelNode;

    private stopNodes: { [key: string]: ModelNode };
    private nodes: { [key: string]: ModelNode };
    private edges: { [key: string]: ModelEdge };

    /**
     * todo
     * @param id
     * @param modelType
     * @param startNode
     * @param stopNodes
     * @param nodes
     * @param edges
     */
    constructor(id: string, modelType: ModelType, startNode: ModelNode, stopNodes: { [key: string]: ModelNode },
                nodes: { [key: string]: ModelNode }, edges: { [key: string]: ModelEdge }) {
        this.id = id;
        this.modelType = modelType;
        this.currentState = startNode;
        this.startNode = startNode;
        this.stopNodes = stopNodes;
        this.nodes = nodes;
        this.edges = edges;
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

export enum ModelType {
    programModel,
    userModel
}
