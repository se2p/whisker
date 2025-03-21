import {Block, BlockID, isBlock, isTopLevelBlock, ScratchBlock, TopLevelBlock} from "../Block";
import {Opcode, ShadowBlockOpcode, shadowBlockOpcodes} from "../Opcode";

/**
 * A shadow block is a reporter in an input for which one can enter or pick a value, and which cannot be dragged around
 * but can be replaced by a normal reporter. Scratch internally considers these to be blocks, although they are not
 * usually thought of as such. (These notions come from Blockly, which Scratch Blocks is based on.)
 *
 * Shadow blocks are placeholder blocks that perform several functions:
 *  - They indicate the default values for their parent block.
 *  - They allow users to type values directly without needing to fetch a number or string block.
 *  - Unlike a regular block, they get replaced if the user drops a block on top of them.
 *  - They inform the user of the type of value expected.
 *
 * Note: Shadow blocks may not include a variable field or have children that are not also shadows.
 *
 * https://en.scratch-wiki.info/wiki/Scratch_File_Format#Blocks
 * https://developers.google.com/blockly/guides/configure/web/toolbox#shadow_blocks
 */
export interface ShadowBlock extends Block {
    opcode: ShadowBlockOpcode;
    next: null;
    parent: BlockID | null;
    shadow: true;
}

export interface ObscuredShadowBlock extends Block, TopLevelBlock {
    parent: null;
    topLevel: true;
}

export function isShadowBlock(b: ScratchBlock): b is ShadowBlock {
    return isBlock(b)
        && (shadowBlockOpcodes as Readonly<Array<Opcode>>).includes(b.opcode)
        && b.next === null
        && b.shadow === true;
}

export function isObscuredShadowBlock(b: ScratchBlock): b is ObscuredShadowBlock {
    return isShadowBlock(b) && isTopLevelBlock(b);
}
