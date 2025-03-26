import {Block} from "../Block";
import {BlockWithFieldOpcode} from "../Opcode";

// A block that has a field
// https://en.scratch-wiki.info/wiki/Dropdown_Menu#Do_Not_Accept_Block_Inputs
export interface BlockWithField extends Block {
    opcode: BlockWithFieldOpcode;
}
