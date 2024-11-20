import {z} from "zod";
import {CheckName, CHECK_NAMES} from "../components/Check";
import {UserInputName, USER_INPUT_NAMES} from "../components/UserInput";
import {nextId} from "./schema";

const CheckName = z.enum(CHECK_NAMES);

export type ArgType =
    | string
    | number
    | string[]
    ;

const ArgType = z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
]);

export interface CheckJSON {
    id: string
    name: CheckName;
    negated: boolean;
    args: ArgType[];
}

const CheckJSON = z.object({
    id: z.string().default(() => `check${nextId()}`),
    name: CheckName,
    negated: z.boolean(),
    args: z.array(ArgType),
});

const UserInputName = z.enum(USER_INPUT_NAMES);

export interface UserInputJSON {
    id: string;
    name: UserInputName;
    args: ArgType[];
}

export const UserInputJSON = z.object({
    id: z.string(),
    name: UserInputName,
    args: z.array(ArgType),
});

export type EdgeID = string;
const EdgeID = z.string();

type NodeID = string;
const NodeID = z.string();

export interface ModelNodeJSON {
    id: NodeID;
    label: string;
}

export const ModelNodeJSON = z.object({
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

export const IModelEdgeJSON = z.object({
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

export const ProgramModelEdgeJSON = IModelEdgeJSON.extend({
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

export interface ICommonModelJSON {
    id: string;
    usage: ModelUsage;
    startNodeId: string;
    stopNodeIds: string[];
    stopAllNodeIds: string[];
}

export const ICommonModelJSON = z.object({
    id: z.string().default(() => `id_undefined${nextId()}`),
    usage: ModelUsage,
    startNodeId: z.string({
        invalid_type_error: "Expected exactly one start node"
    }),
    stopNodeIds: z.array(z.string()).default([]),
    stopAllNodeIds: z.array(z.string()).default([]),
});
