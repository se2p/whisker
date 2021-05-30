import {ModelNode} from "./ModelNode";
import {ModelEdge, UserModelEdge} from "./ModelEdge";
import TestDriver from "../../../test/test-driver";
import {ModelResult} from "../../../test-runner/test-result";
import {CheckUtility} from "../util/CheckUtility";

/**
 * todo
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
     * The models stops when a stop node is reached.
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
     * Register the check listener and test driver.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, result: ModelResult) {
        Object.values(this.nodes).forEach(node => {
            node.registerComponents(checkListener, testDriver, result);
        })
    }
}
