import {Inputs, isTopLevelDataBlock, TopLevelListBlock, TopLevelVariableBlock} from "./Inputs";
import {
    capBlockOpcodes,
    cBlockOpcodes,
    dropDownMenuOpcodes,
    hatBlockOpcodes,
    Opcode,
    ShadowBlockOpcode,
    shadowBlockOpcodes,
    stackBlockOpcodes
} from "./Opcode";
import {isStackBlock, StackBlock} from "./shapes/StackBlock";
import {CBlock, isCBlock} from "./shapes/CBlock";
import {CapBlock, isCapBlock} from "./shapes/CapBlock";
import {HatBlock, isHatBlock} from "./shapes/HatBlock";
import {Fields} from "./Fields";
import {isShadowBlock, ShadowBlock} from "./other/ShadowBlock";

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

/**
 * Tells whether the given block represents an oval-shaped dropdown menu that is currently obscured by another input,
 * e.g., a variable block, or another reporter block.
 *
 * @param block the block to check
 */
export function isObscuredDropDownMenu(block: Block): boolean {
    /*
     * This is a funny one. When obscuring an oval-shaped dropdown menu with another input, Scratch sets its parent to
     * null. Then, the dropdown menu no longer knows which block it belonged to, thus effectively disabling it. However,
     * only toplevel blocks can have null as parent. So, Scratch also has to set toplevel = true, and add useless x and
     * y properties. To avoid drawing the dropdown menu as separate block, it also sets the shadow property to true.
     * (Regardless of whether the menu is obscured or not.) This indicates the block is just a fake block.
     *
     * "A shadow block is a reporter in an input for which one can enter or pick a value, and which cannot be dragged
     * around but can be replaced by a normal reporter. Scratch internally considers these to be blocks, although they
     * are not usually thought of as such. (These notions come from Blockly, which Scratch Blocks is based on.)"
     *
     * https://en.scratch-wiki.info/wiki/Scratch_File_Format#Blocks
     */
    return (dropDownMenuOpcodes as readonly Opcode[]).includes(block.opcode) &&
        block.shadow && isTopLevelBlock(block);
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

// eslint-disable-next-line @typescript-eslint/ban-types
export function isScratchBlock(o: {}): o is ScratchBlock {
    return isBlock(o) || isTopLevelDataBlock(o);
}

/**
 * A stackable block is a block which other stackable blocks can be connected to – above (`parent`) or below (`next`).
 * That is, stackable blocks have a `parent`-`next`-relationship. This holds for all blocks except reporter blocks
 * and shadow blocks. Although a reporter usually has a `parent` property, the parent is connected to the reporter using
 * an `InputKey`, not `next`. The same holds for shadow blocks. Note that some stackable blocks (`HatBlock`) never have
 * a `parent`, while others (`CapBlock`) never have a `next`.
 */
export type StackableBlock = Exclude<
    | StackBlock
    | CBlock
    | CapBlock
    | HatBlock
    ,
    ShadowBlock
>;

export function isStackableBlock(b: ScratchBlock): b is StackableBlock {
    return !isShadowBlock(b) && (
        isStackBlock(b) ||
        isCBlock(b) ||
        isCapBlock(b) ||
        isHatBlock(b)
    );
}

export type StackableBlockOpcode = typeof stackableBlockOpcodes[number];

export const stackableBlockOpcodes = Object.freeze([
    ...stackBlockOpcodes,
    ...cBlockOpcodes,
    ...capBlockOpcodes,
    ...hatBlockOpcodes,
].filter((opcode) => !shadowBlockOpcodes.includes(opcode as ShadowBlockOpcode)));
