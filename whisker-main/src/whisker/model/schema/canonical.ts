import {z} from "zod";
import {ICommonModelJSON, IModelEdgeJSON, ModelNodeJSON, ProgramModelEdgeJSON, UserInputJSON} from "./common";

const UserModelEdgeJSON = IModelEdgeJSON.extend({
    effects: z.array(UserInputJSON),
});

const ModelEdgeJSON = z.union([
    ProgramModelEdgeJSON,
    UserModelEdgeJSON,
]);

const IModelJSON = ICommonModelJSON.extend({
    edges: z.array(ModelEdgeJSON),
    nodes: z.array(ModelNodeJSON),
});

const UserModelJSON = IModelJSON.extend({
    usage: z.literal("user"),
    edges: z.array(UserModelEdgeJSON),
});

const ProgramModelJSON = IModelJSON.extend({
    usage: z.literal("program"),
    edges: z.array(ProgramModelEdgeJSON),
});

const EndModelJSON = IModelJSON.extend({
    usage: z.literal("end"),
    edges: z.array(ProgramModelEdgeJSON),
});

export const ModelJSON = z.discriminatedUnion("usage", [
    UserModelJSON,
    ProgramModelJSON,
    EndModelJSON,
]);
