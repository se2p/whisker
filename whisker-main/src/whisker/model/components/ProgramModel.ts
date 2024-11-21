import {ProgramModelNode} from "./ModelNode";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {AbstractModel} from "./AbstractModel";
import {ProgramModelEdge} from "./ProgramModelEdge";
import {EndModelJSON, ProgramModelJSON} from "../schema/canonical";
import {EdgeID} from "../schema/common";

export interface CoverageResult {
    total: number;
    covered: EdgeID[]
}

export interface ExtendedCoverageResult extends CoverageResult {
    missedEdges: EdgeID[];
}

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
abstract class AbstractProgramModel extends AbstractModel<ProgramModelEdge> {
    protected coverageCurrentRun: Record<string, boolean> = {};
    protected coverageTotal: Record<string, boolean> = {};

    programEndStep = 0;

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
    protected constructor(id: string, startNodeId: string, nodes: Record<string, ProgramModelNode>,
                          edges: Record<string, ProgramModelEdge>, stopNodeIds: string[], stopAllNodeIds: string[]) {
        super(id, startNodeId, nodes, edges, stopNodeIds, stopAllNodeIds);
    }

    /**
     * Simulate transitions on the graph. Edges are tested only once if they are reached.
     */
    override makeOneTransition(t: TestDriver, checkUtility: CheckUtility): ProgramModelEdge | null {
        const stepsSinceLastTransition = (t.getTotalStepsExecuted() + 1) - this.lastTransitionStep;
        const edge = this.currentState.testEdgeConditions(t, checkUtility, stepsSinceLastTransition,
            this.programEndStep);


        if (edge != null) {
            this._update(t, edge);
        }
        return edge;
    }

    testForEvent(t: TestDriver, cu: CheckUtility, eventStrings: string[]): ProgramModelEdge | null {
        const stepsSinceLastTransition = (t.getTotalStepsExecuted() + 1) - this.lastTransitionStep;
        const edge = this.currentState.testForEvent(t, cu, stepsSinceLastTransition, this.programEndStep,
            eventStrings);

        if (edge != null) {
            this._update(t, edge);
        }
        return edge;
    }

    private _update(t: TestDriver, edge: ProgramModelEdge) {
        this.coverageCurrentRun[edge.id] = true;
        this.coverageTotal[edge.id] = true;
        this.currentState = this.nodes[edge.getEndNodeId()];
        this.secondLastTransitionStep = this.lastTransitionStep;
        this.lastTransitionStep = t.getTotalStepsExecuted() + 1;

    }

    /**
     * Get the coverage of this model of the last run.
     */
    getCoverageCurrentRun(): CoverageResult {
        const covered = Object.entries(this.coverageCurrentRun)
            .filter(([edgeID, covered]) => covered)
            .map(([edgeID]) => edgeID);

        return {
            covered: covered,
            total: Object.keys(this.edges).length
        };
    }

    /**
     * Get the coverage of all test runs with this model. Resets the total coverage.
     */
    getTotalCoverage(): ExtendedCoverageResult {
        const covered: string[] = [];
        const missedEdges: string[] = [];
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
    stopped(): boolean {
        return this.currentState.isStopNode;
    }

    /**
     * Whether all models should stop.
     */
    haltAllModels(): boolean {
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
    registerComponents(cu: CheckUtility, testDriver: TestDriver): void {
        Object.values(this.nodes).forEach(node => {
            node.registerComponents(cu, testDriver);
        });
    }

    setTransitionsStartTo(steps: number): void {
        this.lastTransitionStep = steps;
        this.secondLastTransitionStep = steps;
    }
}

export class EndModel extends AbstractProgramModel {
    constructor(id: string, startNodeId: string, nodes: Record<string, ProgramModelNode>,
                edges: Record<string, ProgramModelEdge>, stopNodeIds: string[], stopAllNodeIds: string[]) {
        super(id, startNodeId, nodes, edges, stopNodeIds, stopAllNodeIds);
    }

    override get usage(): "end" {
        return "end";
    }

    override toJSON(): EndModelJSON {
        return {
            usage: this.usage,
            id: this.id,
            startNodeId: this.startNodeId,
            stopNodeIds: this.stopNodeIds,
            stopAllNodeIds: this.stopAllNodeIds,
            nodes: Object.values(this.nodes).map((node) => node.toJSON()),
            edges: Object.values(this.edges).map((edge) => edge.toJSON()),
        };
    }
}

export class ProgramModel extends AbstractProgramModel {
    constructor(id: string, startNodeId: string, nodes: Record<string, ProgramModelNode>,
                edges: Record<string, ProgramModelEdge>, stopNodeIds: string[], stopAllNodeIds: string[]) {
        super(id, startNodeId, nodes, edges, stopNodeIds, stopAllNodeIds);
    }

    override get usage(): "program" {
        return "program";
    }

    override toJSON(): ProgramModelJSON {
        return {
            usage: this.usage,
            id: this.id,
            startNodeId: this.startNodeId,
            stopNodeIds: this.stopNodeIds,
            stopAllNodeIds: this.stopAllNodeIds,
            nodes: Object.values(this.nodes).map((node) => node.toJSON()),
            edges: Object.values(this.edges).map((edge) => edge.toJSON()),
        };
    }
}
