import {
    Block,
    BlockID,
    isBlock,
    isStackableBlock,
    isTopLevelBlock,
    ScratchBlock,
    TopLevelBlock,
    VarList
} from "./blocks/Block";
import {Target} from "./project/Target";
import {deepCopy} from "./utils/Objects";
import {canonicalizeInputs, WrappedProject} from "./utils/helpers";
import {Input, InputKey, primitiveInputTypes} from "./blocks/Inputs";
import {NoSuchBlockError, NoSuchKeyError} from "./utils/errors";
import {Pair} from "../whisker/utils/Pair";
import {getBlockIDs, supportsInput} from "./utils/blocks";
import {isHatBlock} from "./blocks/shapes/HatBlock";
import {isStackBlock} from "./blocks/shapes/StackBlock";
import {isCBlock} from "./blocks/shapes/CBlock";
import {isCapBlock} from "./blocks/shapes/CapBlock";
import {isMotionBlock} from "./blocks/categories/Motion";
import {isReporterBlock} from "./blocks/shapes/Reporter";
import {Field, FieldKey} from "./blocks/Fields";

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

    get blockID(): BlockID {
        return this._blockID;
    }

    get block(): B {
        return this._block;
    }

    get target(): WrappedTarget {
        return this._target;
    }

    abstract getScriptRoot(): N;

    abstract getStackRoot(): N | null;

    abstract getParent(): N | null;

    abstract getParentID(): BlockID | null;

    abstract getNext(): N | null;

    abstract getNextID(): BlockID | null;

    /**
     * Starting at this node, follows the chain of `next` nodes to the very end of the stack, and returns an array with
     * the block IDs of all nodes encountered, in traversal order. The parameter `skipSelf` controls whether the ID of
     * the starting node is excluded.
     *
     * @param skipSelf whether to exclude the block ID of the start noode
     */
    abstract getNextIDs(skipSelf: boolean): Array<BlockID>;

    /**
     * Follows the chain of `next` blocks until it points to `null`, and returns the ID of the last block encountered.
     */
    abstract getLastID(): BlockID;

    abstract getX(): number | null;

    /**
     * Returns the block IDs of the node's `parent` and `next` block (if any), plus the block IDs of the
     * node's inputs (if any).
     *
     * @see _getInputBlockIDs
     */
    abstract getReferencedBlockIDs(): Array<BlockID>;

    /**
     * Tells whether this block is the root block (i.e., the first block) of a script or a substack.
     */
    abstract isRootOfScriptOrSubstack(): boolean;

    abstract isRootOfSubstack(): boolean;

    abstract isTosInSubstackOf(parent: N): boolean;

    abstract isTosInSubstack2Of(parent: N): boolean;

    abstract hasNext(): boolean;

    abstract hasParent(): boolean;

    abstract hasInputNode(input: N): InputKey | null;

    abstract isTopLevel(): boolean;

    abstract isHatBlock(): boolean;

    abstract isCapBlock(): boolean;

    abstract isCBlock(): boolean;

    abstract isStackBlock(): boolean;

    abstract isStackable(): boolean;

    abstract isReporterBlock(): boolean;

    abstract isMotionBlock(): boolean;

    abstract isShadow(): boolean;

    isObscured(): boolean {
        // A shadow-block can be  obscured by a reporter block that was dropped on top of it. Then, the shadow-block
        // has the "topLevel" attribute set to true. See also the JSDoc for the ObscuredShadowInput type.
        return this.isShadow() && this.isTopLevel();
    }

    /**
     * Tells whether the current block can be live code (i.e., not dead code). In general, blocks of unconnected scripts
     * are always dead code. All other blocks can be live code.
     */
    abstract canBeLive(): boolean;

    /**
     * Tells whether this node has a substack.
     */
    abstract hasSubstack(): boolean;

    /**
     * Tells whether this node has a substack with the given node as its "tos" (top of substack).
     *
     * @param tos the tos node of the substack
     */
    abstract hasSubstack(tos: N): boolean;

    /**
     * Tells whether this node has a substack2.
     */
    abstract hasSubstack2(): boolean;

    /**
     * Tells whether this node has a substack2 with the given node as its "tos" (top of substack).
     *
     * @param tos the tos node of the substack2
     */
    abstract hasSubstack2(tos: N): boolean;

    abstract getInputNode(key: InputKey): N | null;

    abstract getInputNodes(skipSubstack: boolean): Array<N>;

    abstract supportsInput(key: InputKey): boolean;

    abstract isInputOf(parent: N): InputKey | null;

    abstract getFieldKeys(): Array<FieldKey>;

    abstract hasField(key: FieldKey): boolean;

    abstract getField(key: FieldKey): Field;

    toJSON(): B {
        return this.block;
    }

    abstract toString(): string;

    abstract [Symbol.iterator](): Iterator<N>;
}

/**
 * A wrapper class for `Block` that provides an AST-like API, and further convenience functions.
 */
export class BlockNode extends BlockWrapper<Block, BlockNode> {
    constructor(blockID: BlockID, block: Block, target: Readonly<WrappedTarget>, project: Readonly<WrappedProject>) {
        super(blockID, canonicalizeInputs(block), target, project);
    }

    override getX(): number | null {
        if (!this.isTopLevel()){
            return null;
        }

        if (this.isShadow()) {
            return null;
        }

        return (this.block as TopLevelBlock).x;
    }

    getScriptRoot(): BlockNode {
        if (this.isTopLevel()) {
            if (this.isShadow()) {
                return null;
            }

            return this;
        }

        return this.getParent().getScriptRoot();
    }

    override getStackRoot(): BlockNode | null {
        if (this.isRootOfScriptOrSubstack()) {
            return this;
        }

        return this.hasParent()
            ? this.getParent().getStackRoot()
            : null
            ;
    }

    override isRootOfSubstack(): boolean {
        return this.isTosInSubstackOf(this.getParent()) || this.isTosInSubstack2Of(this.getParent());
    }

    override isRootOfScriptOrSubstack(): boolean {
        /*
         * A block is the root of a script or SUBSTACK(2) if
         * (1) it is the first block in a script (it is toplevel), but it is not an obscured oval-shaped drop-down menu
         *     (those are toplevel, too).
         * (2) it is the first block of a SUBSTACK(2).
         */
        return (
            this.isTopLevel() && !this.isShadow() || // (1)
            this.isRootOfSubstack()                  // (2)
        );
    }

    override isTosInSubstackOf(parent: BlockNode): boolean {
        return parent === null ? false : parent.hasSubstack(this);
    }

    override isTosInSubstack2Of(parent: BlockNode): boolean {
        return parent === null ? false : parent.hasSubstack2(this);
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

    override getParentID(): BlockID | null {
        return this.block.parent;
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

    override getNextID(): BlockID | null {
        return this.block.next;
    }

    override getNextIDs(skipSelf: boolean): Array<BlockID> {
        const ids = [...this].map(({blockID}) => blockID);
        return skipSelf ? ids.slice(1) : ids;
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

    getLast(): BlockNode {
        return [...this].pop();
    }

    override getLastID(): BlockID | null {
        return this.getLast().blockID;
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

    override isInputOf(parent: BlockNode): InputKey | null {
        return parent.hasInputNode(this);
    }

    override isTopLevel(): boolean {
        return isTopLevelBlock(this.block);
    }

    override isHatBlock(): boolean {
        return isHatBlock(this.block);
    }

    override isCapBlock(): boolean {
        return isCapBlock(this.block);
    }

    override isCBlock(): boolean {
        return isCBlock(this.block);
    }

    override isStackBlock(): boolean {
        return isStackBlock(this.block);
    }

    override isStackable(): boolean {
        return isStackableBlock(this.block);
    }

    override isMotionBlock(): boolean {
        return isMotionBlock(this.block);
    }

    override isReporterBlock(): boolean {
        return isReporterBlock(this.block);
    }

    override isShadow(): boolean {
        return this.block.shadow;
    }

    override canBeLive(): boolean {
        if (this.isHatBlock()) {
            return true;
        }

        return this.hasParent() && this.getParent().canBeLive();
    }

    override hasSubstack(substack?: BlockNode): boolean {
        if (!substack) {
            return this.block.inputs?.SUBSTACK?.[1] !== null ?? false;
        }

        return substack.target.name === this.target.name &&
            this.block.inputs?.SUBSTACK?.[1] === substack.blockID;
    }

    override hasSubstack2(substack2?: BlockNode): boolean {
        if (!substack2) {
            return this.block.inputs?.SUBSTACK2?.[1] !== null ?? false;
        }

        return substack2.target.name === this.target.name &&
            this.block.inputs?.SUBSTACK2?.[1] === substack2.blockID;
    }

    override getInputNode(key: InputKey): BlockNode | null {
        if (!(key in this.block.inputs)) {
            return null;
        }

        const [, blockID] = this.block.inputs[key];

        if (typeof blockID !== "string") {
            return null;
        }

        return this._getBlockNode(blockID);
    }

    override getInputNodes(skipSubstack: boolean): Array<BlockNode> {
        return Object.keys(this._block.inputs)
            .filter((key: InputKey) => !skipSubstack || (key !== "SUBSTACK" && key !== "SUBSTACK2"))
            .map((key: InputKey) => this.getInputNode(key))
            .filter((node) => node !== null);
    }

    override supportsInput(key: InputKey): boolean {
        return supportsInput(this.block.opcode, key);
    }

    override hasField(key: FieldKey): boolean {
        return Object.keys(this.block.fields).includes(key);
    }

    override getFieldKeys(): Array<FieldKey> {
        return Object.keys(this.block.fields) as Array<FieldKey>;
    }

    override getField(key: FieldKey): Field {
        if (!this.hasField(key)) {
            throw new NoSuchKeyError(`Block "${this.block.opcode}" does not have field "${key}"`);
        }

        return deepCopy<Field>(this.block.fields[key]);
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

    override getX(): number {
        return this.block[3];
    }

    override getScriptRoot(): VarListNode {
        return this;
    }

    override getStackRoot(): null {
        return null;
    }

    override isRootOfScriptOrSubstack(): true {
        return true; // always toplevel, and thus always root
    }

    override isRootOfSubstack(): false {
        return false;
    }

    override isTosInSubstackOf(): false {
        return false;
    }

    override isTosInSubstack2Of(): false {
        return false;
    }

    override getParent(): null {
        return null;
    }

    override getParentID(): null {
        return null;
    }

    override getNext(): null {
        return null;
    }

    override getNextID(): null {
        return null;
    }

    override getNextIDs(skipSelf: boolean): [] | [BlockID] {
        return skipSelf ? [] : [this.blockID];
    }

    override getLastID(): BlockID {
        return this.blockID;
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

    override isInputOf(): null {
        return null;
    }

    override isTopLevel(): true {
        return true;
    }

    override isCBlock(): false {
        return false;
    }

    override isCapBlock(): false {
        return false;
    }

    override isHatBlock(): false {
        return false;
    }

    override isStackBlock(): false {
        return false;
    }

    override isStackable(): false {
        return false;
    }

    override isMotionBlock(): false {
        return false;
    }

    override isReporterBlock(): true {
        return true;
    }

    override isShadow(): false {
        return false;
    }

    override canBeLive(): false {
        return false;
    }

    override hasSubstack(): false {
        return false;
    }

    override hasSubstack2(): false {
        return false;
    }

    override getInputNode(): null {
        return null;
    }

    override getInputNodes(): [] {
        return [];
    }

    override supportsInput(): false {
        return false;
    }

    override hasField(): false {
        return false;
    }

    override getField(key: FieldKey): never {
        throw new NoSuchKeyError(`Variable/list block does not have field "${key}"`);
    }

    override getFieldKeys(): [] {
        return [];
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
