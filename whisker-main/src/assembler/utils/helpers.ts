import {ValidationError} from "./errors";
import projectValidator from "scratch-parser/lib/validate";
import {getUniqueName} from "./selectors";
import {Project} from "../project/Project";
import {BlockNode, node, VarListNode, WrappedTarget} from "../Node";
import {deepCopy, mapObject} from "./Objects";
import {Blocks, BroadcastID, Comments, ListID, Target, TargetName, VariableID} from "../project/Target";
import {Block, BlockID, isBlock, ScratchBlock} from "../blocks/Block";
import {MultiMap} from "./MultiMap";
import {deletedInput, isTopLevelDataBlock} from "../blocks/Inputs";
import uid from "scratch-vm/src/util/uid";
import {canBeOnTheStage} from "./connections";
import {getInputKeys} from "./blocks";

export type ID = BlockID | VariableID | ListID | BroadcastID;

/**
 * The `project.json` being modified, parsed as JavaScript object, and enriched with an AST-like API. The raw
 * `project.json` of a Scratch project contains the serialization of the project's AST (abstract syntax tree), among
 * other things. As a side effect of the serialization process, the object references between child and parent nodes in
 * the AST have been lost, and replaced by `BlockID`s. The `WrappedProject` recovers these object references using the
 * `BlockID`s.
 */
export type WrappedProject = Project<BlockNode, VarListNode, VarListNode>;

export function wrapProject(project: Readonly<Project>, generateFreshID: (oldID: ID) => ID = uid): WrappedProject {
    project = validate(project);
    project = disambiguateBlockIDs(project, generateFreshID);
    project = deleteCommentsFromProject(project);

    const wrappedProject = deepCopy(project, throwErrorIfValueUndefined) as unknown as WrappedProject;
    wrappedProject.targets = project.targets.map((target) => wrapTarget(target, wrappedProject));

    checkForProblems(wrappedProject);

    return wrappedProject;
}

/**
 * Takes a parsed `project.json` as input, and checks it against the
 * [SB3 schema definition](https://github.com/LLK/scratch-parser/tree/master/lib).
 * If successful, returns a validated `Project`. Otherwise, throws a `ValidationError`.
 *
 * @param project the project to validate
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function validate(project: {}): Project {
    return projectValidator(false, project, (error, validated) => {
        if (error) {
            if (error.sb3Errors) {
                const pretty = JSON.stringify(error.sb3Errors, null, 4);
                const message = `Could not parse as a valid SB3 project. Errors: ${pretty}`;
                throw new ValidationError(message);
            } else {
                // It's an SB2 project that contains errors...
                throw new ValidationError("Only version 3 projects are supported");
            }
        }

        if (validated.projectVersion !== 3) {
            throw new ValidationError("Only version 3 projects are supported");
        }

        return validated;
    });
}

export function disambiguateBlockIDs(project: Readonly<Project>, generateFreshID: (oldID: BlockID) => BlockID): Project {
    project = deepCopy(project);

    const duplicatesAcrossTargets = findDuplicateBlockIDs(project);

    for (const target of project.targets) {
        const targetName = getUniqueName(target);
        if (duplicatesAcrossTargets.has(targetName)) {
            const toRename = [...duplicatesAcrossTargets.get(targetName)];
            const oldToNew = Object.fromEntries(toRename.map((oldID) => [oldID, generateFreshID(oldID)]));
            target.blocks = renameIDs(target.blocks, oldToNew);
            target.comments = renameIDs(target.comments, oldToNew);
        }
    }

    return project;
}

export function renameIDs<T extends Blocks | Comments>(blocksOrComments: T, oldToNew: Record<string, string>): T {
    const oldIDs = Object.keys(oldToNew);

    if (oldIDs.length === 0) {
        return deepCopy<T>(blocksOrComments); // nothing to rename...
    }

    /*
     * Note: this implementation is rather crude. It converts the `blocks` object into a JSON string, and replaces
     * everything that looks like an ID, using a Regex. Because we are not considering context information, this
     * strategy fails when an ID just so happens to appear in an unexpected position, e.g., as input of a say-block.
     * Furthermore, we also use it to rename variable/list/broadcast IDs. These could have, by mere chance, the same
     * IDs as a block, leading to unintentional renames. While this will probably never happen, you can obviously
     * construct examples where it fails. But then again, Scratch's own uid function is already used as if it
     * generates globally unique IDs, even though there's a slim chance it sometimes doesn't...
     */
    const findOldIDs = new RegExp(oldIDs.map((oldID) => escape(oldID)).join("|"), "g");
    const renamed = JSON.stringify(blocksOrComments).replace(findOldIDs, (oldID) => oldToNew[oldID]);
    return JSON.parse(renamed);
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
function escape(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function findDuplicateBlockIDs(project: Readonly<Project>): MultiMap<TargetName, BlockID> {
    const knownIDs = new Set<BlockID>();
    const duplicatesPerTarget = new MultiMap<TargetName, BlockID>();

    for (const target of project.targets) {
        for (const blockID of Object.keys(target.blocks)) {
            if (knownIDs.has(blockID)) {
                duplicatesPerTarget.set(getUniqueName(target), blockID);
            } else {
                knownIDs.add(blockID);
            }
        }
    }

    return duplicatesPerTarget;
}

function deleteCommentsFromProject<T extends Project | WrappedProject>(project: T): T {
    project = deepCopy(project);

    for (const target of project.targets) {
        target.comments = {};

        for (const block of Object.values(target.blocks)) {
            if (isTopLevelDataBlock(block)) { // These blocks do not hold a reference to their comments.
                continue;
            }

            delete block.comment;
        }
    }

    return project;
}

export function throwErrorIfValueUndefined(key: any, value: any): any {
    if (typeof value === 'undefined') {
        throw new ValidationError(`Key "${key}" must not have an undefined value`);
    }

    return value;
}

export function checkForProblems(project: WrappedProject): void {
    checkForDanglingBlocks(project);
    checkForBrokenConnections(project);
    checkForBlacklistedBlocksOnTheStage(project);
}

function checkForDanglingBlocks(project: WrappedProject): void {
    for (const {isStage, name, blocks} of project.targets) {
        const validIDs = new Set(Object.keys(blocks));
        const referencedIds = new Set(Object.values(blocks).flatMap((node) => node.getReferencedBlockIDs()));

        for (const id of referencedIds) {
            if (!validIDs.has(id)) {
                // An unknown block is referenced.
                const targetName = isStage ? `stage` : `sprite "${name}"`;
                throw new ValidationError(`The ${targetName} has a dangling block "${id}"`);
            }
        }
    }
}

function checkForBrokenConnections(project: WrappedProject): void {
    for (const {isStage, name, blocks} of project.targets) {
        const targetName = isStage ? `the stage` : `the sprite "${name}"`;

        for (const [blockID, block] of Object.entries(blocks)) {
            if (block instanceof VarListNode) {
                continue;
            }

            const parent = block.getParent();
            if (parent === null) {
                if (!block.isTopLevel()) {
                    throw new ValidationError(`The block "${blockID}" on ${targetName} has a broken connection to its parent`);
                }
            } else if (parent.getNext() !== block && parent.hasInputNode(block) === null) {
                throw new ValidationError(`The block "${parent.blockID}" on ${targetName} does not reference "${blockID}" as next or input`);
            }

            const next = block.getNext();
            if (next !== null && next.getParent() !== block) {
                throw new ValidationError(`The block "${next.blockID}" on ${targetName} does not reference "${blockID}" as parent`);
            }
        }
    }
}

function checkForBlacklistedBlocksOnTheStage(project: WrappedProject): void {
    const stage = project.targets.find((s) => s.isStage);
    for (const block of Object.values(stage.blocks).map(({block}) => block)) {
        if (!canBeOnTheStage(block)) {
            const opcode = isBlock(block) ? block.opcode : "toplevel variable/list";
            throw new ValidationError(`The stage must not contain a block of type "${opcode}"`);
        }
    }
}

function wrapTarget(target: Readonly<Target>, wrappedProject: Readonly<WrappedProject>): WrappedTarget {
    const wrappedTarget = deepCopy(target) as unknown as WrappedTarget;
    const wrapBlock = (block: ScratchBlock, blockID: BlockID) => node(blockID, block, wrappedTarget, wrappedProject);
    wrappedTarget.blocks = mapObject(target.blocks, wrapBlock);
    return wrappedTarget;
}

export function canonicalizeInputs(block: Block): Block {
    block = deepCopy(block);

    // For substacks and boolean inputs, the input key is sometimes missing entirely if the input is empty.
    // We canonicalize the representation by explicitly adding a key and representing a missing input via a dummy.
    // The dummy is also used in Scratch, but only if an input was added and then deleted again.
    for (const key of getInputKeys(block.opcode)) {
        if (!(key in block.inputs)) {
            block.inputs[key] = deletedInput(); // dummy input
        }
    }

    return block;
}
