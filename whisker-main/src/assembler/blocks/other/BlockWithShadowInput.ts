// https://en.scratch-wiki.info/wiki/Dropdown_Menu#Accept_Block_Inputs

import {Block} from "../Block";
import {BlockWithShadowInputOpcode} from "../Opcode";

// A block that has a shadow block as input
// https://en.scratch-wiki.info/wiki/Dropdown_Menu#Do_Not_Accept_Block_Inputs
export interface BlockWithShadowInput extends Block {
    opcode: BlockWithShadowInputOpcode;
}
