import {Target, TargetName} from "../project/Target";
import {BlockID} from "../blocks/Block";
import {ExprKey, InputKey} from "../blocks/Inputs";
import {FieldKey} from "../blocks/Fields";

/**
 * The unique name of a target. Equals the `name` property for sprites, and the `STAGE_NAME` constant for the stage.
 *
 * @see Sprite.name
 * @see STAGE_NAME
 */
export type UniqueTargetName = TargetName;

/**
 * Unique target name for the stage. (The stage has the name "Stage", but sprites can also have the name "Stage".)
 * No sprite is allowed to have the name "_stage_".
 */
export const STAGE_NAME = "_stage_" as const;

export function getUniqueName<B, V, L>({isStage, name}: Target<B, V, L>): UniqueTargetName {
    return isStage ? STAGE_NAME : name;
}

export function hasUniqueName<B, V, L>({isStage, name}: Target<B, V, L>, uniqueName: UniqueTargetName): boolean {
    return isStage ? uniqueName === STAGE_NAME : uniqueName === name;
}

export const adjacencyKeys = Object.freeze([
    "parent",
    "next",
    "SUBSTACK",
    "SUBSTACK2",
] as const);

export type Adjacency = typeof adjacencyKeys[number];

interface Selector {
    blockID: BlockID;
}

export interface StmtInsertionPoint extends Selector {
    key: Adjacency;
}

/**
 * Identifies an input via its parent block and an input key.
 */
export interface InputSelector extends Selector {
    key: InputKey;
}

/**
 * Identifies an expression. If two expression selectors are structurally equal, they refer to the same expression.
 * However, the same expression can be identified by two structurally different selectors. For example, a reporter
 * block can be identified by:
 *  1. its blockID alone (no `key` being given), or
 *  2. the blockID of its parent along with the input key.
 *
 * Primitive inputs are always identified using the second variant.
 */
export interface ExprSelector extends Selector {
    key?: ExprKey;
}

export type ConnectedExprSelector = Required<ExprSelector>;

export interface FieldSelector extends Selector {
    key: FieldKey;
}

export interface DropDownSelector extends Selector {
    key: DropDownKey;
}

export type DropDownKey = FieldKey | "BROADCAST_INPUT";
