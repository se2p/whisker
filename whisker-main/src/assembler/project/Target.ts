import {Block} from "../blocks/Block";
import {TopLevelListBlock, TopLevelVariableBlock} from "../blocks/Inputs";

/**
 * A target is the stage or a sprite.
 *
 * https://en.scratch-wiki.info/wiki/Scratch_File_Format#Targets
 */
export interface Target<
    B = Block,
    V = TopLevelVariableBlock,
    L = TopLevelListBlock,
> {
}
