import {ProgramModelNode} from "./ModelNode";
import TestDriver from "../../../test/test-driver";
import {AbstractModel} from "./AbstractModel";
import {ProgramModelEdge} from "./ProgramModelEdge";
import {EdgeID, EndModelJSON, OracleModelJSON, ProgramModelJSON, StartType, StorageValueType} from "../util/schema";
import logger from "../../../util/logger";

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
abstract class AbstractProgramModel<J extends OracleModelJSON> extends AbstractModel<ProgramModelEdge> {
    protected coverageCurrentRun: Record<string, boolean> = {};
    protected coverageTotal: Record<string, boolean> = {};
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
        for (const edgesCoveredKey of Object.keys(this.coverageCurrentRun)) {
            this.coverageCurrentRun[edgesCoveredKey] = false;
        }
    }

    protected override _takeEdge(edge: ProgramModelEdge, t: TestDriver): void {
        this.coverageCurrentRun[edge.id] = true;
        this.coverageTotal[edge.id] = true;
        super._takeEdge(edge, t);
    }

    testForEvent(t: TestDriver): void {
        this.currentState.testForEvent(this.stepsSinceLastTransition(t), this.programEndStep);
    }

    /**
     * Get the coverage of this model of the last run.
     */
    getCoverageCurrentRun(debug = false): CoverageResult {
        const covered = Object.entries(this.coverageCurrentRun)
            .filter(([edgeID, covered]) => covered)
            .map(([edgeID]) => edgeID);

        const notCoveredIds = Object.keys(this.edges).filter(k => !this.coverageCurrentRun[k]);
        if (debug && notCoveredIds.length > 0) {
            logger.debug(`${this.id} not covered (${notCoveredIds.length}/${Object.keys(this.edges).length}): ${notCoveredIds}`);
        }
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
            stopAllNodeIds: this.stopAllNodeIds,
            nodes: Object.values(this.nodes).map((node) => node.toJSON()),
            edges: Object.values(this.edges).map((edge) => edge.toJSON()),
            initialStorage: this.initialStorage
        } as J;
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
