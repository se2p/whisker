import {Block, BlockID, isBlock, isTopLevelBlock, ScratchBlock, VarList} from "./blocks/Block";
import {Target} from "./project/Target";
import {deepCopy} from "./utils/Objects";
import {canonicalizeInputs, WrappedProject} from "./utils/helpers";
import {Input, InputKey, primitiveInputTypes} from "./blocks/Inputs";
import {NoSuchBlockError} from "./utils/errors";
import {Pair} from "../whisker/utils/Pair";
import {getBlockIDs} from "./utils/blocks";

export type Node = BlockNode | VarListNode;
export type WrappedTarget = Target<BlockNode, VarListNode, VarListNode>;

abstract class BlockWrapper<B extends ScratchBlock, N extends Node> implements Iterable<N> {
    protected readonly _blockID: BlockID;
    protected readonly _block: B;
    protected readonly _target: Readonly<WrappedTarget>;
    protected readonly _project: Readonly<WrappedProject>;

    protected constructor(
        blockID: BlockID,
        block: B,
        target: Readonly<WrappedTarget>,
        project: Readonly<WrappedProject>
    ) {
        this._blockID = blockID;
        this._block = deepCopy<B>(block);
        this._target = target;
        this._project = project;
    }

    public get blockID(): BlockID {
        return this._blockID;
    }

    public get block(): B {
        return this._block;
    }

    public get target(): WrappedTarget {
        return this._target;
    }

    public abstract getParent(): N | null;

    public abstract getNext(): N | null;

    /**
     * Returns the block IDs of the node's `parent` and `next` block (if any), plus the block IDs of the
     * node's inputs (if any).
     *
     * @see _getInputBlockIDs
     */
    public abstract getReferencedBlockIDs(): Array<BlockID>;

    public abstract hasNext(): boolean;

    public abstract hasParent(): boolean;

    public abstract hasInputNode(input: N): InputKey | null;

    public abstract isTopLevel(): boolean;

    public abstract isShadow(): boolean;

    public toJSON(): B {
        return this.block;
    }

    public abstract toString(): string;

    public abstract [Symbol.iterator](): Iterator<N>;
}

/**
 * A wrapper class for `Block` that provides an AST-like API, and further convenience functions.
 */
export class BlockNode extends BlockWrapper<Block, BlockNode> {
    constructor(blockID: BlockID, block: Block, target: Readonly<WrappedTarget>, project: Readonly<WrappedProject>) {
        super(blockID, canonicalizeInputs(block), target, project);
    }

    override hasParent(): boolean {
        return this.block.parent !== null;
    }

    override getParent(): BlockNode | null {
        if (!this.hasParent()) {
            return null;
        }

        return this._getBlockNode(this.block.parent);
    }
    
    override hasNext(): boolean {
        return this.block.next !== null;
    }

    override getNext(): BlockNode | null {
        if (!this.hasNext()) {
            return null;
        }

        return this._getBlockNode(this.block.next);
    }

    protected _getBlockNode(blockID: string): BlockNode {
        if (!(blockID in this.target.blocks)) {
            throw new NoSuchBlockError(blockID);
        }

        const block = this.target.blocks[blockID];

        if (block instanceof VarListNode) {
            // Should not happen under normal circumstances...
            throw new Error(`The given ID "${blockID}" must point to a ${BlockNode.name}`);
        }

        return block;
    }

    override getReferencedBlockIDs(): Array<BlockID> {
        const result = new Array<BlockID>();

        if (this.block.parent) {
            result.push(this.block.parent);
        }

        if (this.block.next) {
            result.push(this.block.next);
        }

        result.push(...this._getInputBlockIDs(true, false));

        return result;
    }

    private _getInputBlockIDs(collectSubstacks: boolean, skipShadow: boolean): Array<BlockID> {
        const blockIDs = Array<BlockID>();

        for (const [key, input] of Object.entries(this.block.inputs) as Array<Pair<InputKey, Input>>) {
            if (!collectSubstacks && (key === "SUBSTACK" || key === "SUBSTACK2")) {
                continue;
            }

            for (const blockID of getBlockIDs(input)) {
                if (skipShadow && this._getBlockNode(blockID).isShadow()) {
                    continue;
                }

                blockIDs.push(blockID);
            }
        }

        return blockIDs;
    }

    override hasInputNode(input: BlockNode): InputKey | null {
        if (input.target.name !== this.target.name) {
            return null;
        }

        const inputs = Object.entries(this.block.inputs) as Array<Pair<InputKey, Input>>;
        const keys = inputs.filter(([, [, blockID]]) => blockID === input.blockID).map(([key]) => key);
        return keys.length === 0 ? null : keys[0];
    }

    override isTopLevel(): boolean {
        return isTopLevelBlock(this.block);
    }

    override isShadow(): boolean {
        return this.block.shadow;
    }

    override toString(): string {
        return `${this.block.opcode} ("${this.blockID}")`;
    }

    override [Symbol.iterator](): Iterator<BlockNode> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let current: BlockNode = this;

        return {
            next: () => {
                if (current) {
                    const result = {done: false, value: current};
                    current = current.getNext();
                    return result;
                }

                return {
                    done: true,
                    value: null,
                };
            }
        };
    }
}

export class VarListNode extends BlockWrapper<VarList, VarListNode> {
    constructor(blockID: BlockID, block: VarList, target: Readonly<WrappedTarget>, project: Readonly<WrappedProject>) {
        super(blockID, block, target, project);
    }

    override getParent(): null {
        return null;
    }

    override getNext(): null {
        return null;
    }

    override getReferencedBlockIDs(): [] {
        return [];
    }

    override hasParent(): false {
        return false;
    }

    override hasNext(): false {
        return false;
    }

    override hasInputNode(): null {
        return null;
    }

    override isTopLevel(): true {
        return true;
    }

    override isShadow(): false {
        return false;
    }

    override toString(): string {
        const [inputType] = this.block;
        const name = inputType === primitiveInputTypes.variable ? "variable" : "list";
        return `${this.blockID} (toplevel ${name} block)`;
    }

    override [Symbol.iterator](): Iterator<VarListNode> {
        let done = false;

        return {
            next: () => {
                if (done) {
                    return {done, value: null};
                }

                const result = {done, value: this};
                done = true;
                return result;
            }
        };
    }
}

export function node(
    blockID: BlockID,
    block: ScratchBlock,
    target: Readonly<WrappedTarget>,
    project: Readonly<WrappedProject>,
): Node {
    return isBlock(block) ?
        new BlockNode(blockID, block, target, project) :
        new VarListNode(blockID, block, target, project);
}
