import {z} from "zod";
import {ICommonModelJSON, IModelEdgeJSON, ProgramModelEdgeJSON, UserInputJSON} from "./common";

const LegacyUserModelEdgeJSON = IModelEdgeJSON.extend({
    inputEffects: z.array(UserInputJSON),
});

const LegacyModelEdgeJSON = z.union([
    ProgramModelEdgeJSON,
    LegacyUserModelEdgeJSON,
]);

const ILegacyModelJSON = ICommonModelJSON.extend({
    edges: z.array(LegacyModelEdgeJSON),
    nodeIds: z.array(z.string()),
});

const LegacyUserModelJSON = ILegacyModelJSON.extend({
    usage: z.literal("user"),
    edges: z.array(LegacyUserModelEdgeJSON),
});

const LegacyProgramModelJSON = ILegacyModelJSON.extend({
    usage: z.literal("program"),
    edges: z.array(ProgramModelEdgeJSON),
});

const LegacyEndModelJSON = ILegacyModelJSON.extend({
    usage: z.literal("end"),
    edges: z.array(ProgramModelEdgeJSON),
});

export const LegacyModelJSON = z.discriminatedUnion("usage", [
    LegacyUserModelJSON,
    LegacyProgramModelJSON,
    LegacyEndModelJSON,
]);
