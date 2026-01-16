import {z} from "zod";
import {CheckJSON, ConditionJSON} from "../checks/newCheck";
import {UserInputJSON} from "../inputs/newUserInput";
import {UserModel} from "../components/UserModel";

export type Position = { x: number; y: number; }
export type ArgType = string | number | string[] | boolean;

export type EdgeID = string;
const EdgeID = z.string();

type NodeID = string;
const NodeID = z.string();

type GraphID = string;
const GraphID = z.string().default(() => `id_undefined${nextId()}`);

export interface ModelNodeJSON {
    id: NodeID;
    label: string;
}

const ModelNodeJSON = z.object({
    id: NodeID,
    label: z.string().optional(),
});

export interface IModelEdgeJSON {
    id: EdgeID;
    label: string;
    from: NodeID;
    to: NodeID;
    forceTestAt: number;
    forceTestAfter: number
    conditions: ConditionJSON[];
}

const IModelEdgeJSON = z.object({
    id: EdgeID.default(() => `edge-undef-${nextId()}`),
    label: z.string().optional(),
    from: NodeID,
    to: NodeID,
    forceTestAt: z.number().default(-1),
    forceTestAfter: z.number().default(-1),
    conditions: z.array(ConditionJSON),
});

export interface ProgramModelEdgeJSON extends IModelEdgeJSON {
    effects: CheckJSON[];
}

const ProgramModelEdgeJSON = IModelEdgeJSON.extend({
    effects: z.array(CheckJSON).default([]),
});

export type OracleModelUsage =
    | "program"
    | "end"
    ;

export type ModelUsage =
    OracleModelUsage
    | "user"
    ;

const ModelUsage = z.union([
    z.literal("program"),
    z.literal("end"),
    z.literal("user"),
]);

export interface UserModelEdgeJSON extends IModelEdgeJSON {
    effects: UserInputJSON[];
}

const UserModelEdgeJSON = IModelEdgeJSON.extend({
    effects: z.array(UserInputJSON),
});

export type ModelEdgeJSON =
    | ProgramModelEdgeJSON
    | UserModelEdgeJSON
    ;

const ModelEdgeJSON = z.union([
    ProgramModelEdgeJSON,
    UserModelEdgeJSON,
]);

export type StorageValueType = ["number", number] | ["string", string] | ["exprType", string | string[]];

export const StorageValueType = z.tuple([z.literal("string"), z.string()])
    .or(z.tuple([z.literal("number"), z.number()]))
    .or(z.tuple([z.literal("exprType"), z.string().or(z.array(z.string()))]));

export interface IModelJSON {
    id: GraphID;
    usage: ModelUsage;
    startNodeId: NodeID;
    stopAllNodeIds: NodeID[];
    edges: IModelEdgeJSON[];
    nodes: ModelNodeJSON[];
    initialStorage: Record<string, StorageValueType>;
}

const IModelJSON = z.object({
    id: GraphID,
    usage: ModelUsage,
    startNodeId: z.string({
        invalid_type_error: "Expected exactly one start node"
    }),
    stopAllNodeIds: z.array(NodeID).default([]),
    edges: z.array(ModelEdgeJSON),
    nodes: z.array(ModelNodeJSON),
    initialStorage: z.record(z.string(), StorageValueType).default(() => ({})),
});

export interface UserModelJSON extends IModelJSON {
    usage: "user";
    edges: UserModelEdgeJSON[];
    maxDuration: number
}

const UserModelJSON = IModelJSON.extend({
    usage: z.literal("user"),
    edges: z.array(UserModelEdgeJSON),
    maxDuration: z.number().optional().default(UserModel.NO_DURATION),
});

export type StartType = "GreenFlag" | "Event" | "CloneCreated" | "Backdrop" | "Key" | "Click" | "Loudness";

const StartType = z.union([
    z.literal("GreenFlag"),
    z.literal("Event"),
    z.literal("CloneCreated"),
    z.literal("Backdrop"),
    z.literal("Key"),
    z.literal("Click"),
    z.literal("Loudness"),
]);

export interface ProgramModelJSON extends IModelJSON {
    usage: "program";
    edges: ProgramModelEdgeJSON[];
    type?: StartType;
    param?: string;
}

const ProgramModelJSON = IModelJSON.extend({
    usage: z.literal("program"),
    edges: z.array(ProgramModelEdgeJSON),
    type: StartType.optional().default("GreenFlag"),
    param: z.string().optional().default(""),
});

export interface EndModelJSON extends IModelJSON {
    usage: "end";
    edges: ProgramModelEdgeJSON[];
}

const EndModelJSON = IModelJSON.extend({
    usage: z.literal("end"),
    edges: z.array(ProgramModelEdgeJSON),
});

export type OracleModelJSON =
    | ProgramModelJSON
    | EndModelJSON
    ;

export type ModelJSON =
    | UserModelJSON
    | OracleModelJSON
    ;

const OracleModelJSON = z.discriminatedUnion("usage", [
    ProgramModelJSON,
    EndModelJSON,
]);

const ModelJSON = z.discriminatedUnion("usage", [
    UserModelJSON,
    ProgramModelJSON,
    EndModelJSON,
]);

let idUndefined = 0;

function nextId(): number {
    return idUndefined++;
}

export function parse(text: string): ModelJSON[] {
    idUndefined = 0;
    return ModelJSON.array().parse(JSON.parse(text)) as ModelJSON[];
}
