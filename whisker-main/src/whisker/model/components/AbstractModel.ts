import {ModelNode, ModelNodeJSON} from "./ModelNode";
import {ModelEdge, IModelEdgeJSON, LegacyModelEdgeJSON} from "./AbstractEdge";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {LegacyUserModelJSON, UserModel, UserModelJSON} from "./UserModel";
import {
    EndModel,
    EndModelJSON,
    LegacyEndModelJSON,
    LegacyProgramModelJSON,
    ProgramModel,
    ProgramModelJSON
} from "./ProgramModel";

export type ModelUsage =
    | "program"
    | "end"
    | "user"
    ;

/**
 * Properties common to the canonical JSON representation and the legacy JSON representation of models.
 */
interface ICommonModelJSON {
    id: string;
    usage: ModelUsage;
    startNodeId: string;
    stopNodeIds: string[];
    stopAllNodeIds: string[];
}

/**
 * Properties exclusive to the canonical JSON representation.
 */
export interface IModelJSON extends ICommonModelJSON {
    edges: IModelEdgeJSON[];
    nodes: ModelNodeJSON[];
}

/**
 * Properties exclusive to the legacy JSON representation.
 */
export interface ILegacyModelJSON extends ICommonModelJSON {
    edges: LegacyModelEdgeJSON[];
    nodeIds: string[];
}

/**
 * The canonical JSON representation of models.
 */
export type ModelJSON =
    | UserModelJSON
    | ProgramModelJSON
    | EndModelJSON
    ;

/**
 * The legacy JSON representation of models.
 */
export type LegacyModelJSON =
    | LegacyUserModelJSON
    | LegacyProgramModelJSON
    | LegacyEndModelJSON
    ;

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
}
