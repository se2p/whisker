import {Opcode, StackBlockOpcode, stackBlockOpcodes} from "../Opcode";
import {Block, isBlock, ScratchBlock} from "../Block";
import {ControlStop} from "../categories/Control";

/**
 * A Stack block is a rectangular block that is shaped to fit above **and** below other blocks. Stack blocks make up the
 * majority of the blocks available in Scratch.
 *
 * https://en.scratch-wiki.info/wiki/Stack_Block
 */
export interface StackBlock extends Block {
    opcode: StackBlockOpcode;
}

/**
 * Tells whether the given block is a stack block.
 * https://en.scratch-wiki.info/wiki/Stack_Block
 *
 * @param block the block to check
 */
export function isStackBlock(block: ScratchBlock): block is StackBlock {
    if (!isBlock(block)) {
        return false;
    }

    if (block.opcode !== "control_stop") {
        return (stackBlockOpcodes as Readonly<Array<Opcode>>).includes(block.opcode);
    }

    // Stop blocks can change their shape depending on the selected stop option.
    const stopBlock = block as ControlStop;
    const [stopOption] = stopBlock.fields.STOP_OPTION;
    return stopOption === "other scripts in sprite";
}
