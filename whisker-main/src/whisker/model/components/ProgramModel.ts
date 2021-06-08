import {ModelNode} from "./ModelNode";
import {ModelEdge, ProgramModelEdge} from "./ModelEdge";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import ModelResult from "../../../test-runner/model-result";


/**
 * Graph structure for a program model representing the program behaviour of a Scratch program.
 *
 * ############# Assumptions ##################
 * - Only one start node, unique
 * - Not every program model needs to have a stop node. (but one of the program models has one)
 * - Each edge has a condition (input event, condition for a variable,....) -> or at least an always true condition
 * - Effects can also occur at a later VM step, therefore its tested 2 successive steps long for occurrence.
 * - Conditions should exclude each other so only one edge can be taken at one step. The first matching one is
 * taken. So that it not gets ambiguous.
 */
export class ProgramModel {

    readonly id: string;
    protected readonly startNode: ModelNode;
    protected currentState: ModelNode;

    protected readonly stopNodes: { [key: string]: ModelNode }; // delete?
    protected readonly nodes: { [key: string]: ModelNode };
    protected readonly edges: { [key: string]: ProgramModelEdge };

    protected coverageCurrentRun: { [key: string]: boolean } = {};
    protected coverageTotal: { [key: string]: boolean } = {};

    /**
     * Construct a program model (graph) with a string identifier. Sets up the start node and stop nodes for
     * simulating transitions on the graph.
     *
     * @param id ID of the model.
     * @param startNode Start node for traversing the graph.
     * @param stopNodes Nodes stopping the graph walk through.
     * @param nodes Dictionary mapping the node ids to the actual nodes in the graph.
     * @param edges Dictionary mapping the edge ids to the actual edges in the graph.
     */
    constructor(id: string, startNode: ModelNode, stopNodes: { [key: string]: ModelNode },
                nodes: { [key: string]: ModelNode }, edges: { [key: string]: ProgramModelEdge }) {
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
            this.coverageCurrentRun[edge.id] = true;
            this.coverageTotal[edge.id] = true;
            this.currentState = edge.getEndNode();
        }
        return edge;
    }

    /**
     * Get the coverage of this model of the last run.
     */
    getCoverageCurrentRun() {
        let covered = 0;
        for (const key in this.coverageCurrentRun) {
            if (this.coverageCurrentRun[key]) {
                covered++;
            }
        }
        return {
            covered: covered,
            total: Object.keys(this.edges).length
        }
    }

    /**
     * Get the coverage of all test runs with this model. Resets the total coverage.
     */
    getTotalCoverage() {
        let covered = [];
        let missedEdges = [];
        for (const key in this.edges) {
            if (this.coverageTotal[key]) {
                covered.push(key);
            } else {
                missedEdges.push(key);
            }
            this.coverageTotal[key] = false;
        }
        return {
            covered: covered,
            total: Object.keys(this.edges).length,
            missedEdges
        }
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
        for (const edgesCoveredKey in this.coverageCurrentRun) {
            this.coverageCurrentRun[edgesCoveredKey] = false;
        }
    }

    /**
     * Register the check listener and test driver.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, result: ModelResult, caseSensitive: boolean) {
        Object.values(this.nodes).forEach(node => {
            node.registerComponents(checkListener, testDriver, result, caseSensitive);
        })
    }
}
