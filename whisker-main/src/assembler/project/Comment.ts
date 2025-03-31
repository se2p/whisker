/**
 * Comments in a Scratch program are adjustable text boxes that can be attached to blocks, or left floating. The comment
 * boxes can be adjusted both horizontally and vertically, dragged around the Scripts Area, and deleted.
 *
 * https://en.scratch-wiki.info/wiki/Comment_(programming_feature)
 */
export interface Comment {

    /**
     * The ID of the block the comment is attached to, or undefined if the comment is floating.
     */
    blockID?: string;

    /**
     * The x-coordinate of the comment in the code area. Might be undefined.
     */
    x?: number;

    /**
     * The y-coordinate of the comment in the code area. Might be undefined.
     */
    y?: number;

    /**
     * The width of the comment text box.
     */
    width: number;

    /**
     * The height of the comment text box.
     */
    height: number;

    /**
     * True if the comment is collapsed and false otherwise.
     */
    minimized: boolean;

    /**
     * The comment text.
     */
    text: string;
}
