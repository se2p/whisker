import {Costume, Sound} from "./Asset";
import {Comment} from "./Comment";
import {EmptyObject} from "../utils/Objects";
import {Block, BlockID} from "../blocks/Block";
import {TopLevelListBlock, TopLevelVariableBlock} from "../blocks/Inputs";
import {List, Variable} from "../blocks/categories/Data";
import {STAGE_NAME} from "../utils/selectors";
import {rotationStyles} from "../blocks/categories/Motion";

type Message = string;
type None = EmptyObject;

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

/**
 * The stage is the background of the project, but can have scripts, backdrops (costumes), and sounds, similar to a
 * sprite. All sprites have a particular position on the stage. However, no sprites can move behind the stage — the
 * stage is always at the back layer.
 *
 * https://en.scratch-wiki.info/wiki/Stage
 */
export interface Stage<B = Block,
    V = TopLevelVariableBlock,
    L = TopLevelListBlock>
    extends Target<B, V, L> {

    /**
     * Always true.
     */
    isStage: true;

    /**
     * Always "Stage".
     */
    name: "Stage";

    /**
     * Always 0.
     */
    layerOrder: 0;

    /**
     * The tempo in a project controls how fast or slow the instrumental blocks in Scratch play notes and drum beats.
     * Tempo is represented as beats per minute (bpm): 60 bpm implies one beat will be played each second. The higher
     * the value, the faster they play, and the lower, the slower they play.
     */
    tempo: number;

    /**
     * Determines if video is visible on the stage and if it is flipped. Has no effect if the project does not use an
     * extension with video input.
     */
    videoState: "on" | "off" | "on-flipped";

    /**
     * The video transparency. Defaults to 50. Has no effect if videoState is "off" or if the project does not use an
     * extension with video input.
     */
    videoTransparency: number;

    /**
     * The language of the Text to Speech extension. Defaults to the editor language.
     */
    textToSpeechLanguage: string;
}

/**
 * A sprite is an object or character in Scratch that can be programmed to perform actions based on scripts in a project
 * using blocks. Each sprite has its own scripts, costumes, and sounds, and can move on its own.
 *
 * https://en.scratch-wiki.info/wiki/Sprite
 */
export interface Sprite<B = Block,
    V = TopLevelVariableBlock,
    L = TopLevelListBlock>
    extends Target<B, V, L> {

    /**
     * The name of the sprite. Attention: Can also be "Stage", so always check the `isStage` property, too. Fun fact:
     * Because the "sensing_of_object_menu" block uses the string "_stage_" to denote the stage, a sprite cannot have
     * the name "_stage_". You can try this in the Scratch IDE and see for yourself :)
     */
    name: Exclude<TargetName, typeof STAGE_NAME>;

    /**
     * Always false.
     */
    isStage: false;

    /**
     * Always empty.
     */
    broadcasts: None;

    /**
     * True if the sprite is visible and false otherwise. Defaults to true.
     */
    visible: boolean;

    /**
     * The x-coordinate. Defaults to 0.
     */
    x: number;

    /**
     * The y-coordinate. Defaults to 0.
     */
    y: number;

    /**
     * The sprite's size as a percentage. Defaults to 100.
     */
    size: number;

    /**
     * The sprite's direction in degrees clockwise from up. Defaults to 90.
     */
    direction: number;

    /**
     * True if the sprite is draggable and false otherwise. Defaults to false.
     */
    draggable: boolean;

    /**
     * The rotation style.
     * - "All around" rotation visually points the sprite in the direction it is facing. However, this will make the
     *   sprite appear upside-down if it is facing left.
     * - The "left-right" rotation style flips the sprite right or left. If the sprite's direction is between 0° and
     *   180°, the costume will not appear rotated. If the sprite's direction is between 0° and -180°, the costume will
     *   be mirrored around the y-axis.
     * - If a sprite's rotation style is set to "don't rotate", the visual appearance will not change as it changes
     *   direction.
     *
     * https://en.scratch-wiki.info/wiki/Rotation_Style
     */
    rotationStyle: typeof rotationStyles[number];
}
