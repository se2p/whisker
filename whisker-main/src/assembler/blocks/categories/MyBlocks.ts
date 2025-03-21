import {Block, BlockID, TopLevelBlock} from "../Block";
import {Input, UnobscuredShadowInput} from "../Inputs";
import {CustomBlockOpcode, customBlockOpcodes, Opcode} from "../Opcode";
import {ShadowBlock} from "../other/ShadowBlock";
import {EmptyObject} from "../../utils/Objects";

type None = EmptyObject;

/**
 * Represents a custom block.
 */
export interface CustomBlock extends Block {
    opcode: CustomBlockOpcode;
}

/**
 * The definition of a custom block.
 */
export interface ProceduresDefinition extends TopLevelBlock, CustomBlock {
    topLevel: true;

    parent: null;

    opcode: "procedures_definition";

    /**
     * Refers to the first "real" block in the "body" of the definition.
     */
    next: BlockID;

    /**
     * Reference to ProceduresPrototype. It contains the proccode of the custom block and its arguments.
     */
    inputs: { custom_block: UnobscuredShadowInput };

    fields: None;
}

/**
 * Dummy block that holds information about a custom block's "signature" and inputs.
 */
export interface ProceduresPrototype extends CustomBlock, ShadowBlock {
    opcode: "procedures_prototype";

    shadow: true;

    /**
     * Always null.
     */
    next: null;

    /**
     * Reference to the ProceduresDefinition this ProceduresPrototype belongs to.
     */
    parent: BlockID;

    /**
     * The inputs of the custom block.
     */
    inputs: { [argumentID: string]: UnobscuredShadowInput };

    /**
     * Includes information about the proccode of the custom block, its inputs, etc.
     */
    mutation: Mutation;
}

/**
 * The invocation of a custom block.
 */
export interface ProceduresCall extends CustomBlock {
    opcode: "procedures_call";

    /**
     * Includes information about the proccode of the custom block, its inputs, etc. There might be multiple custom
     * blocks with the same proccode. The correct one is found by scanning the project.json from top to bottom, and
     * picking the first occurrence of a ProceduresPrototype block that has the same mutation object as the
     * ProceduresCall block. Using the "parent" property of the ProceduresPrototype block, one can navigate to the
     * corresponding ProceduresDefinition block. In turn, its "next" property then refers to the blocks that are
     * executed when the custom block is called.
     */
    mutation: Mutation;

    /**
     * The arguments the custom block is invoked with.
     */
    inputs: { [argumentID: string]: Input };

    fields: None;

    shadow: false;
}

/**
 * String representation of a boolean ("true" or "false"), or "null".
 */
type BooleanString = `${boolean}` | "null";

/**
 * Mutations are present on blocks where the opcode property is equal to "procedures_call" (i.e., the invocation of
 * a custom block) or "procedures_prototype" (i.e., the inner part of a custom block definition).
 */
export interface Mutation {

    /**
     * Always equal to "mutation".
     */
    tagName: "mutation";

    /**
     * The name of the custom block (in analogy to the "opcode" of predefined blocks) including inputs: %s for string
     * input, %n for number inputs and %b for boolean inputs. For example: "Spawn House %n at %n padding %n %n".
     * Note that Scratch allows multiple different custom blocks with the same proccode. If this is a ProceduresCall
     * block, one finds the corersponding ProceduresDefinition and ProceduresPrototype block by looking for the first
     * occurrence of the proccode in the project.json file.
     */
    proccode?: string;

    /**
     * String representation of an array of the names of the arguments. This is only present when the block has an
     * opcode of "procedures_prototype". For example: "[\"tileID\",\"xPos\",\"left\",\"right\"]". The number of names
     * should match the number of arguments specified in "proccode".
     */
    argumentnames?: string;

    /**
     * String representation of an array of the ids of the arguments; these can also be found in the "input" property
     * of the main block. For exmample: "[\"input0\",\"input1\",\"input2\",\"input3\"]". The number of IDs should match
     * tne number of arguments specified in "proccode".
     */
    argumentids?: string;

    /**
     * An array of the defaults of the arguments; for string arguments, this is an empty string, for number arguments
     * it is 1, and for boolean arguments it is false. This is only present when the block has an opcode of
     * "procedures_prototype".
     */
    argumentdefaults?: string;

    /**
     * Whether to run the block without screen refresh or not.
     */
    warp?: BooleanString;

    /**
     * Seems to always be an empty array.
     */
    children: [];
}

/**
 * Tells whether the given block is a custom block.
 * https://en.scratch-wiki.info/wiki/My_Blocks
 *
 * @param block the block to check
 */
export function isCustomBlock(block: Block): block is CustomBlock {
    return (customBlockOpcodes as readonly Opcode[]).includes(block.opcode);
}
