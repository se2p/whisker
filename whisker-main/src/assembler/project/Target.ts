import {Block, BlockID} from "../blocks/Block";
import {TopLevelListBlock, TopLevelVariableBlock} from "../blocks/Inputs";
import {List, Variable} from "../blocks/categories/Data";
import {Costume, Sound} from "./Asset";
import {Comment} from "./Comment";
import {STAGE_NAME} from "../utils/selectors";

type Message = string;

export interface Blocks<B = Block,
    V = TopLevelVariableBlock,
    L = TopLevelListBlock> {
    [blockID: BlockID]: B | V | L;
}

export type VariableID = string;

export interface Variables {
    [variableID: VariableID]: Variable;
}

export type ListID = string;

export interface Lists {
    [listID: ListID]: List;
}

export type BroadcastID = string;

export interface Broadcasts {
    [broadcastID: BroadcastID]: Message;
}

export interface Comments {
    [commentID: string]: Comment;
}

/**
 * The name of a target.
 */
export type TargetName = string | typeof STAGE_NAME;

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

    /**
     * True if this is the stage and false otherwise. Defaults to false.
     */
    isStage: boolean;

    /**
     * The name of the target. Always "Stage" for the stage. If not provided, the target will not be loaded.
     */
    name: TargetName;

    /**
     * An object associating IDs with variables.
     */
    variables: Variables;

    /**
     * An object associating IDs with arrays representing lists. The first element of the array is the list name and
     * the second is the list as an array.
     */
    lists: Lists;

    /**
     * An object associating IDs with broadcast names (messages). Normally only non-empty in the stage.
     */
    broadcasts: Broadcasts;

    /**
     * An object associating IDs with blocks.
     */
    blocks: Blocks<B, V, L>;

    /**
     * An object associating IDs with comments.
     */
    comments: Comments;

    /**
     * An array of costumes.
     */
    costumes: Costume[];

    /**
     * The index of the currently active costume in the "costumes" array.
     */
    currentCostume: number;

    /**
     * An array of sounds.
     */
    sounds: Sound[];

    /**
     * Volume is a local value given to all sprites and the Stage. The value effects the instrument blocks and the
     * audio blocks. The less volume, the quieter all sounds played on that sprite or the stage. The loudest the volume
     * can reach is 100, and the minimum is 0.
     */
    volume: number;

    /**
     * A sprite's layer is the justification of sprites being shown in front or behind each other. A sprite with a lower
     * layer value is shown behind a sprite with a higher layer value, so a sprite with a layer of 1 appears behind all
     * other sprites. The stage has a layer value of 0.
     */
    layerOrder: number;
}
