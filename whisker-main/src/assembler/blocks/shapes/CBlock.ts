import {cBlockOpcodes, Opcode} from "../Opcode";
import {isBlock} from "../Block";
import {ControlForever, ControlIf, ControlIfElse, ControlRepeat, ControlRepeatUntil} from "../categories/Control";

/**
 * A C block is a block that is shaped like a "C", so other blocks can fit inside it. These blocks perform the
 * conditions and loops.
 *
 * https://en.scratch-wiki.info/wiki/C_Block
 */
export type CBlock =
    | ControlRepeat
    | ControlRepeatUntil
    | ControlIf
    | ControlIfElse
    | ControlForever
    ;

/**
 * Tells whether the given block is a C-block.
 * https://en.scratch-wiki.info/wiki/C_Block
 *
 * @param o the block to check
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function isCBlock(o: {}): o is CBlock {
    return isBlock(o) && (cBlockOpcodes as Readonly<Array<Opcode>>).includes(o.opcode);
}
