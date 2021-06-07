import {ModelNode} from "./ModelNode";
import {ModelEdge, UserModelEdge} from "./ModelEdge";
import TestDriver from "../../../test/test-driver";
import ModelResult from "../../../test-runner/model-result";
import {CheckUtility} from "../util/CheckUtility";

/**
 *  Graph structure for a user model representing the user's behaviour when playing a Scratch program.
 *
 * ############# Assumptions ##################
 * - Only one start node, unique
 * - Does not need a stop node. A stop node stops all other user models too. Stopping only one with a normal node
 *    without outgoing edges
 * - Each edge has a condition (input event, condition for a variable,....) -> or at least an always true condition
 * - Input effects are immediate inputs in the step the condition holds.
 * - Conditions should exclude each other so only one edge can be taken at one step. The first matching one is
 * taken. So that it not gets ambiguous.
 */
export class UserModel {

    readonly id: string;
    protected readonly startNode: ModelNode;
    protected currentState: ModelNode;

    protected readonly stopNodes: { [key: string]: ModelNode };
    protected readonly nodes: { [key: string]: ModelNode };
    protected readonly edges: { [key: string]: UserModelEdge };

    constructor(id: string, startNode: ModelNode, stopNodes: { [key: string]: ModelNode },
                nodes: { [key: string]: ModelNode }, edges: { [key: string]: UserModelEdge }) {
        this.id = id;
        this.currentState = startNode;
        this.startNode = startNode;
        this.stopNodes = stopNodes;
        this.nodes = nodes;
        this.edges = edges;
        for (let edgesMapKey in edges) {
            edges[edgesMapKey].registerModel(this);
        }
    }

    /**
     * Simulate transitions on the graph. Edges are tested only once if they are reached.
     */
    makeOneTransition(testDriver: TestDriver, modelResult: ModelResult): ModelEdge {
        let edge = this.currentState.testEdgeConditions(testDriver, modelResult);

        if (edge != null) {
            this.currentState = edge.getEndNode();
        }
        return edge;
    }

    /**
     * Whether the model is in a stop state.
     */
    stopped() {
        return this.currentState.isStopNode;
    }

    /**
     * Reset the graph to the start state.
     */
    reset(): void {
        this.currentState = this.startNode;
        Object.values(this.nodes).forEach(node => {
            node.reset()
        });
    }

    /**
     * Register the check listener and test driver on all node's edges.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, result: ModelResult) {
        Object.values(this.nodes).forEach(node => {
            node.registerComponents(checkListener, testDriver, result);
        })
    }
}
