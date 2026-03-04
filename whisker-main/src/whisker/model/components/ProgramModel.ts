import {ProgramModelNode} from "./ModelNode";
import TestDriver from "../../../test/test-driver";
import {AbstractModel} from "./AbstractModel";
import {ProgramModelEdge} from "./ProgramModelEdge";
import {EdgeID, EndModelJSON, OracleModelJSON, ProgramModelJSON, StartType, StorageValueType} from "../util/schema";
import logger from "../../../util/logger";

export interface CoverageResult {
    total: number;
    covered: number;
}

export interface ExtendedCoverageResult extends CoverageResult {
    missedEdges: EdgeID[];
}

export interface ModelCoverageResult extends CoverageResult {
    repetitionCovered: number;
    totalCovered: number;
}

export type MinimizationResult = MinimizationResultUnchanged | MinimizationResultUpdated;

interface MinimizationResultUnchanged {
    status: false
    minimized: OracleModelJSON;
}

interface MinimizationResultUpdated {
    status: true
    minimized: OracleModelJSON;
    removedEdges: number,
    removedNodes: number,
    removedStopAllNodes: number,
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
abstract class AbstractProgramModel<J extends OracleModelJSON> extends AbstractModel<ProgramModelEdge> {
    protected coverageCurrentRun: Set<ProgramModelEdge> = new Set();
    protected coverageTotal: Set<ProgramModelEdge> = new Set();
    protected coverageRepetition: Set<ProgramModelEdge> = new Set();
    private _manuallyStopped = false;
    private _restartable = false;

    /**
     * Construct a program model (graph) with a string identifier. This model is executed in parallel to the program
     * and simulates the correct behaviour.
     *
     * @param id ID of the model.
     * @param startNodeId Id of the start node
     * @param nodes Dictionary mapping the node ids to the actual nodes in the graph.
     * @param edges Dictionary mapping the edge ids to the actual edges in the graph.
     * @param stopAllNodeIds Ids of the nodes that stop all models on reaching them.
     * @param initialStorage Initial values of the graph storage before the execution starts
     */
    protected constructor(id: string, startNodeId: string, nodes: Record<string, ProgramModelNode>,
                          edges: Record<string, ProgramModelEdge>, stopAllNodeIds: string[], initialStorage: Record<string, StorageValueType>) {
        super(id, startNodeId, nodes, edges, stopAllNodeIds, initialStorage);
    }

    abstract override get usage(): J["usage"];

    /**
     * Whether the model is in a stop state.
     */
    override stopped(): boolean {
        return super.stopped() || this._manuallyStopped;
    }

    override restart(currentStep: number): void {
        super.restart(currentStep);
        this._manuallyStopped = false;
    }

    /**
     * Reset the graph to the start state.
     */
    override reset(currentStep = 0): void {
        this.restart(currentStep);
        this._manuallyStopped = this._restartable;
        this.coverageCurrentRun?.clear();
    }

    /**
     * Get the coverage of this model of the last run.
     */
    getCoverageCurrentRun(debug = false): ModelCoverageResult {
        if (debug) {
            const notCoveredIds = Object.values(this.edges).filter(edge => !this.coverageCurrentRun.has(edge));
            if (notCoveredIds.length > 0) {
                logger.debug(`${this.id} not covered (${notCoveredIds.length}/${Object.keys(this.edges).length}): ${notCoveredIds.map(e=> e.getReadableId())}`);
            }
        }
        return {
            covered: this.coverageCurrentRun.size,
            repetitionCovered: this.coverageRepetition.size,
            totalCovered: this.coverageTotal.size,
            total: Object.keys(this.edges).length
        };
    }

    testForEvent(t: TestDriver): void {
        this.currentState.testForEvent(this.stepsSinceLastTransition(t), this.programEndStep);
    }

    clearTotalCoverage() {
        this.coverageCurrentRun.clear();
        this.coverageRepetition.clear();
        this.coverageTotal.clear();
    }

    /**
     * Get the coverage of all test runs with this model. Resets the total coverage.
     */
    getTotalCoverage(): ExtendedCoverageResult {
        const edges = Object.values(this.edges);
        const total = edges.length;
        const missedEdges = edges.filter(k => !this.coverageTotal.has(k)).map(e=> e.getReadableId());
        return {
            covered: total - missedEdges.length,
            total,
            missedEdges: missedEdges
        };
    }

    /**
     * Stops this model.
     */
    stop(): void {
        this._manuallyStopped = true;
    }

    enableRestarting(): void {
        this._restartable = true;
        this._manuallyStopped = true;
    }

    /**
     * Whether all models should stop.
     */
    haltAllModels(): boolean {
        return this.currentState.isStopAllNode;
    }

    toJSON(): J {
        return {
            usage: this.usage,
            id: this.id,
            startNodeId: this.startNodeId,
            stopAllNodeIds: this.stopAllNodeIds.slice(),
            nodes: Object.values(this.nodes).map((node) => node.toJSON()),
            edges: Object.values(this.edges).map((edge) => edge.toJSON()),
            initialStorage: {...this.initialStorage}
        } as J;
    }

    toMinimizedJSON(): MinimizationResult {
        const filteredEdges = Object.values(this.edges).filter(e => this.coverageTotal.has(e));
        if (filteredEdges.length === 0) {
            return {status: false, minimized: this.toJSON()};
        }
        let edges: ProgramModelEdge[] = Object.values(this.edges);
        let nodes: ProgramModelNode[] = Object.values(this.nodes);
        let stopAllNodeIds: string[] = this.stopAllNodeIds;
        const edgeCount = edges.length;
        const nodeCount = nodes.length;
        const stopNodeCount = stopAllNodeIds.length;
        edges = filteredEdges;
        const nodeSet = new Set(edges.map(e => [e.from, e.to]).flat());
        nodes = nodes.filter(n => nodeSet.has(n.id));
        stopAllNodeIds = stopAllNodeIds.filter(id => nodeSet.has(id));
        const removedEdges = edgeCount - edges.length;
        const removedNodes = nodeCount - nodes.length;
        const removedStopAllNodes = stopNodeCount - stopAllNodeIds.length;
        return {
            status: true,
            minimized: {
                usage: this.usage,
                id: this.id,
                startNodeId: this.startNodeId,
                stopAllNodeIds: stopAllNodeIds,
                nodes: nodes.map((node) => node.toJSON()),
                edges: edges.map((edge) => edge.toJSON()),
                initialStorage: {...this.initialStorage}
            } as J,
            removedEdges,
            removedNodes,
            removedStopAllNodes
        };
    }

    clearRepetitionCoverage() {
        this.coverageCurrentRun.clear();
        this.coverageRepetition.clear();
    }

    protected override _takeEdge(edge: ProgramModelEdge, t: TestDriver): void {
        this.coverageCurrentRun.add(edge);
        this.coverageRepetition.add(edge);
        this.coverageTotal.add(edge);
        super._takeEdge(edge, t);
    }
}

export class EndModel extends AbstractProgramModel<EndModelJSON> {
    constructor(id: string, startNodeId: string, nodes: Record<string, ProgramModelNode>,
                edges: Record<string, ProgramModelEdge>, stopAllNodeIds: string[], initialStorage: Record<string, StorageValueType>) {
        super(id, startNodeId, nodes, edges, stopAllNodeIds, initialStorage);
    }

    override get usage(): "end" {
        return "end";
    }
}

export class ProgramModel extends AbstractProgramModel<ProgramModelJSON> {

    public readonly type: StartType;
    public readonly param: string;

    constructor(id: string, startNodeId: string, nodes: Record<string, ProgramModelNode>,
                edges: Record<string, ProgramModelEdge>, stopAllNodeIds: string[],
                initialStorage: Record<string, StorageValueType>,
                startType: StartType = "GreenFlag", startTypeParam = "") {
        super(id, startNodeId, nodes, edges, stopAllNodeIds, initialStorage);
        this.type = startType;
        this.param = startTypeParam;
        if (this.type !== "GreenFlag") {
            this.enableRestarting();
        }
    }

    override get usage(): "program" {
        return "program";
    }

    override toJSON(): ProgramModelJSON {
        const json = super.toJSON();
        if (this.type != "GreenFlag") {
            json.type = this.type;
            json.param = this.param;
        }
        return json;
    }
}
