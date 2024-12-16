import {ScratchVMBlock} from "./ScratchVMBlock";

/**
 * Represents a snippet (one or more interlinked statement blocks) of a Scratch script.
 *
 * @typedef {Object} ScratchScriptSnippet
 * @property {ScratchVMBlock[]} blocks - An array of blocks (both statement blocks and argument blocks) in the snippet.
 * @property {ScratchVMBlock} first - The first block in the snippet.
 * @property {ScratchVMBlock} last - The last block in the snippet.
 */
export type ScratchScriptSnippet = {
   blocks: Array<ScratchVMBlock>,
   first: ScratchVMBlock,
   last: ScratchVMBlock
};
