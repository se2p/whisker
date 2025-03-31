import {Block} from "../Block";
import {
    DeletedInput,
    Input,
    mathPositiveNumberInput,
    mathWholeNumberInput,
    NoShadowInput,
    ShadowInput
} from "../Inputs";
import {ControlBlockOpcode, controlBlockOpcodes, Opcode} from "../Opcode";
import {BlockWithShadowInput} from "../other/BlockWithShadowInput";
import {ShadowBlock} from "../other/ShadowBlock";
import {BlockWithField} from "../other/BlockWithField";
import uid from "scratch-vm/src/util/uid";
import {blockMeta} from "../BlockFactory";
import {EmptyObject} from "../../utils/Objects";
import {BlockMeta} from "../../utils/meta";

type None = EmptyObject;
type Optional<T extends Record<string, Input>> = Partial<T> | Record<keyof T, DeletedInput>;

export interface ControlBlock extends Block {
    opcode: ControlBlockOpcode;
}

type Duration = Record<"DURATION", ShadowInput>;

export interface ControlWait extends ControlBlock {
    opcode: "control_wait";
    inputs: Duration;
    fields: None;
    shadow: false;
}

export function controlWait(duration = 1): BlockMeta {
    const block: ControlWait = {
        "opcode": "control_wait",
        "next": null,
        "parent": null,
        "inputs": {
            "DURATION": mathPositiveNumberInput(duration)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Repetitions = Record<"TIMES", ShadowInput>;
type LoopBody = Optional<Record<"SUBSTACK", NoShadowInput>>;

export interface ControlRepeat extends ControlBlock {
    opcode: "control_repeat";
    inputs: Repetitions & LoopBody;
    fields: None;
    shadow: false;
}

export function controlRepeat(times = 10): BlockMeta {
    const block: ControlRepeat = {
        "opcode": "control_repeat",
        "next": null,
        "parent": null,
        "inputs": {
            "TIMES": mathWholeNumberInput(times)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface ControlForever extends ControlBlock {
    opcode: "control_forever";
    inputs: LoopBody;
    fields: None;
    shadow: false;
}

export function controlForever(): BlockMeta {
    const block: ControlForever = {
        "opcode": "control_forever",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Condition = Optional<Record<"CONDITION", NoShadowInput>>;
type ThenBranch = Optional<Record<"SUBSTACK", NoShadowInput>>;
type ElseBranch = Optional<Record<"SUBSTACK2", NoShadowInput>>;

export interface ControlIf extends ControlBlock {
    opcode: "control_if";
    inputs: Condition & ThenBranch;
    fields: None;
    shadow: false;
}

export function controlIf(): BlockMeta {
    const block: ControlIf = {
        "opcode": "control_if",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface ControlIfElse extends ControlBlock {
    opcode: "control_if_else";
    inputs: Condition & ThenBranch & ElseBranch;
    fields: None;
    shadow: false;
}

export function controlIfElse(): BlockMeta {
    const block: ControlIfElse = {
        "opcode": "control_if_else",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface ControlWaitUntil extends ControlBlock {
    opcode: "control_wait_until";
    inputs: Condition;
    fields: None;
    shadow: false;
}

export function controlWaitUntil(): BlockMeta {
    const block: ControlWaitUntil = {
        "opcode": "control_wait_until",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block
    });
}

export interface ControlRepeatUntil extends ControlBlock {
    opcode: "control_repeat_until";
    inputs: Condition & LoopBody;
    fields: None;
    shadow: false;
}

export function controlRepeatUntil(): BlockMeta {
    const block: ControlRepeatUntil = {
        "opcode": "control_repeat_until",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type WhatToStop = Record<"STOP_OPTION", StopOption>;
type StopOption = [
    scripts: "all" | "this script" | "other scripts in sprite",
    blockID: null
];

export interface ControlStop extends ControlBlock, BlockWithField {
    opcode: "control_stop";
    inputs: None;
    fields: WhatToStop;
    shadow: false;
}

export function controlStop(stopOption: StopOption[0] = "all"): BlockMeta {
    const block: ControlStop = {
        "opcode": "control_stop",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "STOP_OPTION": [
                stopOption,
                null
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block
    });
}

type CloneOption = Record<"CLONE_OPTION", ShadowInput>;

export interface ControlCreateCloneOf extends ControlBlock, BlockWithShadowInput {
    opcode: "control_create_clone_of";
    inputs: CloneOption;
    fields: None;
    shadow: false;
}

export function controlCreateCloneOf(sprite: SpriteChoice["CLONE_OPTION"][0] = "_myself_"): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: ControlCreateCloneOf = {
        "opcode": "control_create_clone_of",
        "next": null,
        "parent": null,
        "inputs": {
            "CLONE_OPTION": [
                1,
                menuID
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: ControlCreateCloneOfMenu = {
        "opcode": "control_create_clone_of_menu",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "CLONE_OPTION": [
                sprite,
                null
            ]
        },
        "shadow": true,
        "topLevel": false
    };

    return blockMeta({
        [blockID]: block,
        [menuID]: menu,
    });
}

type SpriteChoice = Record<"CLONE_OPTION", [
    spriteName: "_myself_" | string,
    blockID: null
]>;

export interface ControlCreateCloneOfMenu extends ControlBlock, ShadowBlock {
    opcode: "control_create_clone_of_menu";
    fields: SpriteChoice;
    inputs: None;
    next: null;
    shadow: true;
}

export interface ControlDeleteThisClone extends ControlBlock {
    opcode: "control_delete_this_clone";
    inputs: None;
    fields: None;
    shadow: false;
}

export function controlDeleteThisClone(): BlockMeta {
    const block: ControlDeleteThisClone = {
        "opcode": "control_delete_this_clone",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface ControlStartAsClone extends ControlBlock {
    opcode: "control_start_as_clone";
    inputs: None;
    fields: None;
    shadow: false;
}

export function controlStartAsClone(): BlockMeta {
    const block: ControlStartAsClone = {
        "opcode": "control_start_as_clone",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

/**
 * Tells whether the given block is a control block.
 * https://en.scratch-wiki.info/wiki/Control_Blocks
 *
 * @param block the block to check
 */
export function isControlBlock(block: Block): block is ControlBlock {
    return (controlBlockOpcodes as readonly Opcode[]).includes(block.opcode);
}
