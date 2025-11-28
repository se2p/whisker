import {
    Block,
    BlockID,
    isBlock,
    isBlockID,
    isStackableBlock,
    isTopLevelBlock,
    ScratchBlock,
    TopLevelBlock,
    VarList
} from "./blocks/Block";
import {Sprite, Stage, Target} from "./project/Target";
import {deepCopy} from "./utils/Objects";
import {canonicalizeInputs, WrappedProject} from "./utils/helpers";
import {
    BroadCastInput,
    ConnectedListBlock,
    ConnectedVariableBlock,
    deletedInput,
    Input,
    InputKey,
    inputRefersToShadowBlock, isBroadCastInput, isClearedInput,
    isDeletedInput,
    isNoShadowInput,
    isObscuredShadowInput,
    isPrimitiveInput,
    isUnobscuredShadowInput,
    ListInput,
    PrimitiveInput,
    PrimitiveInputType,
    primitiveInputTypes,
    shadowTypes,
    VariableInput
} from "./blocks/Inputs";
import {InvalidBlockError, NoSuchBlockError, NoSuchKeyError, NoSuchSpriteError} from "./utils/errors";
import {pair, Pair} from "../whisker/utils/Pair";
import {getBlockIDs, getInputKeys, supportsInput, variableName} from "./utils/blocks";
import {isHatBlock} from "./blocks/shapes/HatBlock";
import {isStackBlock} from "./blocks/shapes/StackBlock";
import {isCBlock} from "./blocks/shapes/CBlock";
import {isCapBlock} from "./blocks/shapes/CapBlock";
import {isMotionBlock, rotationStyles} from "./blocks/categories/Motion";
import {isReporterBlock} from "./blocks/shapes/Reporter";
import {broadcastToField, Field, FieldKey, listToField, variableToField} from "./blocks/Fields";
import Arrays from "../whisker/utils/Arrays";
import {looksEffects} from "./blocks/categories/Looks";
import {soundEffects} from "./blocks/categories/Sound";
import {keys} from "./blocks/categories/Events";
import {STAGE_NAME} from "./utils/selectors";
import {sensingCurrentOptions, spriteProperties, stageProperties} from "./blocks/categories/Sensing";
import {operators} from "./blocks/categories/Operators";
import {colorParamOptions} from "./blocks/categories/Pen";
import {NonExhaustiveCaseDistinction} from "../whisker/core/exceptions/NonExhaustiveCaseDistinction";
import logger from "../util/logger";
import Statistics from "../whisker/utils/Statistics";
import {BlockMeta, emptyBlockMeta, emptyInputMeta, findLastID, InputMeta, Meta} from "./utils/meta";

export type Node = BlockNode | VarListNode;
export type WrappedTarget = Target<BlockNode, VarListNode, VarListNode>;
export type WrappedSprite = Sprite<BlockNode, VarListNode, VarListNode>;
export type WrappedStage = Stage<BlockNode, VarListNode, VarListNode>;

type VarListInput = ConnectedVariableBlock | ConnectedListBlock;

interface DeletionResult {
    deleted?: BlockNode;
    revealed?: BlockNode;
}

interface DeletionOptions {
    skipSubstacks: boolean;
    skipNext: boolean;
}

export interface InputFilterOpts {
    skipSubstacks: boolean;
    skipDeletedInputs: boolean;
    skipClearedInputs: boolean;
    skipUnobscuredShadowBlocks: boolean;
    skipBroadcasts: boolean;
    skipUnobscuredPrimitiveInputs: boolean;
}

interface ITraversal {
    // Whether to include substacks or not.
    substacks: boolean;
    // Whether to transitively include the next blocks.
    nextBlocks: boolean;
}

interface TraversalWithoutNext extends ITraversal {
    nextBlocks: false;
}

interface TraversalWithNext extends ITraversal {
    nextBlocks: true;

    // The ID of the block where to stop, or null if all next-blocks should be included.
    lastBlock: BlockID | null;
}

export type TraversalOptions =
    | TraversalWithoutNext
    | TraversalWithNext
    ;

/**
 * How far new scripts are placed away from existing ones.
 */
const xOffset = 400;

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

    abstract getBlockMeta(traversal: TraversalOptions): BlockMeta;

    /**
     * Returns a "slice" of the stack this node belongs to, starting at this node, and ending at the given node
     * (inclusive.) Slices to the very end of the stack if the `blockID` is `null`. Throws an error if the given
     * `blockID` is not encountered.
     *
     * @param blockID the blockID block (inclusive)
     */
     abstract sliceTo(blockID: BlockID | null): BlockMeta;

     sliceToEnd(): BlockMeta {
        return this.sliceTo(null); // slice until "next" is null (i.e., the very end)
    }

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

    abstract getInputMeta(key: InputKey): InputMeta;

    /**
     * Tells which inputs the block currently has. Some input keys must always be present, e.g., for oval inputs,
     * while others may be absent (e.g., for boolean inputs or SUBSTACK(2)).
     */
    abstract getInputKeys(opts: InputFilterOpts): Array<InputKey>;

    abstract getInputBlockIDsRecursively(includeSubstacks: boolean, excludeShadow: boolean): Array<BlockID>;

    abstract supportsInput(key: InputKey): boolean;

    abstract isInputOf(parent: N): InputKey | null;

    abstract getFieldKeys(): Array<FieldKey>;

    abstract hasField(key: FieldKey): boolean;

    abstract getField(key: FieldKey): Field;

    abstract getPossibleFieldValues(key: FieldKey, skipCurrent: boolean): Array<Field>;

    abstract switchToValidFieldValueIfNecessary(key: FieldKey): void;

    abstract getPossibleBroadcastInputs(skipCurrent: boolean): Array<BroadCastInput>;

    /**
     * Turns this block into a standalone script, disconnecting it from its `parent` block.
     */
    abstract makeStandaloneScript(): void;

    abstract canDeleteInput(key: InputKey): boolean;

    /**
     * Transitively deletes the block and all children attached to it (but not the `parent`),
     * - including all blocks of substacks, and
     * - including the `next` block, whose inputs and `next` block are also deleted, and so on.
     * Returns all nodes that were deleted in the process.
     *
     * This mimics the action of dragging a block back into the toolbox on the left-hand side in the Scratch IDE.
     * Doing so disconnects the block, its inputs and all next blocks from the script, and deletes them.
     */
    public abstract deleteCascade(): Array<N>;

    /**
     * Deletes the block and all its inputs,
     * - including all blocks of substacks, but
     * - excluding the next block.
     * Returns all nodes that were deleted in the process.
     *
     * The same as `delete()` for blocks that do not have substacks.
     *
     * Like right-clicking on a C-Block in the Scratch IDE, and selecting "Delete n Blocks".
     */
    public abstract deleteCascadeSubstacks(): Array<N>;

    /**
     * Deletes the block and its inputs, but
     * - excluding substacks, and
     * - excluding the `next` block.
     * Returns all nodes that were deleted in the process.
     *
     * Like right-clicking on a block in the Scratch IDE, and selecting "Delete Block".
     */
    public abstract delete(): Array<N>;

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

    private _getStage(): WrappedStage {
        return this._project.targets.find(({isStage}) => isStage) as WrappedStage;
    }

    private _getSprite(name: string): WrappedSprite {
        const sprite = this._project.targets.find((target) => target.name === name);

        if (sprite) {
            return sprite as WrappedSprite;
        }

        throw new NoSuchSpriteError(name);
    }

    private _getOtherSpriteNames(): Array<string> {
        const names = this._project.targets
            .filter(({isStage}) => !isStage)
            .map(({name}) => name);

        if (this._target.isStage) { // Avoid filtering out a **sprite** with the name "Stage".
            return names;
        }

        return names.filter((name) => name !== this._target.name);
    }

    override getX(): number | null {
        if (!this.isTopLevel()) {
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

    setParent(parent: BlockNode): void {
        if (parent === null) {
            this.block.parent = null;
            return;
        }

        if (parent.target.name !== this.target.name) {
            throw new InvalidBlockError(`Blocks must belong to the same target ("${this.target.name}")`);
        }

        this.block.parent = parent.blockID;
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

    setNext(next: BlockNode): void {
        if (next === null) {
            this.block.next = null;
            return;
        }

        if (next.target.name !== this.target.name) {
            throw new InvalidBlockError(`Blocks must belong to the same target ("${this.target.name}")`);
        }

        this.block.next = next.blockID;
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

    override sliceTo(lastBlock: BlockID | null): BlockMeta {
        return this.getBlockMeta({substacks: true, nextBlocks: true, lastBlock});
    }

    override getBlockMeta(traversal: TraversalOptions): BlockMeta {
        const rootID = this.blockID;
        let blockMeta = emptyBlockMeta(rootID, traversal.nextBlocks ? traversal.lastBlock : rootID);

        // Begin the traversal at the root block.
        this._collectMetadata([blockMeta.rootID], blockMeta, traversal.substacks);

        // Very important for the next steps so as not to unintentionally modify the underlying Block of the Node!
        blockMeta = deepCopy(blockMeta);

        const actualLastID = findLastID(blockMeta.rootID, blockMeta.blocks);

        if (blockMeta.lastID === null) {
            blockMeta.lastID =  actualLastID;
        } else if (blockMeta.lastID !== actualLastID) {
            throw new InvalidBlockError(`The given block with ID "${blockMeta.lastID}" was not encountered`);
        }

        const root = blockMeta.blocks[rootID] as Block;
        root.parent = null; // avoid dangling IDs

        const last = blockMeta.blocks[blockMeta.lastID] as Block;
        last.next = null; // avoid dangling IDs

        return blockMeta;
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

    isObscuredInput(key: InputKey): boolean {
        if (key in this.block.inputs) {
            return isUnobscuredShadowInput(this.block.inputs[key]);
        }

        throw new NoSuchKeyError(`Block "${this.block.opcode}" does not have input "${key}"`);
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

    override getInputMeta(key: InputKey): InputMeta {
        if (!getInputKeys(this.block).includes(key)) {
            throw new NoSuchKeyError(`Block "${this.block.opcode}" does not take input "${key}"`);
        }

        if (!(key in this.block.inputs)) {
            // Only happens for C-Blocks or boolean blocks, when there's no SUBSTACK(2) or hexagonal input present.
            return emptyInputMeta(deletedInput(), false, false);
        }

        const input = this.block.inputs[key];
        const shadow = inputRefersToShadowBlock(this.block.opcode, key);
        const obscured = isObscuredShadowInput(input);
        let inputMeta = emptyInputMeta(input, shadow, obscured);
        this._collectMetadata(getBlockIDs(input), inputMeta, true);

        // Very important for the next steps so as not to unintentionally modify the underlying Block of the Node!
        inputMeta = deepCopy(inputMeta);

        // Avoid dangling references in inputs to this block.
        for (const blockID of getBlockIDs(input)) {
            // By construction, the inputBlock is a Block, and its parent is always this.blockID. No other blocks can
            // have this.blockID as parent. (If anything, they have blockID as parent.)
            const inputBlock = inputMeta.blocks[blockID] as Block;
            inputBlock.parent = null; // obscured drop-down menus actually already have parent === null
        }

        return inputMeta;
    }

    private _collectMetadata(workQueue: Array<BlockID>, meta: Meta, collectSubstacks: boolean): void {
        const lastID = meta.type === "Block" ? meta.lastID : null;

        while (workQueue.length !== 0) {
            // Handle the block itself by copying its JSON definition to the metadata object:
            const currentBlockID = workQueue.shift();
            const current = this._getBlockNode(currentBlockID);
            const block = deepCopy<Block>(current.block);
            meta.blocks[currentBlockID] = block;

            /*
             * Handle the metadata of the block:
             * (1) "Primitive" inputs can be (a) literal numbers and strings, or (b) variables, lists, and broadcasts.
             *     The former (a) are already fully captured by the block's JSON object. The latter (b) require special
             *     care as they are orthogonal to blocks.
             * (2) "Regular" inputs are represented as a Block object, and can be referred to via their block ID.
             *     We can handle them like any other block -> just queue them up for processing.
             */
            current._collectPrimitiveInputs(meta);  // (1)
            workQueue.push(...current._getInputBlockIDs(collectSubstacks, false)); // (2)

            if (!collectSubstacks) {
                // Avoid dangling block IDs in Meta: delete reference to the SUBSTACK(2).
                for (const key of ["SUBSTACK", "SUBSTACK2"] as Array<InputKey>) {
                    if (key in block.inputs) {
                        block.inputs[key] = deletedInput();
                    }
                }
            }

            // `next` blocks, if present, are always included, unless this is the last block.
            if (currentBlockID !== lastID && current.hasNext()) {
                workQueue.push(current.getNextID());
            }
        }
    }

    private _collectPrimitiveInputs(meta: Meta): void {
        for (const input of Object.values(this.block.inputs)) {
            const [, inputBlock, maybeObscuredBlock] = input;
            this._collectPrimitiveInput(inputBlock, meta);
            this._collectPrimitiveInput(maybeObscuredBlock, meta);
        }
    }

    private _collectPrimitiveInput(input: BlockID | PrimitiveInput, meta: Meta): void {
        if (!isPrimitiveInput(input)) {
            return;
        }

        const [type, name, id] = input;

        switch (type) {
            case primitiveInputTypes.variable: {
                const isSpriteOnly = id in this.target.variables;
                if (isSpriteOnly) {
                    meta.variables[id] = this.target.variables[id];
                } else {
                    // It's a stage variable, but we don't have its value, so 0 will have to do.
                    meta.stageVariables[id] = [name, 0];
                }
                break;
            }
            case primitiveInputTypes.list: {
                const isSpriteOnly = id in this.target.lists;
                if (isSpriteOnly) {
                    meta.lists[id] = this.target.lists[id];
                } else {
                    // It's a stage list, but we don't have its value, so [] will have to do.
                    meta.stageLists[id] = [name, []];
                }
                break;
            }
            case primitiveInputTypes.broadcast:
                // Broadcasts are stored in the stage, but luckily id and name is all we need.
                meta.broadcasts[id] = name;
                break;
        }
    }

    override getInputKeys(opts: InputFilterOpts): Array<InputKey> {
        return this._getInputs(opts).map(([key]) => key);
    }

    override getInputBlockIDsRecursively(collectSubstacks: boolean, skipShadow: boolean): Array<BlockID> {
        const blockIDs = new Array<BlockID>();
        const workQueue = this._getInputBlockIDs(collectSubstacks, skipShadow);

        while (workQueue.length > 0) {
            const currentID = workQueue.shift();
            blockIDs.push(currentID);
            const inputs = this._getBlockNode(currentID)._getInputBlockIDs(collectSubstacks, skipShadow);
            workQueue.push(...inputs);
        }

        return blockIDs;
    }

    private _getInputs(opts: InputFilterOpts): Array<Pair<InputKey, InputMeta>> {
        let keys = Object.keys(this.block.inputs) as Array<InputKey>;

        if (opts.skipSubstacks) {
            keys = keys.filter((key) => !(key === "SUBSTACK" || key === "SUBSTACK2"));
        }

        return keys.map((key) => pair(key, this.getInputMeta(key))).filter(([, inputDep]) => {
            const {input, input: [, inputBlock], shadow, obscured} = inputDep;

            if (opts.skipDeletedInputs && isDeletedInput(input)) {
                return false;
            }

            if (opts.skipClearedInputs && isClearedInput(input)) {
                return false;
            }

            if (opts.skipUnobscuredShadowBlocks && shadow && !obscured) {
                return false;
            }

            if (opts.skipBroadcasts && isUnobscuredShadowInput(input) && isBroadCastInput(inputBlock)) {
                return false;
            }

            if (opts.skipUnobscuredPrimitiveInputs && isUnobscuredShadowInput(input) && isPrimitiveInput(inputBlock)) {
                return false;
            }

            return true;
        });
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

    override getPossibleFieldValues(key: FieldKey, skipCurrent: boolean): Array<Field> {
        if (!this.hasField(key)) {
            return [];
        }

        const opcode = this.block.opcode;
        const fieldValues = [];

        switch (key) {
            case "STYLE":
                fieldValues.push(...rotationStyles);
                break;

            case "EFFECT":
                if (opcode === "looks_changeeffectby" || opcode === "looks_seteffectto") {
                    fieldValues.push(...looksEffects);
                }

                if (opcode === "sound_changeeffectby" || opcode === "sound_seteffectto") {
                    fieldValues.push(...soundEffects);
                }

                break;

            case "FRONT_BACK":
                fieldValues.push("front", "back");
                break;

            case "FORWARD_BACKWARD":
                fieldValues.push("forward", "backward");
                break;

            case "NUMBER_NAME":
                fieldValues.push("number", "name");
                break;

            case "KEY_OPTION":
                fieldValues.push(...keys);
                break;

            case "BACKDROP": {
                const backdrops = this._getStage().costumes.map(({name}) => name);

                fieldValues.push(...backdrops);

                if (opcode === "looks_backdrops") {
                    fieldValues.push("next backdrop", "previous backdrop", "random backdrop");
                }

                break;
            }

            case "WHENGREATERTHANMENU":
                fieldValues.push("LOUDNESS", "TIMER");
                break;

            case "BROADCAST_OPTION":
                fieldValues.push(...Object.entries(this._getStage().broadcasts));
                break;

            case "STOP_OPTION":
                fieldValues.push("other scripts in sprite");

                // These choices are only available if the "control_stop" block isn't connected to a `next` block.
                // (A "control_stop" block may change its shape depending on the selected option.)
                if (!this.hasNext()) {
                    fieldValues.push("all", "this script");
                }

                break;

            case "DRAG_MODE":
                fieldValues.push("draggable", "not draggable");
                break;

            case "PROPERTY": { // field of block with opcode "sensing_of"
                // The options in the rectangular drop-down menu change depending on which target is selected in the
                // oval-shaped drop-down menu
                const [shadowType, inputBlock, obscuredBlock] = this.block.inputs.OBJECT;
                const shadowBlock = (shadowType === shadowTypes.obscuredShadow ? obscuredBlock : inputBlock) as BlockID;
                const [targetName] = this.target.blocks[shadowBlock].getField("OBJECT");
                const sensingStage = targetName === STAGE_NAME;
                const properties = sensingStage ? stageProperties : spriteProperties;
                const variables = (sensingStage ? this._getStage() : this._getSprite(targetName)).variables;
                const variableNames = Object.values(variables).map((v) => variableName(v));
                fieldValues.push(...properties, ...variableNames);
                break;
            }

            case "CURRENTMENU":
                fieldValues.push(...sensingCurrentOptions);
                break;

            case "OPERATOR":
                fieldValues.push(...operators);
                break;

            case "VARIABLE": {
                const stageVariables = Object.entries(this._getStage().variables);
                fieldValues.push(...stageVariables);

                if (!this._target.isStage) {
                    const ownVariables = Object.entries(this._target.variables);
                    fieldValues.push(...ownVariables);
                }

                break;
            }

            case "LIST": {
                const stageLists = Object.entries(this._getStage().lists);
                fieldValues.push(...stageLists);

                if (!this._target.isStage) {
                    const ownLists = Object.entries(this._target.lists);
                    fieldValues.push(...ownLists);
                }

                break;
            }

            case "TO":
                fieldValues.push(...this._getOtherSpriteNames(), "_random_", "_mouse_");
                break;

            case "TOWARDS":
                fieldValues.push(...this._getOtherSpriteNames(), "_mouse_");
                break;

            case "COSTUME":
                fieldValues.push(...this.target.costumes.map(({name}) => name));
                break;

            case "SOUND_MENU": {
                const sounds = this.target.sounds.map(({name}) => name);

                // Special handling required: While it is not possible to delete the last costume of a sprite, one
                // can very well delete the last sound asset. In this case, we mimic the behavior of the Scratch IDE
                // and only offer the empty string (which seems to stand for "no sound") for choice.
                if (sounds.length === 0) {
                    sounds.push("");
                }

                fieldValues.push(...sounds);
                break;
            }

            case "CLONE_OPTION":
                fieldValues.push(...this._getOtherSpriteNames());

                if (!this._target.isStage) {
                    fieldValues.push("_myself_");
                }

                break;

            case "TOUCHINGOBJECTMENU":
                fieldValues.push(...this._getOtherSpriteNames(), "_mouse_", "_edge_");
                break;

            case "DISTANCETOMENU":
                fieldValues.push(...this._getOtherSpriteNames(), "_mouse_");
                break;

            case "OBJECT":
                fieldValues.push(...this._getOtherSpriteNames(), STAGE_NAME);
                break;

            case "VALUE":
                logger.warn("Argument definitions in the signature of custom blocks currently not handled");
                break;

            case "colorParam":
                fieldValues.push(...colorParamOptions);
                break;

            default:
                throw new NonExhaustiveCaseDistinction(key, `Unhandled field key "${key}"`);
        }

        const fields = fieldValues.map((value): Field => {
            if (key === "BROADCAST_OPTION") {
                return broadcastToField(value);
            }

            if (key === "VARIABLE") {
                return variableToField(value);
            }

            if (key === "LIST") {
                return listToField(value);
            }

            return [value, null];
        });

        if (skipCurrent) {
            const current = this.block.fields[key];
            return Arrays.removeElem(fields, current);
        }

        return fields;
    }

    override switchToValidFieldValueIfNecessary(key: FieldKey): void {
        if (!this.getFieldKeys().includes(key)) {
            throw new NoSuchKeyError(key);
        }

        const values = this.getPossibleFieldValues(key, false);

        if (values.length === 0) {
            logger.warn(`Warning: Cannot switch to valid field value for key "${key}"!`);
            return;
        }

        const [current] = this.block.fields[key];

        if (values.some(([value]) => value === current)) {
            return; // already valid entry selected
        }

        // Try to find a valid value with the lowest string edit distance to the current selection, and switch to it.
        const distances = values.map(([value]) =>
            Statistics.levenshteinDistance(current.toLocaleLowerCase(), value.toLocaleLowerCase()));
        const idx = distances.indexOf(Math.min(...distances));
        this.setField(key, values[idx]);
    }

    setField(key: FieldKey, field: Field): void {
        if (!this.hasField(key)) {
            throw new NoSuchKeyError(`Block "${this.block.opcode}" does not support field "${key}"`);
        }

        this.block.fields[key] = field as Field;

        // If switching to a different target in the "sensing_of_object_menu" block, we might have to change the sensed
        // property in its parent (the "sensing_of" block), too.
        if (key === "OBJECT") {
            this.getParent().switchToValidFieldValueIfNecessary("PROPERTY");
        }
    }

    override getPossibleBroadcastInputs(skipCurrentInput: boolean): Array<BroadCastInput> {
        if (!Object.keys(this.block.inputs).includes("BROADCAST_INPUT")) {
            return [];
        }

        const broadcasts = Object.entries(this._getStage().broadcasts);
        const inputs = broadcasts.map<BroadCastInput>(([id, name]) => [primitiveInputTypes.broadcast, name, id]);

        if (skipCurrentInput) {
            const [shadowType, unobscured, obscured] = this.block.inputs["BROADCAST_INPUT"];
            const toSkip = (shadowType === shadowTypes.unobscuredShadow ? unobscured : obscured) as BroadCastInput;
            return Arrays.removeElem(inputs, toSkip);
        }

        return inputs;
    }

    setInput(key: InputKey, newInput: Input, replace: boolean): void {
        if (!supportsInput(this.block, key)) {
            throw new NoSuchKeyError(`Block "${this.block.opcode}" does not take input "${key}"`);
        }

        // If `replace` is truthy, the new input is just set, without trying to obscure the existing input.
        // Boolean inputs and SUBSTACK(2) are always just set.
        if (replace || isDeletedInput(newInput) || isNoShadowInput(newInput)) {
            this.block.inputs[key] = newInput;
            return;
        }

        const [currentShadow, currentInputBlock, currentObscuredBlock] = this.block.inputs[key];

        // Note: the obscured part of the new input is never inserted.
        const [newShadow, newInputBlock] = newInput;

        // If the new input is unobscured, it simply replaces the current input.
        if (newShadow === shadowTypes.unobscuredShadow) {
            this.block.inputs[key] = [
                shadowTypes.unobscuredShadow,
                newInputBlock,
            ];

            return;
        }

        // If the current input is unobscured, it is now obscured by the new input.
        if (currentShadow === shadowTypes.unobscuredShadow) {
            this.block.inputs[key] = [
                shadowTypes.obscuredShadow,
                newInputBlock,
                currentInputBlock,
            ];

            return;
        }

        // If the current input is obscured, the obscuring block is replaced with the new input. The current obscured
        // input stays the same.
        if (currentShadow === shadowTypes.obscuredShadow) {
            this.block.inputs[key] = [
                shadowTypes.obscuredShadow,
                newInputBlock,
                currentObscuredBlock,
            ];

            return;
        }

        throw new Error(`Unhandled combination of shadow types "${currentShadow}" and "${newShadow}"`);
    }

    setBlockAsInput(key: InputKey, blockID: BlockID): BlockNode | null {
        const inputs = this.block.inputs;

        if (!(key in inputs) || isDeletedInput(inputs[key])) {
            // Input key does not exist (yet), or input has been deleted. This is only possible for boolean inputs or
            // substacks.
            inputs[key] = [
                shadowTypes.noShadow,
                blockID,
            ];

            return null;
        }

        const [inputType, oldInput, obscuredInput] = inputs[key];
        switch (inputType) {
            case shadowTypes.unobscuredShadow:
                // The new input obscures the current input.
                inputs[key] = [
                    shadowTypes.obscuredShadow,
                    blockID,
                    oldInput,
                ];

                if (isBlockID(oldInput)) {
                    const inputNode = this.target.blocks[oldInput];
                    if (inputNode.isShadow()) {
                        // Obscured oval-shaped drop-down menus must become standalone scripts!
                        inputNode.makeStandaloneScript();
                    }
                }

                return null;
            case shadowTypes.noShadow:
                // Replace existing input
                inputs[key] = [
                    shadowTypes.noShadow,
                    blockID,
                ];
                return this._getBlockNode(oldInput);
            case shadowTypes.obscuredShadow:
                // Replace the old obscuring input with the new input. The obscured input stays the same.
                inputs[key] = [
                    shadowTypes.obscuredShadow,
                    blockID,
                    obscuredInput,
                ];
                return isBlockID(oldInput) ? this._getBlockNode(oldInput) : null;
            default:
                throw new NonExhaustiveCaseDistinction(inputType, `Unhandled shadow type "${inputType}"`);
        }
    }

    setVarListBlockAsInput(key: InputKey, varListInput: VariableInput | ListInput): BlockNode | null {
        varListInput = varListInput.slice(0, 3) as VarListInput; // remove x and y coordinates if any
        const inputs = this.block.inputs;

        if (!(key in inputs) || isDeletedInput(inputs[key])) {
            throw new Error(`Input "${key}" does not exist, or cannot take a variable/list block`);
        }

        const [inputType, oldInput, obscuredInput] = inputs[key];
        switch (inputType) {
            case shadowTypes.unobscuredShadow:
                // The new input obscures the current input.
                inputs[key] = [
                    shadowTypes.obscuredShadow,
                    varListInput,
                    oldInput,
                ];

                if (isBlockID(oldInput)) {
                    const inputNode = this.target.blocks[oldInput];
                    if (inputNode.isShadow()) {
                        // Obscured oval-shaped drop-down menus must become standalone scripts!
                        inputNode.makeStandaloneScript();
                    }
                }

                return null;
            case shadowTypes.noShadow:
                throw new Error(`Input "${key}" cannot take variable/list block`);
            case shadowTypes.obscuredShadow:
                // Replace the old obscuring input with the new input. The obscured input stays the same.
                inputs[key] = [
                    shadowTypes.obscuredShadow,
                    varListInput,
                    obscuredInput,
                ];
                return isBlockID(oldInput) ? this._getBlockNode(oldInput) : null;
            default:
                throw new NonExhaustiveCaseDistinction(inputType, `Unhandled shadow type "${inputType}"`);
        }
    }

    setNonTopLevel(): void {
        this.block.topLevel = false;
        delete this.block['x'];
        delete this.block['y'];
    }

    setTopLevel(x: number, y: number): void {
        this.block['x'] = x;
        this.block['y'] = y;
        this.block.topLevel = true;
    }

    private _maxX(): number {
        const blocks = Object.values(this.target.blocks);
        const xValues = blocks
            .filter((b) => b.isTopLevel() && !b.isShadow() && b.blockID !== this.blockID)
            .map((b) => b.getX());
        return Math.max(-xOffset, ...xValues);
    }

    override makeStandaloneScript(): void {
        this.setTopLevel(this._maxX() + xOffset, 0);
        this.block.parent = null;
    }

    setChildByKey(key: "next" | "SUBSTACK" | "SUBSTACK2", child: BlockNode): void {
        switch (key) {
            case "next":
                this.setNext(child);
                return;
            case "SUBSTACK":
                this.setSubstack(child);
                return;
            case "SUBSTACK2":
                this.setSubstack2(child);
                return;
            default:
                throw new NonExhaustiveCaseDistinction(key, `Unhandled key "${key}"`);
        }
    }

    setSubstack(substack: BlockNode): void {
        this._setSubstackByKey("SUBSTACK", substack);
    }

    setSubstack2(substack2: BlockNode): void {
        this._setSubstackByKey("SUBSTACK2", substack2);
    }

    private _setSubstackByKey(key: "SUBSTACK" | "SUBSTACK2", substack: BlockNode): void {
        if (substack === null) {
            this._deleteSubstackByKey(key);
            return;
        }

        if (substack.target.name !== this.target.name) {
            throw new InvalidBlockError(`Blocks must belong to the same target (${this.target.name})`);
        }

        this.block.inputs[key] = [shadowTypes.noShadow, substack.blockID];
    }

    private _deleteSubstackByKey(key: "SUBSTACK" | "SUBSTACK2"): void {
        delete this.block.inputs[key];
    }

    override canDeleteInput(key: InputKey): boolean {
        if (!getInputKeys(this.block).includes(key)) {
            return false;
        }

        const input = this.block.inputs[key];
        if (isUnobscuredShadowInput(input)) {
            const [, inputBlock] = input;
            if (isBlockID(inputBlock)) {
                // Attempting to delete an oval-shaped drop-down menu... This cannot work!
                return false;
            }

            // Cannot delete...
            // (1) oval-shaped drop-down menus for broadcasts (otherwise, project fails to load)
            // (2) color inputs (otherwise, project fails to load)
            // (3) angle inputs (project does load, but angle defaults to 0 – debatable?)
            const blacklist: Array<PrimitiveInputType> = [
                primitiveInputTypes.broadcast,
                primitiveInputTypes.color,
                primitiveInputTypes.angle,
            ];
            const [primitiveInputType] = inputBlock;
            if (blacklist.includes(primitiveInputType)) {
                return false;
            }
        }

        return true;
    }

    public deleteInput(key: InputKey): DeletionResult {
        if (!this.canDeleteInput(key)) {
            const blockID = this.blockID;
            const opcode = this.block.opcode;
            throw new InvalidBlockError(`Cannot delete input "${key}" of block "${blockID}" with opcode "${opcode}"`);
        }

        const inputs = this.block.inputs;

        if (!(key in inputs)) {
            // The current block is a C-block or boolean block but no substack or hexagonal input has been set yet.
            // In these cases, the key is actually absent.
            return {};
        }

        const [type, input, obscuredInput] = inputs[key];
        switch (type) {
            case shadowTypes.unobscuredShadow:
                if (input === null) {
                    // The current block is a C-block or boolean block whose substack or hexagonal input has already
                    // been deleted. type === 1 and input === null is a dummy that represents the absence of an input.
                    return {};
                }

                // The input must be a PrimitiveShadowInput, and accepts literal text (or numbers), so just clear it.
                (input as PrimitiveInput)[1] = "";
                return {};
            case shadowTypes.noShadow:
                // It's a reference to the first block in a substack, or a conditional block. Instead of just
                // deleting the key, we do the same as the Scratch IDE, and use a "dummy" input to signal the
                // absence of any input.
                inputs[key] = deletedInput();
                return {
                    deleted: this._getBlockNode(input),
                };
            case shadowTypes.obscuredShadow: {
                // Remove the obscuring block to reveal the obscured block.
                inputs[key] = [
                    shadowTypes.unobscuredShadow,
                    obscuredInput,
                ];

                return {
                    ...(isBlockID(input) && {deleted: this._getBlockNode(input)}),
                    ...(isBlockID(obscuredInput) && {revealed: this._getBlockNode(obscuredInput)}),
                };
            }
            default:
                throw new NonExhaustiveCaseDistinction(type, `Unhandled input type "${type}"`);
        }
    }

    deleteInputBlock(toDelete: BlockNode): void {
        if (!this.hasInputNode(toDelete)) {
            throw new NoSuchBlockError(toDelete.blockID);
        }

        if (toDelete.isShadow()) {
            throw new InvalidBlockError(`Must not delete drop-down menu block "${toDelete.blockID}"`);
        }

        for (const [inputKey, input] of Object.entries(this.block.inputs)) {
            if (input[1] === toDelete.blockID) {
                this.deleteInput(inputKey as InputKey);
            }
        }
    }

    override deleteCascade(): Array<BlockNode> {
        return this._delete({skipSubstacks: false, skipNext: false});
    }

    override deleteCascadeSubstacks(): Array<BlockNode> {
        return this._delete({skipSubstacks: false, skipNext: true});
    }

    override delete(): Array<BlockNode> {
        return this._delete({skipSubstacks: true, skipNext: true});
    }

    private _delete(delOpts: DeletionOptions): Array<BlockNode> {
        const inputs = Object.entries(this.block.inputs);

        if (delOpts.skipSubstacks) {
            Arrays.removeIf(inputs, ([key]) => key === "SUBSTACK" || key === "SUBSTACK2");
        }

        const deletedBlocks = new Array<BlockNode>();

        // Delete inputs.
        for (const [, input] of inputs) {
            for (const blockID of getBlockIDs(input)) {
                const deletedInputs = this._getBlockNode(blockID).deleteCascade();
                deletedBlocks.push(...deletedInputs);
            }
        }

        const next = this.getNext();

        // Delete this block itself.
        delete this.target.blocks[this.blockID];
        deletedBlocks.push(this);

        if (!next || delOpts.skipNext) {
            return deletedBlocks;
        }

        // Delete all next blocks.
        const deletedNexts = next.deleteCascade();
        deletedBlocks.push(...deletedNexts);
        return deletedBlocks;
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

    override getBlockMeta(traversal: TraversalOptions): BlockMeta {
        if (traversal.nextBlocks && traversal.lastBlock !== this.blockID) {
            throw new InvalidBlockError(`Did not expect to be given the block ID "${traversal.lastBlock}"`);
        }

        const blockMeta = emptyBlockMeta(this.blockID, this.blockID);
        blockMeta.blocks[this.blockID] = this.block;

        const [type, name, id] = this.block;
        if (type === primitiveInputTypes.variable) {
            const isSpriteOnly = id in this.target.variables;
            if (isSpriteOnly) {
                blockMeta.variables[id] = this.target.variables[id];
            } else {
                blockMeta.stageVariables[id] = [name, 0]; // 0 as dummy/default value
            }
        } else if (type === primitiveInputTypes.list) {
            const isSpriteOnly = id in this.target.lists[id];
            if (isSpriteOnly) {
                blockMeta.lists[id] = this.target.lists[id];
            } else {
                blockMeta.stageLists[id] = [name, []]; // [] as dummy/default value
            }
        } else {
            throw new NonExhaustiveCaseDistinction(type, `Unhandled input type "${type}"`);
        }

        return deepCopy<BlockMeta>(blockMeta);
    }

    override sliceTo(blockID: BlockID | null): BlockMeta {
        return this.getBlockMeta({substacks: false, nextBlocks: true, lastBlock: blockID});
    }

    override getInputNode(): null {
        return null;
    }

    override getInputNodes(): [] {
        return [];
    }

    override getInputMeta(key: InputKey): never {
        throw new NoSuchKeyError(`Variable/list block does not take input "${key}"`);
    }

    override getInputKeys(): [] {
        return [];
    }

    override getInputBlockIDsRecursively(): [] {
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

    override getPossibleFieldValues(): [] {
        return [];
    }

    override switchToValidFieldValueIfNecessary(_key: FieldKey): void {
        // does not have a field
    }

    override getPossibleBroadcastInputs(): [] {
        return [];
    }

    override makeStandaloneScript(): void {
        // already standalone
    }

    override canDeleteInput(_key: InputKey): false {
        return false;
    }

    override delete(): [VarListNode] {
        delete this.target.blocks[this.blockID];
        return [this];
    }

    override deleteCascade(): [VarListNode] {
        return this.delete();
    }

    override deleteCascadeSubstacks(): [VarListNode] {
        return this.delete();
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
