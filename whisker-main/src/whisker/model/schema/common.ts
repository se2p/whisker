import {z} from "zod";
import {CHECK_NAMES} from "../components/Check";
import {USER_INPUT_NAMES} from "../components/UserInput";

const CheckName = z.enum(CHECK_NAMES);

const ArgType = z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
]);

const CheckJSON = z.object({
    id: z.string(),
    name: CheckName,
    negated: z.boolean(),
    args: z.array(ArgType),
});

const UserInputName = z.enum(USER_INPUT_NAMES);

export const UserInputJSON = z.object({
    id: z.string(),
    name: UserInputName,
    args: z.array(ArgType),
});

const EdgeID = z.string();
const NodeID = z.string();

export const ModelNodeJSON = z.object({
    id: NodeID,
    label: z.string(),
});

export const IModelEdgeJSON = z.object({
    id: EdgeID,
    label: z.string(),
    from: NodeID,
    to: NodeID,
    forceTestAt: z.number(),
    forceTestAfter: z.number(),
    conditions: z.array(CheckJSON),
});

export const ProgramModelEdgeJSON = IModelEdgeJSON.extend({
    effects: z.array(CheckJSON),
});

const ModelUsage = z.union([
    z.literal("program"),
    z.literal("end"),
    z.literal("user"),
]);

export const ICommonModelJSON = z.object({
    id: z.string(),
    usage: ModelUsage,
    startNodeId: z.string(),
    stopNodeIds: z.array(z.string()),
    stopAllNodeIds: z.array(z.string()),
});
