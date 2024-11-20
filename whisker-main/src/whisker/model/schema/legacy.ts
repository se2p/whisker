import {z} from "zod";
import {ICommonModelJSON, IModelEdgeJSON, ProgramModelEdgeJSON, UserInputJSON} from "./common";

interface LegacyUserModelEdgeJSON extends IModelEdgeJSON {
    inputEffects: UserInputJSON[];
}

const LegacyUserModelEdgeJSON = IModelEdgeJSON.extend({
    inputEffects: z.array(UserInputJSON),
});

export type LegacyModelEdgeJSON =
    | ProgramModelEdgeJSON
    | LegacyUserModelEdgeJSON
    ;

const LegacyModelEdgeJSON = z.union([
    ProgramModelEdgeJSON,
    LegacyUserModelEdgeJSON,
]);

interface ILegacyModelJSON extends ICommonModelJSON {
    edges: LegacyModelEdgeJSON[];
    nodeIds: string[];
}

const ILegacyModelJSON = ICommonModelJSON.extend({
    edges: z.array(LegacyModelEdgeJSON),
    nodeIds: z.array(z.string()).default([]),
});

export interface LegacyUserModelJSON extends ILegacyModelJSON {
    usage: "user";
    edges: LegacyUserModelEdgeJSON[];
}

const LegacyUserModelJSON = ILegacyModelJSON.extend({
    usage: z.literal("user"),
    edges: z.array(LegacyUserModelEdgeJSON),
});

export interface LegacyProgramModelJSON extends ILegacyModelJSON {
    usage: "program";
    edges: ProgramModelEdgeJSON[];
}

const LegacyProgramModelJSON = ILegacyModelJSON.extend({
    usage: z.literal("program"),
    edges: z.array(ProgramModelEdgeJSON),
});

export interface LegacyEndModelJSON extends ILegacyModelJSON {
    usage: "end";
    edges: ProgramModelEdgeJSON[];
}

const LegacyEndModelJSON = ILegacyModelJSON.extend({
    usage: z.literal("end"),
    edges: z.array(ProgramModelEdgeJSON),
});

export type LegacyModelJSON =
    | LegacyUserModelJSON
    | LegacyProgramModelJSON
    | LegacyEndModelJSON
    ;

export const LegacyModelJSON = z.discriminatedUnion("usage", [
    LegacyUserModelJSON,
    LegacyProgramModelJSON,
    LegacyEndModelJSON,
]);
