import {CapBlockOpcode, capBlockOpcodes, Opcode} from "../Opcode";
import {Block, isBlock, ScratchBlock} from "../Block";
import {ControlStop} from "../categories/Control";

/**
 * Cap Blocks end a script. These can only be placed below stack blocks, C blocks, or hat blocks.
 *
 * https://en.scratch-wiki.info/wiki/Cap_Block
 */
export interface CapBlock extends Block {
    opcode: CapBlockOpcode;
}

/**
 * Tells whether the given block is a cap block.
 * https://en.scratch-wiki.info/wiki/Cap_Block
 *
 * @param block the block to check
 */
export function isCapBlock(block: ScratchBlock): block is CapBlock {
    if (!isBlock(block)) {
        return false;
    }

    if (block.opcode !== "control_stop") {
        return (capBlockOpcodes as readonly Opcode[]).includes(block.opcode);
    }

    // Stop blocks can change their shape depending on the selected stop option.
    const stopBlock = block as ControlStop;
    const [stopOption] = stopBlock.fields.STOP_OPTION;
    return stopOption !== "other scripts in sprite";
}
