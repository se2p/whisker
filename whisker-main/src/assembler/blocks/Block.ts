export type BlockID = string;

/**
 * Blocks are puzzle-piece shapes that are used to create code in the Scratch editor. The blocks connect to each other
 * vertically like a jigsaw puzzle, where each block type (hat, stack, reporter, boolean, or cap) has its own shape, and
 * a specially shaped slot for it to be inserted into, which prevents syntax errors. Series of connected blocks are
 * called scripts. Scripts are implicitly defined via the "next" and "parent" relations of the blocks that constitute
 * them.
 *
 * https://en.scratch-wiki.info/wiki/Blocks
 */
export interface Block {

}
