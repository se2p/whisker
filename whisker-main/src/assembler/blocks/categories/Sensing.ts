import {Block} from "../Block";
import {colorPickerInput, RGBString, ShadowInput, textInput} from "../Inputs";
import {Opcode, SensingBlockOpcode, sensingBlockOpcodes} from "../Opcode";
import {Key as KeyOption} from "./Events";
import {BlockWithShadowInput} from "../other/BlockWithShadowInput";
import {ShadowBlock} from "../other/ShadowBlock";
import {BlockWithField} from "../other/BlockWithField";
import uid from "scratch-vm/src/util/uid";
import {blockMeta} from "../BlockFactory";
import {EmptyObject} from "../../utils/Objects";
import {BlockMeta} from "../../utils/meta";
import {TargetName} from "../../project/Target";
import {STAGE_NAME} from "../../utils/selectors";

type None = EmptyObject;

export interface SensingBlock extends Block {
    opcode: SensingBlockOpcode;
}

type ObjectToTouch = Record<"TOUCHINGOBJECTMENU", ShadowInput>;

export interface SensingTouchingObject extends SensingBlock, BlockWithShadowInput {
    opcode: "sensing_touchingobject";
    inputs: ObjectToTouch;
    fields: None;
    shadow: false;
}

export function sensingTouchingObject(object: MouseOrEdgeOrSprite["TOUCHINGOBJECTMENU"][0] = "_mouse_"): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: SensingTouchingObject = {
        "opcode": "sensing_touchingobject",
        "next": null,
        "parent": null,
        "inputs": {
            "TOUCHINGOBJECTMENU": [
                1,
                menuID,
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: SensingTouchingObjectMenu = {
        "opcode": "sensing_touchingobjectmenu",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "TOUCHINGOBJECTMENU": [
                object,
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

type MouseOrEdgeOrSprite = Record<"TOUCHINGOBJECTMENU", [
    spriteName: string | "_mouse_" | "_edge_", blockID: null
]>;

export interface SensingTouchingObjectMenu extends SensingBlock, ShadowBlock {
    opcode: "sensing_touchingobjectmenu";
    fields: MouseOrEdgeOrSprite;
    inputs: None;
    shadow: true;
    next: null;
}

type Color = Record<"COLOR", ShadowInput>;
type Color1 = Color;
type Color2 = Record<"COLOR2", ShadowInput>;

export interface SensingTouchingColor extends SensingBlock {
    opcode: "sensing_touchingcolor";
    inputs: Color;
    fields: None;
    shadow: false;
}

export function sensingTouchingColor(color: RGBString = "#3faee2"): BlockMeta {
    const block: SensingTouchingColor = {
        "opcode": "sensing_touchingcolor",
        "next": null,
        "parent": null,
        "inputs": {
            "COLOR": colorPickerInput(color)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface SensingColorIsTouchingColor extends SensingBlock {
    opcode: "sensing_coloristouchingcolor";
    inputs: Color1 & Color2;
    fields: None;
    shadow: false;
}

export function sensingColorIsTouchingColor(color: RGBString = "#79ae71", color2: RGBString = "#e5c82a"): BlockMeta {
    const block: SensingColorIsTouchingColor = {
        "opcode": "sensing_coloristouchingcolor",
        "next": null,
        "parent": null,
        "inputs": {
            "COLOR": colorPickerInput(color),
            "COLOR2": colorPickerInput(color2)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Target = Record<"DISTANCETOMENU", ShadowInput>;

export interface SensingDistanceTo extends SensingBlock, BlockWithShadowInput {
    opcode: "sensing_distanceto";
    inputs: Target;
    fields: None;
}

export function sensingDistanceTo(object: MouseOrSprite["DISTANCETOMENU"][0] = "_mouse_"): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: SensingDistanceTo = {
        "opcode": "sensing_distanceto",
        "next": null,
        "parent": null,
        "inputs": {
            "DISTANCETOMENU": [
                1,
                menuID
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: SensingDistanceToMenu = {
        "opcode": "sensing_distancetomenu",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "DISTANCETOMENU": [
                object,
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

type MouseOrSprite = Record<"DISTANCETOMENU", [
    spriteName: "_mouse_" | string, blockID: null
]>;

export interface SensingDistanceToMenu extends SensingBlock, ShadowBlock {
    opcode: "sensing_distancetomenu";
    fields: MouseOrSprite;
    inputs: None;
    next: null;
    shadow: true;
}

type Question = Record<"QUESTION", ShadowInput>;

export interface SensingAskAndWait extends SensingBlock {
    opcode: "sensing_askandwait";
    inputs: Question;
    fields: None;
    shadow: false;
}

export function sensingAskAndWait(question = "What's your name?"): BlockMeta {
    const block: SensingAskAndWait = {
        "opcode": "sensing_askandwait",
        "next": null,
        "parent": null,
        "inputs": {
            "QUESTION": textInput(question)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface SensingAnswer extends SensingBlock {
    opcode: "sensing_answer";
    inputs: None;
    fields: None;
}

export function sensingAnswer(): BlockMeta {
    const block: SensingAnswer = {
        "opcode": "sensing_answer",
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

type Key = Record<"KEY_OPTION", ShadowInput>;

export interface SensingKeyPressed extends SensingBlock, BlockWithShadowInput {
    opcode: "sensing_keypressed";
    inputs: Key;
    fields: None;
    shadow: false;
}

export function sensingKeyPressed(key: PressedKey["KEY_OPTION"][0] = "space"): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: SensingKeyPressed = {
        "opcode": "sensing_keypressed",
        "next": null,
        "parent": null,
        "inputs": {
            "KEY_OPTION": [
                1,
                menuID
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: SensingKeyOptions = {
        "opcode": "sensing_keyoptions",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "KEY_OPTION": [
                key,
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

type PressedKey = Record<"KEY_OPTION", [
    pressedKey: KeyOption, blockID: null
]>;

export interface SensingKeyOptions extends SensingBlock, ShadowBlock {
    opcode: "sensing_keyoptions";
    fields: PressedKey;
    inputs: None;
    next: null;
    shadow: true;
}

interface SensingMouse extends SensingBlock {
    inputs: None;
    fields: None;
}

export interface SensingMouseDown extends SensingMouse {
    opcode: "sensing_mousedown";
}

export function sensingMouseDown(): BlockMeta {
    const block: SensingMouseDown = {
        "opcode": "sensing_mousedown",
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

export interface SensingMouseX extends SensingMouse {
    opcode: "sensing_mousex";
}

export function sensingMouseX(): BlockMeta {
    const block: SensingMouseX = {
        "opcode": "sensing_mousex",
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

export interface SensingMouseY extends SensingMouse {
    opcode: "sensing_mousey";
}

export function sensingMouseY(): BlockMeta {
    const block: SensingMouseY = {
        "opcode": "sensing_mousey",
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

type DragMode = Record<"DRAG_MODE", [
    dragMode: "draggable" | "not draggable", blockID: null
]>;

export interface SensingDragMode extends SensingBlock, BlockWithField {
    opcode: "sensing_setdragmode";
    fields: DragMode;
    inputs: None;
    shadow: false;
}

export function sensingDragMode(dragMode: DragMode["DRAG_MODE"][0] = "draggable"): BlockMeta {
    const block: SensingDragMode = {
        "opcode": "sensing_setdragmode",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "DRAG_MODE": [
                dragMode,
                null
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface SensingLoundness extends SensingBlock {
    opcode: "sensing_loudness";
    fields: None;
    inputs: None;
}

export function sensingLoudness(): BlockMeta {
    const block: SensingLoundness = {
        "opcode": "sensing_loudness",
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

export interface SensingTimer extends SensingBlock {
    opcode: "sensing_timer";
    fields: None;
    inputs: None;
}

export function sensingTimer(): BlockMeta {
    const block: SensingTimer = {
        "opcode": "sensing_timer",
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

export interface SensingResetTimer extends SensingBlock {
    opcode: "sensing_resettimer";
    inputs: None;
    fields: None;
    shadow: false;
}

export function sensingResetTimer(): BlockMeta {
    const block: SensingResetTimer = {
        "opcode": "sensing_resettimer",
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

type SpriteOrStage = Record<"OBJECT", ShadowInput>;

type Property = StageProperty | SpriteProperty;

export const spriteProperties = Object.freeze([
    "x position",
    "y position",
    "direction",
    "costume #",
    "costume name",
    "size",
    "volume",
] as const);

type SpriteProperty = Record<"PROPERTY", [
    variableName: typeof spriteProperties[number] | string,
    blockID: null
]>;

export const stageProperties = Object.freeze([
    "backdrop #",
    "backdrop name",
    "volume",
] as const);

type StageProperty = Record<"PROPERTY", [
    variableName: typeof stageProperties[number] | string,
    blockID: null
]>;

export interface SensingOf extends SensingBlock, BlockWithShadowInput, BlockWithField {
    opcode: "sensing_of";
    inputs: SpriteOrStage;
    fields: Property;
}

export function sensingOf(
    property: (typeof object extends typeof STAGE_NAME ? StageProperty : SpriteProperty)["PROPERTY"][0] = "backdrop #",
    object: SensedObject["OBJECT"][0] = STAGE_NAME
): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: SensingOf = {
        "opcode": "sensing_of",
        "next": null,
        "parent": null,
        "inputs": {
            "OBJECT": [
                1,
                menuID
            ]
        },
        "fields": {
            "PROPERTY": [
                property,
                null
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    const menu: SensingOfObjectMenu = {
        "opcode": "sensing_of_object_menu",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "OBJECT": [
                object,
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

type SensedObject = Record<"OBJECT", [
    targetName: TargetName, blockID: null
]>;

export interface SensingOfObjectMenu extends SensingBlock, ShadowBlock, BlockWithField {
    opcode: "sensing_of_object_menu";
    fields: SensedObject;
    inputs: None;
    next: null;
    shadow: true;
}

export const sensingCurrentOptions = Object.freeze([
    "YEAR",
    "MONTH",
    "DATE",
    "DAYOFWEEK",
    "HOUR",
    "MINUTE",
    "SECOND",
] as const);

type WhatToSense = Record<"CURRENTMENU", [
    whatToSense: typeof sensingCurrentOptions[number],
    objectID: null,
]>;

export interface SensingCurrent extends SensingBlock, BlockWithField {
    opcode: "sensing_current";
    inputs: None;
    fields: WhatToSense;
}

export function sensingCurrent(what: WhatToSense["CURRENTMENU"][0] = "YEAR"): BlockMeta {
    const block: SensingCurrent = {
        "opcode": "sensing_current",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "CURRENTMENU": [
                what,
                null
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface SensingDaysSince2000 extends SensingBlock {
    opcode: "sensing_dayssince2000";
    inputs: None;
    fields: None;
}

export function sensingDaysSince2000(): BlockMeta {
    const block: SensingDaysSince2000 = {
        "opcode": "sensing_dayssince2000",
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

export interface SensingUsername extends SensingBlock {
    opcode: "sensing_username";
    inputs: None;
    fields: None;
}

export function sensingUsername(): BlockMeta {
    const block: SensingUsername = {
        "opcode": "sensing_username",
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
 * Tells whether the given block is a sensing block.
 * https://en.scratch-wiki.info/wiki/Sensing_Blocks
 *
 * @param block the block to check
 */
export function isSensingBlock(block: Block): block is SensingBlock {
    return (sensingBlockOpcodes as readonly Opcode[]).includes(block.opcode);
}
