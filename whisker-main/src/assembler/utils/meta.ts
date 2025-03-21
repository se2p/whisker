import {Blocks, Broadcasts, Lists, Variables} from "../project/Target";
import {BlockID} from "../blocks/Block";
import {Input} from "../blocks/Inputs";
import {empty} from "../../assembler.old/utils/Objects";

interface IMeta {
    // Usually, the root block and its children: input blocks and next blocks.
    blocks: Blocks;

    // Primitive inputs.
    variables: Variables;
    stageVariables: Variables;
    lists: Lists;
    stageLists: Lists;
    broadcasts: Broadcasts;
}

export type Meta = BlockMeta | InputMeta;

export interface BlockMeta extends IMeta {
    type: "Block";
    rootID: BlockID;
    lastID: BlockID;
}

export interface InputMeta extends IMeta {
    type: "Input";
    input: Input;
    shadow: boolean;
    obscured: boolean;
}

export function emptyBlockMeta(rootID: BlockID, lastID: BlockID): BlockMeta {
    return {
        type: "Block",
        rootID,
        lastID,
        ...emptyMeta(),
    };
}

function emptyMeta(): IMeta {
    const keys = ["blocks", "lists", "stageLists", "variables", "stageVariables", "broadcasts"];
    const entries = keys.map((key) => [key, empty()]);
    return Object.fromEntries(entries);
}
