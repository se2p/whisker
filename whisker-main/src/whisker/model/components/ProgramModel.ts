import {ModelNode} from "./ModelNode";
import {ModelEdge, ProgramModelEdge} from "./ModelEdge";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {start} from "repl";

/**
 * Graph structure for a program model representing the program behaviour of a Scratch program.
 *
 * ############# Assumptions ##################
 * - Only one start node, unique
 * - Does not need a stop node.
 * - A stop node stops the model it belongs to.
 * - A stop all node stops all models of this type.
 * - Each edge has a condition (input event, condition for a variable,....) -> or at least an always true condition
 * - Effects can also occur at a later VM step, therefore its tested 2 successive steps long for occurrence.
 * - Conditions should exclude each other so only one edge can be taken at one step. The first matching one is
 * taken. So that it not gets ambiguous.
 */
export class ProgramModel {
    readonly id: string;

    protected readonly startNodeId: string;
    protected readonly stopNodeIds: string[];
    protected readonly stopAllNodeIds: string[];

    protected readonly nodes: { [key: string]: ModelNode };
    protected readonly edges: { [key: string]: ProgramModelEdge };

    protected coverageCurrentRun: { [key: string]: boolean } = {};
    protected coverageTotal: { [key: string]: boolean } = {};

    lastTransitionStep: number = 0;
    secondLastTransitionStep: number = 0;
    programEndStep: number;
    currentState: ModelNode;

    /**
     * Construct a program model (graph) with a string identifier. This model is executed in parallel to the program
     * and simulates the correct behaviour.
     *
     * @param id ID of the model.
     * @param startNodeId Id of the start node
     * @param nodes Dictionary mapping the node ids to the actual nodes in the graph.
     * @param edges Dictionary mapping the edge ids to the actual edges in the graph.
     * @param stopNodeIds Ids of the stop nodes.
     * @param stopAllNodeIds Ids of the nodes that stop all models on reaching them.
     */
    constructor(id: string, startNodeId: string, nodes: { [key: string]: ModelNode },
                edges: { [key: string]: ProgramModelEdge }, stopNodeIds: string[], stopAllNodeIds: string[]) {
        if (!id) {
            throw new Error("No id given.");
        }
        if (!startNodeId || !nodes[startNodeId]) {
            throw new Error("No start node (id or in node set) given.");
        }
        this.id = id;
        this.startNodeId = startNodeId;
        this.currentState = nodes[startNodeId];
        this.nodes = nodes;
        this.edges = edges;
        this.stopNodeIds = stopNodeIds;
        this.stopAllNodeIds = stopAllNodeIds;
    }

    /**
     * Simulate transitions on the graph. Edges are tested only once if they are reached.
     */
    makeOneTransition(t: TestDriver, checkUtility: CheckUtility): ModelEdge {
        let stepsSinceLastTransition = (t.getTotalStepsExecuted() + 1) - this.lastTransitionStep;
        let edge = this.currentState.testEdgeConditions(t, checkUtility, stepsSinceLastTransition,
            this.programEndStep);


        if (edge != null) {
            this.update(t, edge);
        }
        return edge;
    }

    testForEvent(t: TestDriver, cu: CheckUtility, eventStrings: string[]): ModelEdge {
        let stepsSinceLastTransition = (t.getTotalStepsExecuted() + 1) - this.lastTransitionStep;
        let edge = this.currentState.testForEvent(t, cu, stepsSinceLastTransition, this.programEndStep,
            eventStrings);

        if (edge != null) {
            this.update(t, edge);
        }
        return edge;
    }

    private update(t: TestDriver, edge: ModelEdge) {
        this.coverageCurrentRun[edge.id] = true;
        this.coverageTotal[edge.id] = true;
        this.currentState = this.nodes[edge.getEndNodeId()];
        this.secondLastTransitionStep = this.lastTransitionStep;
        this.lastTransitionStep = t.getTotalStepsExecuted() + 1;

    }

    /**
     * Get the coverage of this model of the last run.
     */
    getCoverageCurrentRun() {
        let covered = [];
        for (const key in this.coverageCurrentRun) {
            if (this.coverageCurrentRun[key]) {
                covered.push(key);
            }
        }
        return {
            covered: covered,
            total: Object.keys(this.edges).length
        };
    }

    /**
     * Get the coverage of all test runs with this model. Resets the total coverage.
     */
    getTotalCoverage(): {covered: ProgramModelEdge[], total: number, missedEdges: ProgramModelEdge[]} {
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
            missedEdges: missedEdges
        };
    }

    /**
     * Whether the model is in a stop state.
     */
    stopped() {
        return this.currentState.isStopNode;
    }

    /**
     * Whether all models should stop.
     */
    haltAllModels() {
        return this.currentState.isStopAllNode;
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
        for (const edgesCoveredKey in this.coverageCurrentRun) {
            this.coverageCurrentRun[edgesCoveredKey] = false;
        }
    }

    /**
     * Register the check listener and test driver.
     */
    registerComponents(cu: CheckUtility, testDriver: TestDriver, caseSensitive: boolean) {
        Object.values(this.nodes).forEach(node => {
            node.registerComponents(cu, testDriver, caseSensitive);
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
