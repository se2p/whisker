import {Blocks, Broadcasts, Lists, Variables} from "../project/Target";
import {Block, BlockID} from "../blocks/Block";
import {Input, isTopLevelDataBlock} from "../blocks/Inputs";
import {getBlockIDs} from "./blocks";
import {deepCopy, empty} from "./Objects";

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

export function emptyInputMeta(
    input: Input,
    shadow: boolean,
    obscured: boolean,
): InputMeta {
    return {
        type: "Input", input, shadow, obscured, ...emptyMeta(),
    };
}

export function toBlockMeta(inputMeta: InputMeta): BlockMeta {
    const blockIDs = getBlockIDs(inputMeta.input);

    if (blockIDs.length === 0) {
        throw new Error("Cannot convert input metadata to block metadata because the input is not a block");
    }

    const [rootID] = blockIDs;
    const lastID = findLastID(rootID, inputMeta.blocks);

    const blockMeta = {
        ...inputMeta,
        rootID,
        lastID,
        type: "Block",
    };

    delete blockMeta.input;

    return deepCopy(blockMeta as BlockMeta);
}

function emptyMeta(): IMeta {
    const keys = ["blocks", "lists", "stageLists", "variables", "stageVariables", "broadcasts"];
    const entries = keys.map((key) => [key, empty()]);
    return Object.fromEntries(entries);
}

/**
 * Starting at the root node, follow the chain of `next` blocks until we are at the last block, and return that block.
 */
export function findLastID(rootID: BlockID, blocks: Blocks): BlockID {
    let currentID = rootID;
    let current = blocks[currentID] as Block;

    if (isTopLevelDataBlock(current)) {
        return currentID;
    }

    while (current.next !== null && blocks[current.next]) {
        currentID = current.next;
        current = blocks[current.next] as Block;
    }

    return currentID;
}
