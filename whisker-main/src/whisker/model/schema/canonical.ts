import {z} from "zod";
import {ICommonModelJSON, IModelEdgeJSON, ModelNodeJSON, ProgramModelEdgeJSON, UserInputJSON} from "./common";

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

interface IModelJSON extends ICommonModelJSON {
    edges: IModelEdgeJSON[];
    nodes: ModelNodeJSON[];
}

const IModelJSON = ICommonModelJSON.extend({
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

export const ModelJSON = z.discriminatedUnion("usage", [
    UserModelJSON,
    ProgramModelJSON,
    EndModelJSON,
]);
