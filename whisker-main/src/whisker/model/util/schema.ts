import {z} from "zod";
import {CheckJSON} from "../checks/newCheck";
import {UserInputJSON} from "../inputs/newUserInput";

export type ArgType = string | number | string[] | number[] | boolean | {x:number, y:number};

export type EdgeID = string;
const EdgeID = z.string();

type NodeID = string;
const NodeID = z.string();

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
    conditions: CheckJSON[];
}

const IModelEdgeJSON = z.object({
    id: EdgeID.default(() => `edge-undef-${nextId()}`),
    label: z.string().optional(),
    from: NodeID,
    to: NodeID,
    forceTestAt: z.number().default(-1),
    forceTestAfter: z.number().default(-1),
    conditions: z.array(CheckJSON),
});

export interface ProgramModelEdgeJSON extends IModelEdgeJSON {
    effects: CheckJSON[];
}

const ProgramModelEdgeJSON = IModelEdgeJSON.extend({
    effects: z.array(CheckJSON).default([]),
});

export type ModelUsage =
    | "program"
    | "end"
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

interface IModelJSON {
    id: string;
    usage: ModelUsage;
    startNodeId: string;
    stopNodeIds: string[];
    stopAllNodeIds: string[];
    edges: IModelEdgeJSON[];
    nodes: ModelNodeJSON[];
}

const IModelJSON = z.object({
    id: z.string().default(() => `id_undefined${nextId()}`),
    usage: ModelUsage,
    startNodeId: z.string({
        invalid_type_error: "Expected exactly one start node"
    }),
    stopNodeIds: z.array(z.string()).default([]),
    stopAllNodeIds: z.array(z.string()).default([]),
    edges: z.array(ModelEdgeJSON),
    nodes: z.array(ModelNodeJSON),
});

export interface UserModelJSON extends IModelJSON {
    usage: "user";
    edges: UserModelEdgeJSON[];
}

const UserModelJSON = IModelJSON.extend({
    usage: z.literal("user"),
    edges: z.array(UserModelEdgeJSON),
});

export interface ProgramModelJSON extends IModelJSON {
    usage: "program";
    edges: ProgramModelEdgeJSON[];
}

const ProgramModelJSON = IModelJSON.extend({
    usage: z.literal("program"),
    edges: z.array(ProgramModelEdgeJSON),
});

export interface EndModelJSON extends IModelJSON {
    usage: "end";
    edges: ProgramModelEdgeJSON[];
}

const EndModelJSON = IModelJSON.extend({
    usage: z.literal("end"),
    edges: z.array(ProgramModelEdgeJSON),
});

export type ModelJSON =
    | UserModelJSON
    | ProgramModelJSON
    | EndModelJSON
    ;

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
