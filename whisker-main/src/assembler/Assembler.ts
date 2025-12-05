import {Project} from "./project/Project";
import {BlockID, TopLevelBlock} from "./blocks/Block";
import uid from "scratch-vm/src/util/uid";
import {BlockNode, InputFilterOpts, Node, VarListNode, WrappedStage, WrappedTarget} from "./Node";
import {
    ConnectedExprSelector,
    DropDownSelector,
    ExprSelector,
    FieldSelector,
    getUniqueName,
    hasUniqueName,
    InputSelector,
    STAGE_NAME,
    UniqueTargetName
} from "./utils/selectors";
import {
    NoSuchBlockError,
    NoSuchListError,
    NoSuchScriptError,
    NoSuchSpriteError,
    NoSuchVariableError
} from "./utils/errors";
import {ListID, VariableID} from "./project/Target";
import {List, Variable} from "./blocks/categories/Data";
import {deepCopy} from "./utils/Objects";
import {getInputKeys, listName, variableName} from "./utils/blocks";
import {checkForProblems, ID, throwErrorIfValueUndefined, validate, WrappedProject, wrapProject} from "./utils/helpers";
import {
    BroadCastInput,
    ExprKey,
    InputKey,
    isObscuredShadowInput, ListInput,
    primitiveInputTypes,
    shadowTypes, UnobscuredShadowInput, VariableInput
} from "./blocks/Inputs";
import {Pair} from "../whisker/utils/Pair";
import {broadcastInputToField, Field} from "./blocks/Fields";
import {hashCode} from "../repair/utils/hashCode";
import {BlockMeta, emptyBlockMeta, emptyInputMeta, InputMeta, Meta} from "./utils/meta";

/**
 * An API to programmatically modify the `project.json` of Scratch projects.
 *
 * On a technical level, every Scratch project is made of Scratch blocks (represented by the {@link ScratchBlock} type).
 * Every block can have inputs (represented by the {@link Input} interface).
 *
 * Another point of view is the conceptual level. Here, blocks serve two main purposes:
 * 1. Statements: Stackable blocks build the control flow of the program.
 * 2. Expressions: Reporter blocks and primitive inputs (excl. `"BROADCAST_INPUT"`, `"SUBSTACK"` and `"SUBSTACK2"`)
 *    represent values.
 *
 * The API provides methods for both points of view. We do not recommend mixing them to avoid unexpected results. For
 * example, every statement can be safely deleted, but attempting to delete a block could fail.
 *
 * Current limitations:
 * - Custom blocks are not supported.
 * - It is assumed all required assets (costumes and sounds) are already present.
 */
export class Assembler {

    /**
     * The `project.json` being modified, parsed as JavaScript object, and enriched with an AST-like API.
     *
     * @private
     */
    private readonly _project: WrappedProject;

    /**
     * A function to generate a fresh `ID`.
     *
     * @private
     */
    private readonly _generateFreshID: (oldID: ID) => ID;

    /**
     * Constructs a new `Assembler` for the given `project`. All changes will be applied to an internal working copy of
     * the project. The optional callback `generateFreshID` is used to generate fresh IDs for blocks, variables, lists,
     * and broadcasts. It defaults to the `uid` function used by Scratch.
     *
     * @param project the project to modify
     * @param generateFreshID callback that generates a fresh ID when invoked (optional)
     */
    public constructor(project: Readonly<Project>, generateFreshID: (oldID: ID) => ID = uid) {
        this._project = wrapProject(project);
        this._generateFreshID = generateFreshID.bind(null);
    }

    /**
     * Returns a deep copy of the `project.json` as plain JSON object. This object can be serialized with
     * `JSON.stringify`, and loaded directly into the Scratch VM, or stored to the hard drive as `.sb3` file.
     *
     * Before returning, the `project.json` is parsed against the sb3 schema definition, and validated. If the function
     * throws, it is a likely a bug in the `Assembler` class.
     */
    public toJSON(): Project {
        checkForProblems(this._project);
        const project = deepCopy(this._project, throwErrorIfValueUndefined) as unknown as Project;
        validate(project);
        project.meta.hashCode = hashCode(JSON.stringify(project.targets));
        return project;
    }

    public static fromJSON(project: Readonly<Project>, generateFreshID: (oldID: BlockID) => BlockID = uid): Assembler {
        return new Assembler(project, generateFreshID);
    }

    public copy(): Assembler {
        return new Assembler(this.toJSON(), this._generateFreshID);
    }

    public get filePath(): string | null {
        return this._project.meta.filePath ?? null;
    }

    //------------------------------------------------------------------------------------------------------------------
    //region Private helpers

    private _getScript(scriptID: BlockID): Node {
        let script = null;

        try {
            script = this._getNode(scriptID);
        } catch (e) {
            if (e instanceof NoSuchBlockError) {
                throw new NoSuchScriptError(e);
            }

            throw e;
        }

        if (!script.isTopLevel()) {
            throw new NoSuchScriptError(scriptID);
        }

        return script;
    }

    private _getTarget(name: UniqueTargetName): WrappedTarget {
        const targets = this._project.targets;

        if (name === STAGE_NAME) {
            return targets.find(({isStage}) => isStage);
        }

        const target = targets.find((target) => target.name === name);

        if (target) {
            return target;
        }

        throw new NoSuchSpriteError(name);
    }

    private _getStage(): WrappedStage {
        return this._getTarget(STAGE_NAME) as WrappedStage;
    }

    private* _getNodes(skipShadow = true): Generator<Node, void> {
        for (const target of this._project.targets) {
            for (const block of Object.values(target.blocks)) {
                if (skipShadow && block.isShadow()) {
                    continue;
                }

                yield block;
            }
        }
    }

    private _getNode<T extends Node = Node>(blockID: BlockID): T {
        for (const target of this._project.targets) {
            if (blockID in target.blocks) {
                return target.blocks[blockID] as T;
            }
        }

        throw new NoSuchBlockError(blockID);
    }

    private _moveTopLevelProperties(source: BlockNode, target: BlockNode): void {
        const {x, y} = source.block as TopLevelBlock;
        target.setTopLevel(x, y);
        source.setNonTopLevel();
    }

    //endregion
    //------------------------------------------------------------------------------------------------------------------
    //region Querying

    /**
     * Returns all but shadow blocks in the project.
     */
    public getBlocks(): Array<BlockID> {
        const blocks = new Array<BlockID>();

        for (const node of this._getNodes()) {
            blocks.push(node.blockID);
        }

        return blocks;
    }

    public getBlocksOfStack(stackID: BlockID, skipSubstack: boolean): Array<BlockID> {
        const stack = this._getNode(stackID);

        const queue = [stack];
        const blocks = new Array<BlockID>();

        for (const block of queue) {
            if (block.isShadow()) {
                continue;
            }

            blocks.push(block.blockID);
            queue.push(...block.getInputNodes(skipSubstack));

            if (block.hasNext()) {
                queue.push(block.getNext());
            }
        }

        return blocks;
    }

    public getBlocksOfScript(scriptID: BlockID): Array<BlockID> {
        const queue = [this._getScript(scriptID)];
        const blocks = new Array<BlockID>();

        for (const block of queue) {
            if (block.isShadow()) {
                continue;
            }

            blocks.push(block.blockID);

            queue.push(...block.getInputNodes(false));

            if (block.hasNext()) {
                queue.push(block.getNext());
            }
        }

        return blocks;
    }

    public getBlocksOfTarget(targetName: UniqueTargetName): Array<BlockID> {
        const target = this._getTarget(targetName);
        return Object.values(target.blocks)
            .filter((block) => !block.isShadow())
            .map(({blockID}) => blockID);
    }

    /**
     * Returns the total number of blocks in the project, excluding shadow blocks and dummy blocks.
     */
    public getBlockCount(): number {
        return this.getBlocks().length;
    }

    public getInputBlockIDs(parent: BlockID, includeSubstacks: boolean, skipShadow = false): Array<BlockID> {
        const node = this._getNode(parent);
        return node.getInputBlockIDsRecursively(includeSubstacks, skipShadow);
    }

    private _getStmts(): Array<BlockNode> {
        const stmts = new Array<BlockNode>();

        for (const node of this._getNodes()) {
            if (node.isStackable()) {
                stmts.push(node as BlockNode);
            }
        }

        return stmts;
    }

    /**
     * Returns all statements in the project. These encompass the blocks from the categories "stack", "hat", "cap", and
     * "C", but excludes shadow blocks and reporter blocks (expressions).
     */
    public getStmts(): Array<BlockID> {
        return this._getStmts().map(({blockID}) => blockID);
    }

    /**
     * Returns all sequentially composed statements (i.e., directly connected to each other in a parent-next
     * relationship) starting at the statement with the given ID.
     *
     * @param rootID The ID of the statement to start at
     */
    public getStmtsOf(rootID: BlockID): Array<BlockID> {
        return [...this._getNode(rootID)].map(({blockID}) => blockID);
    }

    public getStmtsOfTarget(targetName: UniqueTargetName): Array<BlockID> {
        this._getTarget(targetName); // to make sure the target exists
        return this._getStmts()
            .filter(({target}) => hasUniqueName(target, targetName))
            .map(({blockID}) => blockID);
    }

    /**
     * Like `getStmts()`, but also excludes statements that are toplevel. In contrast to `getEventHandlers()`, the
     * result also includes non-hat blocks.
     */
    public getNonTopLevelStmts(): Array<BlockID> {
        return this._getStmts()
            .filter((stmt) => !stmt.isTopLevel())
            .map(({blockID}) => blockID);
    }

    private _getCBlocks(): Array<Node> {
        const cBlocks = new Array<Node>();

        for (const node of this._getNodes()) {
            if (node.isCBlock()) {
                cBlocks.push(node);
            }
        }

        return cBlocks;
    }

    public getCBlocks(): Array<BlockID> {
        return this._getCBlocks().map(({blockID}) => blockID);
    }

    private _getInputs(node: BlockNode | null = null): Array<Pair<BlockNode, InputKey>> {
        const options: InputFilterOpts = {
            skipSubstacks: false,
            skipBroadcasts: false,
            skipDeletedInputs: true,
            skipUnobscuredShadowBlocks: false,
            skipClearedInputs: true,
            skipUnobscuredPrimitiveInputs: false,
        };

        return (node === null ? [...this._getNodes()] : [node])
            .flatMap((node) => node.getInputKeys(options)
                .map((key) => ([node as BlockNode, key])));
    }

    /**
     * Returns all inputs in the project. This excludes "empty" inputs, such as deleted `SUBSTACK`s and boolean inputs,
     * and primitive inputs that are the empty string.
     */
    public getInputs(): Array<InputSelector> {
        return this._getInputs().map(([{blockID}, key]) => ({blockID, key}));
    }

    public getInputsOfBlock(blockID: BlockID): Array<InputSelector> {
        return this._getInputs(this._getNode(blockID)).map(([{blockID}, key]) => ({blockID, key}));
    }

    private _getExprs(
        skipUnconnected: boolean,
        referViaInputKey: boolean,
        skipMissing: boolean,
        blockID: BlockID | null = null
    ): Array<Pair<Node, ExprKey | null>> {
        const options: InputFilterOpts = {
            skipSubstacks: true, // SUBSTACKs are statements, not expressions
            skipBroadcasts: true, // Broadcasts are implemented as PrimitiveInput, but behave like drop-down menus
            skipDeletedInputs: skipMissing, // Boolean input (or SUBSTACK) is missing
            skipUnobscuredShadowBlocks: true, // It is a drop-down menu, and not an expression
            skipClearedInputs: skipMissing, // The primitive input is empty
            skipUnobscuredPrimitiveInputs: false,
        };

        const exprs = Array<Pair<Node, ExprKey | null>>();
        const nodes = blockID === null ? this._getNodes() : [this._getNode(blockID)];

        for (const node of nodes) {
            const unconnectedExpr = node.isTopLevel() && node.isReporterBlock();
            if (unconnectedExpr && !skipUnconnected) {
                exprs.push([node, null]);
            }

            for (const key of node.getInputKeys(options) as Array<ExprKey>) {
                if (referViaInputKey) {
                    exprs.push([node, key]);
                } else {
                    // If the input is a block itself, we try to refer to it via its BlockID. (For example, this could
                    // be useful for coverage measurement.) Otherwise, like in the case of primitive inputs, we fall
                    // back to the BlockID of the parent and the corresponding input key.
                    const inputNode = node.getInputNode(key);
                    exprs.push(inputNode ? [inputNode, null] : [node, key]);
                }
            }
        }

        return exprs;
    }

    /**
     * Returns all expressions in the project. This includes reporter blocks (including unconnected ones) and primitive
     * inputs, but excludes `SUBSTACK`/`SUBSTACK2` (because these are statements) and `BROADCAST_INPUT` (because it
     * behaves like a drop-down menu).
     */
    public getExprs(): Array<ExprSelector> {
        return this._getExprs(false, false, true).map(([{blockID}, key]) => ({blockID, ...(key && {key})}));
    }

    public getConnectedExprs(): Array<ConnectedExprSelector> {
        return this._getExprs(true, true, true).map(([{blockID}, key]) => ({blockID, key}));
    }

    public getExprsOfBlock(blockID: BlockID): Array<ConnectedExprSelector> {
        return this._getExprs(true, true, false, blockID).map(([{blockID}, key]) => ({blockID, key}));
    }

    private _getScripts(skipReporter: boolean): Array<Node> {
        const scripts = new Array<Node>();

        for (const node of this._getNodes()) {
            if (node.isTopLevel() && !(skipReporter && node.isReporterBlock())) {
                scripts.push(node);
            }
        }

        return scripts;
    }

    /**
     * Returns all scripts in the project, identified by their root block. This includes unconnected scripts (whose
     * root block is not a hat block). If `skipReporter` is `false`, it also includes unconnected reporter blocks,
     * otherwise it excludes them.
     *
     * @param skipReporter whether to skip reporter blocks in the result
     */
    public getScripts(skipReporter: boolean): Array<BlockID> {
        return this._getScripts(skipReporter).map(({blockID}) => blockID);
    }

    public getScriptsOfTarget(targetName: UniqueTargetName, skipReporter: boolean): Array<BlockID> {
        this._getTarget(targetName); // to make sure the target exists
        return this._getScripts(skipReporter)
            .filter(({target}) => hasUniqueName(target, targetName))
            .map(({blockID}) => blockID);
    }

    /**
     * Returns all connected scripts in the project, identified by their hat block.
     */
    public getConnectedScripts(): Array<BlockID> {
        return this._getScripts(true)
            .filter((node) => node.isHatBlock())
            .map(({blockID}) => blockID);
    }

    /**
     * Alias for `getConnectedScripts`.
     */
    public getEventHandlers(): Array<BlockID> {
        return this.getConnectedScripts();
    }

    /**
     * Returns all unconnected scripts in the project, identified by their root block. Unconnected scripts never start
     * with a hat block, and are dead code.
     */
    public getUnconnectedScripts(): Array<BlockID> {
        const scripts = new Array<BlockID>();

        for (const node of this._getNodes()) {
            if (node.isTopLevel() && !node.isHatBlock()) {
                scripts.push(node.blockID);
            }
        }

        return scripts;
    }

    /**
     * Returns all statements that are root in a script, SUBSTACK or SUBSTACK2.
     */
    public getStacks(): Array<BlockID> {
        const stacks = new Array<BlockID>();

        for (const node of this._getNodes()) {
            if (node.isRootOfScriptOrSubstack() && node.isStackable()) {
                stacks.push(node.blockID);
            }
        }

        return stacks;
    }

    public getStacksOfScript(blockID: BlockID): Array<BlockID>;
    public getStacksOfScript(blockID: BlockID, includeDeleted: boolean): Array<BlockID | InputSelector>;

    /**
     * In the script rooted at the given statement, returns all statements that are root in the script, or in a SUBSTACK
     * or SUBSTACK2 in the script. If the given statement is the root of a script, the result array will contain that
     * statement. Otherwise, the array will only contain the statements that are root in a SUBSTACK or SUBSTACK2 of a
     * successor of the given statement.
     *
     * @param blockID The root of the script in which to search
     * @param includeDeleted If deleted (empty) substacks should be included in the result
     */
    public getStacksOfScript(blockID: BlockID, includeDeleted = false): Array<BlockID | InputSelector> {
        const stacks = new Array<BlockID | InputSelector>();

        const node = this._getNode(blockID);

        if (node instanceof VarListNode) {
            return stacks;
        }

        const workQueue = [node];

        while (workQueue.length > 0) {
            const current = workQueue.shift();

            if (current === null) {
                continue;
            }

            const blockID = current.blockID;

            if (current.isRootOfScriptOrSubstack()) {
                stacks.push(blockID);
            }

            workQueue.push(current.getNext());

            if (!current.isCBlock()) {
                continue;
            }

            const substackKeys = getInputKeys(current.block.opcode)
                .filter((key) => ["SUBSTACK", "SUBSTACK2"].includes(key));

            for (const key of substackKeys) {
                const substack = current.getInputNode(key);

                if (substack === null && includeDeleted) {
                    stacks.push({blockID, key});
                } else {
                    workQueue.push(substack);
                }
            }
        }

        return stacks;
    }

    /**
     * Returns all statements that are root in a SUBSTACK or SUBSTACK2.
     */
    public getSubstacks(): Array<BlockID> {
        const substacks = new Array<BlockID>();

        for (const node of this._getNodes()) {
            if (node.isStackable() && node.isRootOfSubstack()) {
                substacks.push(node.blockID);
            }
        }

        return substacks;
    }

    /**
     * Starting at the block with the given ID, follows the chain of `next` blocks until the very end, and returns
     * the IDs of all stackable blocks encountered along the way, in traversal order. The ID of the given block is
     * not included if `skipSelf` is `true`, otherwise it is included.
     *
     * @param blockID the ID of the block where to start
     * @param skipSelf whether to omit the `blockID` from the result
     */
    public getNextIDs(blockID: BlockID, skipSelf: boolean): Array<BlockID> {
        return this._getNode(blockID).getNextIDs(skipSelf);
    }

    /**
     * For a given block, returns the root of the script the block belongs to. Returns null for shadow blocks.
     *
     * @param blockID the ID of the block to query
     */
    public getScriptRoot(blockID: BlockID): BlockID | null {
        const root = this._getNode(blockID).getScriptRoot();
        return root ? root.blockID : null;
    }

    public getStackRoot(blockID: BlockID): BlockID {
        const root = this._getNode(blockID).getStackRoot();
        return root ? root.blockID : null;
    }

    /**
     * In the stack/slice starting with the given `blockID`, returns the ID of the last block in that stack/slice. Note
     * that `blockID` need not be a root block. If `blockID` is a reporter block, it returns `blockID`.
     *
     * @param blockID the stack/slice of interest
     */
    public getLastInSlice(blockID: BlockID): BlockID {
        return this._getNode(blockID).getLastID();
    }

    /**
     * Returns true iff the block with the given ID can be live code, false if it is dead code. In general, all blocks
     * of unconnected scripts are always dead code.
     *
     * @param blockID the block of interest
     */
    public canBeLive(blockID: BlockID): boolean {
        return this._getNode(blockID).canBeLive();
    }

    /**
     * For a given block, returns the unique name of the target it belongs to.
     *
     * @param blockID the ID of the block to query
     */
    public getTargetName(blockID: BlockID): UniqueTargetName {
        return getUniqueName(this._getNode(blockID).target);
    }

    private _getTargets(): Array<WrappedTarget> {
        return this._project.targets;
    }

    /**
     * Returns all targets in the project (including the stage).
     *
     * @param skipEmpty If `true`, excludes empty targets (i.e., containing no code)
     */
    public getTargets(skipEmpty = false): Array<UniqueTargetName> {
        return this._getTargets()
            .filter((target) => !skipEmpty || Object.keys(target.blocks).length > 0)
            .map((target) => getUniqueName(target));
    }

    /**
     * Returns all sprites in the project (i.e., without the stage).
     */
    public getSprites(): Array<UniqueTargetName> {
        return this._getTargets()
            .filter(({isStage}) => !isStage)
            .map(({name}) => name);
    }

    /**
     * Returns all fields in the project. This includes oval-shaped fields (of shadow blocks), and rectangular fields.
     */
    public getFields(): Array<FieldSelector> {
        const fields = new Array<FieldSelector>();

        for (const node of this._getNodes(false)) {
            for (const key of node.getFieldKeys()) {
                fields.push(({blockID: node.blockID, key}));
            }
        }

        return fields;
    }

    public getFieldsOfBlock(blockID: BlockID): Array<FieldSelector> {
        return this._getNode(blockID).getFieldKeys().map((key) => ({blockID, key}));
    }

    /**
     * Returns all possible values that can be selected in the specified field. If the parameter `skipCurrentValue`
     * is `true`, the result does not contain the currently selected value.
     *
     * @param blockID the ID of the block that has the field
     * @param key the key to identify the filed
     * @param skipCurrentValue whether to skip the currently selected field value
     */
    public getPossibleFieldValues({blockID, key}: FieldSelector, skipCurrentValue: boolean): Field[] {
        const node = this._getNode(blockID);
        return node.getPossibleFieldValues(key, skipCurrentValue);
    }

    private _getDropDowns(blockID: BlockID | null, skipIfObscured: boolean): Array<DropDownSelector> {
        const dropDowns = Array<DropDownSelector>();

        const nodes: Array<Node> = [];

        if (blockID === null) {
            nodes.push(...this._getNodes(false));
        } else {
            const node = this._getNode(blockID);
            const ovalDropDowns = node.getInputNodes(true).filter((node) => node.isShadow());
            nodes.push(node, ...ovalDropDowns);
        }

        for (const node of nodes) {
            if (node instanceof VarListNode) {
                continue;
            }

            if (skipIfObscured && node.isObscured()) {
                // If the block is obscured, it must also be a shadow block. It is OK to skip here already, and not
                // look at "BROADCAST_INPUT" because only "event_broadcast" and "event_broadcastandwait" can have it as
                // key, and both are not shadow blocks.
                continue;
            }

            const blockID = node.blockID;

            for (const key of node.getFieldKeys()) {
                dropDowns.push({blockID, key});
            }

            // Blocks of type "event_broadcast" and "event_broadcastandwait" have a primitive input of type
            // "BROADCAST_INPUT". But it behaves like a field and is drawn like a field... So we include it here.
            if (node.block.opcode === "event_broadcast" || node.block.opcode === "event_broadcastandwait") {
                if (skipIfObscured && isObscuredShadowInput(node.block['inputs']['BROADCAST_INPUT'])) {
                    continue;
                }

                dropDowns.push({blockID, key: "BROADCAST_INPUT"});
            }
        }

        return dropDowns;
    }

    /**
     * Returns all drop-down menus in the project. This includes oval-shaped fields (of shadow-blocks), rectangular
     * fields, and the input of type `BROADCAST_INPUT` (since it behaves like a drop-down menu). The parameter
     * `skipIfObscured` controls if obscured oval-shaped fields should be excluded.
     *
     * @param skipIfObscured whether to skip dropdown menus that are obscured by reporter blocks dropped on top of them
     */
    public getDropDowns(skipIfObscured: boolean): Array<DropDownSelector> {
        return this._getDropDowns(null, skipIfObscured);
    }

    /**
     * Returns all dropdown menus of the block with the given ID. The result includes:
     * - All rectangular dropdown menus on the block itself.
     * - All broadcast menus on the block itself.
     * - All oval dropdown menus (under the hood, this is a rectangular menu on a shadow block, which has a different
     *   block ID.)
     *
     * @param blockID The ID of the block for which the dropdown menus should be retrieved
     * @param skipIfObscured Whether an oval dropdown menu should be omitted if it is obscured by a reporter
     */
    public getDropDownsOfBlock(blockID: BlockID, skipIfObscured: boolean): Array<DropDownSelector> {
        return this._getDropDowns(blockID, skipIfObscured);
    }

    /**
     * Returns all possible values that can be selected in the specified drop-down menu. If the parameter
     * `skipCurrentValue` is `true`, the result does not contain the currently selected value.
     *
     * @param blockID the ID of the block that has the drop-down menu
     * @param key the key to identify the field
     * @param skipCurrentValue whether to skip the currently selected value
     */
    public getPossibleDropDownValues({blockID, key}: DropDownSelector, skipCurrentValue: boolean): Field[] {
        const node = this._getNode(blockID);
        return key !== "BROADCAST_INPUT"
            ? node.getPossibleFieldValues(key, skipCurrentValue)
            : node.getPossibleBroadcastInputs(skipCurrentValue)
                .map((broadcast) => broadcastInputToField(broadcast));
    }

    /**
     * Returns the variables of the given target. For sprites, this excludes stage variables.
     *
     * @param target the target to query
     */
    public getVariablesOfTarget(target: UniqueTargetName): Array<VariableID> {
        return Object.keys(this._getTarget(target).variables);
    }

    /**
     * Returns the variables of the stage.
     */
    public getStageVariables(): Array<VariableID> {
        return this.getVariablesOfTarget(STAGE_NAME);
    }

    /**
     * Returns the lists of the given target. For sprites, this excludes stage lists.
     *
     * @param target the target to query
     */
    public getListsOfTarget(target: UniqueTargetName): Array<ListID> {
        return Object.keys(this._getTarget(target).lists);
    }

    /**
     * Returns the lists of the stage.
     */
    public getStageLists(): Array<ListID> {
        return this.getListsOfTarget(STAGE_NAME);
    }

    private _getVariable(variableID: VariableID): [variable: Variable, isStage: boolean] {
        for (const target of this._project.targets) {
            for (const key of Object.keys(target.variables)) {
                if (variableID === key) {
                    return [target.variables[variableID], target.isStage];
                }
            }
        }

        throw new NoSuchVariableError(variableID);
    }

    private _getList(listID: ListID): [list: List, isStage: boolean] {
        for (const target of this._project.targets) {
            for (const key of Object.keys(target.lists)) {
                if (listID === key) {
                    return [target.lists[listID], target.isStage];
                }
            }
        }

        throw new NoSuchListError(listID);
    }

    //endregion
    //------------------------------------------------------------------------------------------------------------------
    //region Meta

    /**
     * Returns an object with metadata for the requested statement. The block IDs in the returned object are the same
     * as the ones used by the project. If `skipSubstacks` is `true,` the metadata of substack inputs is skipped. This
     * can be useful, e.g., if only the data for a C-block itself are desired.
     *
     * @param statement the ID of the statement to query
     * @param skipSubstack whether to skip metadata of substack inputs, defaults to `false`
     */
    public getStmtMeta(statement: BlockID, skipSubstack = false): BlockMeta {
        return this.getBlockMeta(statement, skipSubstack);
    }

    /**
     * Returns an object with metadata for the requested expression.
     *
     * @param exprSel the selector for the expression
     */
    public getExprMeta(exprSel: ExprSelector): Meta {
        const node = this._getNode(exprSel.blockID);
        return exprSel.key ? node.getInputMeta(exprSel.key) : node.getBlockMeta({substacks: false, nextBlocks: false});
    }

    /**
     * Returns an object with metadata for the requested block. The block IDs in the returned object are the same
     * as the ones used by the project. If `skipSubstacks` is `true`, the metadata of substack inputs is skipped. This
     * can be useful, e.g., if only the data for a C-block itself are desired.
     *
     * @param block the ID of the block to query
     * @param skipSubstack whether to skip metadata of substack inputs, defaults to `false`
     */
    public getBlockMeta(block: BlockID, skipSubstack = false): BlockMeta {
        return this._getNode(block).getBlockMeta({substacks: !skipSubstack, nextBlocks: false});
    }

    /**
     * Returns an object with metadata for the requested input.
     *
     * @param blockID the ID of the block that uses the input
     * @param key the key identifying the input
     */
    public getInputMeta({blockID, key}: InputSelector): InputMeta {
        return this._getNode(blockID).getInputMeta(key);
    }

    /**
     * Returns an object with metadata for the requested script. The script is identified by the ID of its root block.
     * If called with the ID of a non-root block, a "slice" of the script is returned, starting at the given block,
     * and ending at the last block in the script. The block IDs in the returned object are the same as the ones used
     * by the project.
     *
     * @param script the script to query
     */
    public getScriptMeta(script: BlockID): BlockMeta {
        const topLevelBlock = this._getNode(script);

        if (!topLevelBlock.isTopLevel) {
            throw new NoSuchScriptError(`Script with root "${script}" does not exist`);
        }

        return topLevelBlock.sliceToEnd();
    }

    /**
     * Returns an object with metadata for the requested stack of blocks/statements. The slice starts at the given
     * start point and contains the end point. The block IDs in the returned object are the same as the ones used by
     * the project.
     *
     * @param start the ID of the starting block
     * @param end the ID of the end block, or `null` (slice to the end, the default)
     */
    public getStackMeta(start: BlockID, end: BlockID | null = null): BlockMeta {
        return this._getNode(start).sliceTo(end);
    }

    /**
     * Returns the current state of the specified field.
     *
     * @param blockID the ID of the block to which the field belongs
     * @param key the key to identify the field
     */
    public getFieldValue({blockID, key}: FieldSelector): Field {
        const node = this._getNode(blockID);
        return node.getField(key);
    }

    /**
     * Returns the current state of the specified drop-down menu. Supports all fields, and primitive inputs with key
     * `"BROADCAST_INPUT"`.
     *
     * @param blockID the ID of the block the drop-down menu belongs to
     * @param key the key to identify the drop-down menu
     */
    public getDropDownValue({blockID, key}: DropDownSelector): Field {
        const node = this._getNode(blockID);

        if (key !== "BROADCAST_INPUT") {
            return node.getField(key);
        }

        const {input: [shadowType, unobscuredInput, obscuredInput]} = node.getInputMeta(key);
        const broadcastInput = shadowType === shadowTypes.unobscuredShadow ? unobscuredInput : obscuredInput;
        return broadcastInputToField(broadcastInput as BroadCastInput);
    }

    /**
     * Converts the specified variable to a reporter block.
     *
     * @param variableID the ID of the variable
     */
    public getVariableAsBlockMeta(variableID: VariableID): BlockMeta {
        const [variable, isStage] = this._getVariable(variableID);
        const blockID = this._generateFreshID("variable");
        const meta = emptyBlockMeta(blockID, blockID);
        meta.blocks[blockID] = [primitiveInputTypes.variable, variableName(variable), variableID, 0, 0];
        (isStage ? meta.stageVariables : meta.variables)[variableID] = variable;
        return deepCopy(meta);
    }

    /**
     * Converts the specified list to a reporter block.
     *
     * @param listID the ID of the list
     */
    public getListAsBlockMeta(listID: ListID): BlockMeta {
        const [list, isStage] = this._getList(listID);
        const blockID = this._generateFreshID("list");
        const meta = emptyBlockMeta(blockID, blockID);
        meta.blocks[blockID] = [primitiveInputTypes.list, listName(list), listID, 0, 0];
        (isStage ? meta.stageLists : meta.lists)[listID] = list;
        return deepCopy(meta);
    }

    /**
     * Converts the specified variable to an input.
     *
     * @param variableID the ID of the variable
     */
    public getVariableAsInputMeta(variableID: VariableID): InputMeta {
        const [variable, isStage] = this._getVariable(variableID);
        const variableInput: VariableInput = [primitiveInputTypes.variable, variableName(variable), variableID];
        const input: UnobscuredShadowInput = [shadowTypes.unobscuredShadow, variableInput];
        const meta = emptyInputMeta(input, false, false);
        (isStage ? meta.stageVariables : meta.variables)[variableID] = variable;
        return deepCopy(meta);
    }

    /**
     * Converts the specified list to an input.
     *
     * @param listID the ID of the list
     */
    public getListAsInputMeta(listID: ListID): InputMeta {
        const [list, isStage] = this._getList(listID);
        const listInput: ListInput = [primitiveInputTypes.list, listName(list), listID];
        const input: UnobscuredShadowInput = [shadowTypes.unobscuredShadow, listInput];
        const meta = emptyInputMeta(input, false, false);
        (isStage ? meta.stageLists : meta.lists)[listID] = list;
        return deepCopy(meta);
    }

    //endregion
    //------------------------------------------------------------------------------------------------------------------
}
