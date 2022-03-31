import {ModelNode} from "./ModelNode";
import {ModelEdge, UserModelEdge} from "./ModelEdge";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";

/**
 *  Graph structure for a user model representing the user's behaviour when playing a Scratch program.
 *
 * ############# Assumptions ##################
 * - Only one start node, unique
 * - Does not need a stop node.
 * - A stop node stops the model it belongs to.
 * - A stop all node stops all models of this type.
 * - Each edge has a condition (input event, condition for a variable,....) -> or at least an always true condition
 * - Input effects are immediate inputs in the step the condition holds.
 * - Conditions should exclude each other so only one edge can be taken at one step. The first matching one is
 * taken. So that it not gets ambiguous.
 */
export class UserModel {
    readonly id: string;

    protected readonly startNodeId: string;
    protected readonly stopNodeIds: string[];
    protected readonly stopAllNodeIds: string[];

    protected readonly nodes: { [key: string]: ModelNode };
    protected readonly edges: { [key: string]: UserModelEdge };

    lastTransitionStep: number = 0;
    secondLastTransitionStep: number = 0;
    stepNbrOfProgramEnd: number;
    protected currentState: ModelNode;

    /**
     * Construct a user model (graph) with a string identifier. This model acts as a user playing/using the Scratch
     * program and provides inputs for the program.
     *
     * @param id ID of the model.
     * @param startNodeId Id of the start node
     * @param nodes Dictionary mapping the node ids to the actual nodes in the graph.
     * @param edges Dictionary mapping the edge ids to the actual edges in the graph.
     * @param stopNodeIds Ids of the stop nodes.
     * @param stopAllNodeIds Ids of the nodes that stop all models on reaching them.
     */
    constructor(id: string, startNodeId: string, nodes: { [key: string]: ModelNode }, edges: { [key: string]: UserModelEdge },
                stopNodeIds: string[], stopAllNodeIds: string[]) {
        if (!id) {
            throw new Error("No id given.");
        }
        if (!startNodeId || !nodes[startNodeId]) {
            throw new Error("No start node (id or in node set) given.");
        }
        this.id = id;
        this.currentState = nodes[startNodeId];
        this.nodes = nodes;
        this.edges = edges;
        this.startNodeId = startNodeId;
        this.stopNodeIds = stopNodeIds;
        this.stopAllNodeIds = stopAllNodeIds;
    }

    /**
     * Simulate transitions on the graph. Edges are tested only once if they are reached.
     */
    makeOneTransition(testDriver: TestDriver, checkUtility: CheckUtility): ModelEdge {
        let stepsSinceLastTransition = testDriver.getTotalStepsExecuted() - this.lastTransitionStep;
        let edge = this.currentState.testEdgeConditions(testDriver, checkUtility, stepsSinceLastTransition,
            this.stepNbrOfProgramEnd);

        if (edge != null) {
            this.currentState = this.nodes[edge.getEndNodeId()];
            this.secondLastTransitionStep = this.lastTransitionStep;
            this.lastTransitionStep = testDriver.getTotalStepsExecuted() + 1;
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
        this.currentState = this.nodes[this.startNodeId];
        this.lastTransitionStep = 0;
        this.secondLastTransitionStep = 0;
        Object.values(this.nodes).forEach(node => {
            node.reset();
        });
    }

    /**
     * Register the check listener and test driver on all node's edges.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, caseSensitive: boolean) {
        Object.values(this.nodes).forEach(node => {
            node.registerComponents(checkListener, testDriver, caseSensitive);
        });
    }

    setTransitionsStartTo(steps: number) {
        this.lastTransitionStep = steps;
        this.secondLastTransitionStep = steps;
    }

    simplifyForSave() {
        let edges = [];
        for (let edgesKey in this.edges) {
            edges.push(this.edges[edgesKey].simplifyForSave());
        }
        let nodes = [];
        for (let nodesKey in this.nodes) {
            nodes.push(this.nodes[nodesKey].simplifyForSave());
        }
        return {
            id: this.id,
            startNodeId: this.startNodeId,
            stopNodeIds: this.stopNodeIds,
            stopAllNodeIds: this.stopAllNodeIds,
            nodes: nodes,
            edges: edges
        };
    }
}
