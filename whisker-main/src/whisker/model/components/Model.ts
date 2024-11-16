import {ModelNode, SimpleModelNode} from "./ModelNode";
import {ModelEdge} from "./ModelEdge";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";

export interface SimpleModel {
    id: string;
    nodes: SimpleModelNode[];
    startNodeId: string;
    stopNodeIds: string[];
    stopAllNodeIds: string[];
}

export abstract class Model<E, J extends SimpleModel> {
    readonly id: string;

    protected readonly startNodeId: string;
    protected readonly stopNodeIds: string[];
    protected readonly stopAllNodeIds: string[];

    protected readonly nodes: Record<string, ModelNode>;
    protected readonly edges: Record<string, E>;

    currentState: ModelNode;
    lastTransitionStep = 0;
    secondLastTransitionStep = 0;

    protected constructor(id: string, startNodeId: string, nodes: Record<string, ModelNode>, edges: Record<string, E>,
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

    abstract makeOneTransition(t: TestDriver, checkUtility: CheckUtility): ModelEdge | null;

    abstract simplifyForSave(): J;
}
