import {ModelNode} from "./ModelNode";
import {ModelEdge} from "./AbstractEdge";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {UserModel} from "./UserModel";
import {EndModel, ProgramModel} from "./ProgramModel";
import {ModelJSON} from "../schema/canonical";
import {ModelUsage} from "../schema/common";

export type Model =
    | UserModel
    | ProgramModel
    | EndModel
    ;

export abstract class AbstractModel<E extends ModelEdge> {
    private readonly _id: string;

    protected readonly startNodeId: string;
    protected readonly stopNodeIds: string[];
    protected readonly stopAllNodeIds: string[];

    protected readonly nodes: Record<string, ModelNode<E>>;
    protected readonly edges: Record<string, E>;

    currentState: ModelNode<E>;
    lastTransitionStep = 0;
    secondLastTransitionStep = 0;

    protected constructor(id: string, startNodeId: string, nodes: Record<string, ModelNode<E>>, edges: Record<string, E>,
                          stopNodeIds: string[], stopAllNodeIds: string[]) {
        if (!id) {
            throw new Error("No id given.");
        }
        if (!startNodeId || !nodes[startNodeId]) {
            throw new Error("No start node (id or in node set) given.");
        }
        this._id = id;
        this.currentState = nodes[startNodeId];
        this.nodes = nodes;
        this.edges = edges;
        this.startNodeId = startNodeId;
        this.stopNodeIds = stopNodeIds;
        this.stopAllNodeIds = stopAllNodeIds;
    }

    abstract makeOneTransition(t: TestDriver, checkUtility: CheckUtility): E | null;

    abstract toJSON(): ModelJSON;

    get id(): string {
        return this._id;
    }

    abstract get usage(): ModelUsage;
}
