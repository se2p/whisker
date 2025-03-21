import {Opcode} from "./Opcode";
import {Inputs, TopLevelListBlock, TopLevelVariableBlock} from "./Inputs";
import {Fields} from "./Fields";

export type BlockID = string;
export type CommentID = string;

export type VarList = TopLevelVariableBlock | TopLevelListBlock;

/**
 * A Scratch block is usually represented as a {@link Block} object. However, there is one exception: variables/lists
 * that are unconnected and top-level are represented as an array. This split mirrors the {@link Input} hierarchy.
 */
export type ScratchBlock = Block | VarList;
// An alternative, but equivalent definition:
// export type ScratchBlock = StackableBlock | ReporterBlock | VarList;

/**
 * Blocks are puzzle-piece shapes that are used to create code in the Scratch editor. The blocks connect to each other
 * vertically like a jigsaw puzzle, where each block type (hat, stack, reporter, boolean, or cap) has its own shape, and
 * a specially shaped slot for it to be inserted into, which prevents syntax errors. Series of connected blocks are
 * called scripts. Scripts are implicitly defined via the "next" and "parent" relations of the blocks that constitute
 * them.
 *
 * https://en.scratch-wiki.info/wiki/Blocks
 */
export interface Block {

    /**
     * A string naming the block.
     */
    opcode: Opcode;

    /**
     * The ID of the following block or null.
     */
    next: BlockID | null;

    /**
     * If the block is a stack block and is preceded, this is the ID of the preceding block. If the block is the first
     * stack block in a C mouth, this is the ID of the C block. If the block is an input to another block, this is the
     * ID of that other block. Otherwise, it is null.
     */
    parent: BlockID | null;

    /**
     * False if the block has a parent and true otherwise.
     */
    topLevel: boolean;

    /**
     * An object associating input IDs with arrays representing input arguments into which other blocks may be
     * dropped, including C mouths.
     */
    inputs: Inputs;

    /**
     * An object associating names with so-called fields (essentially, selected options in a rectangular dropdown menu).
     */
    fields: Fields;

    /**
     * True if this is a shadow block and false otherwise.
     */
    shadow: boolean;

    /**
     * The ID of the comment attached to this block, if any, or undefined.
     */
    comment?: CommentID;
}

/**
 * The first block of a script is called a toplevel block. As such, its parent is always null. While any block can be
 * a toplevel block, they are most commonly hat blocks. Otherwise, the entire script is effectively dead code (called
 * a script fragment, https://en.scratch-wiki.info/wiki/Script#Script_Fragments). As a notable exception, oval-shaped
 * drop down menus (https://en.scratch-wiki.info/wiki/Dropdown_Menu#Accept_Block_Inputs) that have been obscured by
 * dropping a reporter block on top of them, are also considered toplevel blocks, despite not being the first block in
 * a script.
 */
export interface TopLevelBlock extends Block {

    /**
     * Always null.
     */
    parent: null;

    /**
     * Always true.
     */
    topLevel: true;

    /**
     * The x-coordinate of the block in the code area.
     */
    x: number;

    /**
     * The y-coordinate of the block in the code area.
     */
    y: number;
}

export function isTopLevelBlock(block: Block): block is TopLevelBlock {
    return block.topLevel && block.parent === null && block['x'] !== undefined && block['y'] !== undefined;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isBlock(o: {}): o is Block {
    return (
        "opcode" in o && typeof o["opcode"] === "string" &&
        "topLevel" in o && typeof o["topLevel"] === "boolean" &&
        "shadow" in o && typeof o["shadow"] === "boolean" &&
        "fields" in o && typeof o["fields"] === "object" &&
        "inputs" in o && typeof o["inputs"] === "object"
    );
}

export function isBlockID(x: unknown): x is BlockID {
    return typeof x === "string";
}
