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

    readonly id: string;
    modelType: ModelType;

    private readonly startNode: ModelNode;
    private currentState: ModelNode;

    private readonly stopNodes: { [key: string]: ModelNode };
    private readonly nodes: { [key: string]: ModelNode };
    private readonly edges: { [key: string]: ModelEdge };

    /**
     * Construct a model (graph) with a string identifier and model type (program or user model). Sets up the start
     * node and stopping nodes for simulating transitions on the graph.
     *
     * @param id ID of the model.
     * @param modelType Enum type of the model.
     * @param startNode Start node for traversing the graph.
     * @param stopNodes Nodes stopping the graph walkthrough.
     * @param nodes Dictionary mapping the node ids to the actual nodes in the graph.
     * @param edges Dictionary mapping the edge ids to the actual edges in the graph.
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

    /**
     * Simulate one transition on the graph. todo Add as callback function
     */
    makeOneTransition() {

        // ask the current node for a valid transition
        const edge = this.currentState.testEdgeConditions();
        if (edge != null) {
            const fun = edge.getEffect();
            fun();
        }


    }

    /**
     * Reset the graph to the start state.
     */
    reset(): void {
        this.currentState = this.startNode;
    }

    // todo callback function (?) that compares the state of the model and program
}

export enum ModelType {
    programModel,
    userModel
}
