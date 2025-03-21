import {HatBlockOpcode, hatBlockOpcodes, Opcode} from "../Opcode";
import {isBlock, ScratchBlock, TopLevelBlock} from "../Block";

/**
 * Hat blocks are the blocks that start a script when a specific event occurs. They are shaped with a rounded top and a
 * bump at the bottom — this is so you can only place blocks below them.
 *
 * https://en.scratch-wiki.info/wiki/Hat_Block
 */
export interface HatBlock extends TopLevelBlock {
    opcode: HatBlockOpcode;
    shadow: false;
}

/**
 * Tells whether the given block is a hat block.
 * https://en.scratch-wiki.info/wiki/Hat_Block
 *
 * @param o the block to check
 */
export function isHatBlock(o: ScratchBlock): o is HatBlock {
    return isBlock(o) && (hatBlockOpcodes as Readonly<Array<Opcode>>).includes(o.opcode);
}
