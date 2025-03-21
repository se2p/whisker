import {Block, isBlock, ScratchBlock, VarList} from "../Block";
import {
    BooleanReporterBlockOpcode,
    booleanReporterBlockOpcodes,
    NumberReporterBlockOpcode,
    numberStringReporterBlockOpcodes,
    Opcode,
    ReporterBlockOpcode,
    reporterBlockOpcodes,
    StringReporterBlockOpcode
} from "../Opcode";
import {isTopLevelDataBlock} from "../Inputs";
import {ShadowBlock} from "../other/ShadowBlock";

type None = Record<string, never>;

/**
 * A reporter block is a block that "reports" a value, such as the current "x position" of a sprite, the current
 * "username", mathematical operations such as "+", and of course custom variables. The reported values can be anything,
 * from numbers to strings. Unlike a stack block, which changes something on the stage, plays a sound, stops the script,
 * or changes a variable, reporter blocks cannot be placed directly above or below another block. Instead, they are
 * dropped into a number, text, or drop-down input; then, when Scratch runs the block into which the reporter block has
 * been dropped, it will first run the reporter block to find the value of the input. Reporter blocks can have inputs
 * too (represented by the "fields" property of the "Block" interface), which may themselves be other reporter blocks.
 * Boolean Blocks are a special kind of reporter block that reports either "true" or "false".
 *
 * https://en.scratch-wiki.info/wiki/Reporter_Block
 * https://en.scratch-wiki.info/wiki/Scratch_File_Format#Blocks
 */
export type ReporterBlock =
    | RegularReporterBlock
    | ShadowBlock
    ;

export type RegularReporterBlock =
    | BooleanReporterBlock
    | StringNumberReporterBlock
    | VarList
    ;

export type StringNumberReporterBlock =
    | StringReporterBlock
    | NumberReporterBlock
    ;

/**
 * In contrast to custom variables or lists that the user has to define himself, these blocks are already predefined by
 * the Scratch runtime. For example: "x position", "volume", or "pick random (x) to (y)".
 */
interface PredefinedReporter extends Block {
    opcode: ReporterBlockOpcode;
    next: null;
    inputs: None;
}

export interface BooleanReporterBlock extends PredefinedReporter {
    opcode: BooleanReporterBlockOpcode;
}

export interface NumberReporterBlock extends PredefinedReporter {
    opcode: NumberReporterBlockOpcode;
}

export interface StringReporterBlock extends PredefinedReporter {
    opcode: StringReporterBlockOpcode;
}

type Variable = Record<"VALUE", [
    variableName: string,
    blockID: null
]>;

type CustomReporter = PredefinedReporter;

export interface ArgumentReporterStringNumber extends CustomReporter {
    opcode: "argument_reporter_string_number";
    fields: Variable;
}

export interface ArgumentReporterBoolean extends CustomReporter {
    opcode: "argument_reporter_boolean";
    fields: Variable;
}

/**
 * Tells whether the given block is a reporter block.
 * https://en.scratch-wiki.info/wiki/Reporter_Block
 *
 * @param block the block to check
 */
export function isStringNumberReporterBlock(block: ScratchBlock): block is StringNumberReporterBlock {
    if (isTopLevelDataBlock(block)) {
        // Note: a top-level list block reports the contents of the list as string.
        return true;
    }

    return (numberStringReporterBlockOpcodes as Readonly<Array<Opcode>>).includes(block.opcode);
}

/**
 * Tells whether the given block is a boolean block.
 * https://en.scratch-wiki.info/wiki/Boolean_Block
 *
 * @param block the block to check
 */
export function isBooleanReporterBlock(block: ScratchBlock): block is BooleanReporterBlock {
    return isBlock(block) && (booleanReporterBlockOpcodes as Readonly<Array<Opcode>>).includes(block.opcode);
}

export function isReporterBlock(block: ScratchBlock): block is RegularReporterBlock {
    if (isTopLevelDataBlock(block)) {
        return true;
    }

    return (reporterBlockOpcodes as Readonly<Array<Opcode>>).includes(block.opcode);
}
