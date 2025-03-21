import {Opcode} from "./Opcode";
import {Inputs} from "./Inputs";
import {Fields} from "./Fields";

export type BlockID = string;
export type CommentID = string;

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

export function isBlockID(x: unknown): x is BlockID {
    return typeof x === "string";
}
