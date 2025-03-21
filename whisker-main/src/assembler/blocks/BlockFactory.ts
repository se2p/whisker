import {Blocks} from "../project/Target";
import {Block} from "./Block";
import {BlockMeta, emptyBlockMeta} from "../utils/meta";

export function blockMeta(blocks: Blocks): BlockMeta {
    const [blockID] = Object.entries(blocks).find(([_blockID, block]) => (block as Block).topLevel);
    const meta = emptyBlockMeta(blockID, blockID);
    meta.blocks = blocks;
    return meta;
}
