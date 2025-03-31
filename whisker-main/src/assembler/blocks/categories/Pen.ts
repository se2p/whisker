import {Block} from "../Block";
import {PenBlockOpcode} from "../Opcode";
import {colorPickerInput, mathNumberInput, RGBString, ShadowInput} from "../Inputs";
import {ShadowBlock} from "../other/ShadowBlock";
import {blockMeta} from "../BlockFactory";
import uid from "scratch-vm/src/util/uid";
import {EmptyObject} from "../../utils/Objects";
import {BlockMeta} from "../../utils/meta";

type None = EmptyObject;

export interface PenBlock extends Block {
    opcode: PenBlockOpcode;
}

export interface PenClear extends PenBlock {
    opcode: "pen_clear",
    inputs: None,
    fields: None,
    shadow: false,
}

export function penClear(): BlockMeta {
    const block: PenClear = {
        "opcode": "pen_clear",
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

export interface PenStamp extends PenBlock {
    opcode: "pen_stamp",
    inputs: None,
    fields: None,
    shadow: false,
}

export function penStamp(): BlockMeta {
    const block: PenStamp = {
        "opcode": "pen_stamp",
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

export interface PenDown extends PenBlock {
    opcode: "pen_penDown",
    inputs: None,
    fields: None,
    shadow: false,
}

export function penDown(): BlockMeta {
    const block: PenDown = {
        "opcode": "pen_penDown",
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

export interface PenUp extends PenBlock {
    opcode: "pen_penUp",
    inputs: None,
    fields: None,
    shadow: false,
}

export function penUp(): BlockMeta {
    const block: PenUp = {
        "opcode": "pen_penUp",
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

type Color = Record<"COLOR", ShadowInput>;

export interface SetPenColorToColor extends PenBlock {
    opcode: "pen_setPenColorToColor",
    inputs: Color,
    fields: None,
    shadow: false,
}

export function setPenColorToColor(color: RGBString = "#ee23ea"): BlockMeta {
    const block: SetPenColorToColor = {
        "opcode": "pen_setPenColorToColor",
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

type ColorParam = Record<"COLOR_PARAM", ShadowInput>;
type Value = Record<"VALUE", ShadowInput>;

export interface ChangePenColorParamBy extends PenBlock {
    opcode: "pen_changePenColorParamBy",
    inputs: ColorParam & Value,
    fields: None,
    shadow: false,
}

export function changePenColorParamBy(colorParam: ColorParamChoice["colorParam"][0] = "color", value = 10): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: ChangePenColorParamBy = {
        "opcode": "pen_changePenColorParamBy",
        "next": null,
        "parent": null,
        "inputs": {
            "COLOR_PARAM": [
                1,
                menuID
            ],
            "VALUE": mathNumberInput(value)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: PenMenuColorParam = {
        "opcode": "pen_menu_colorParam",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "colorParam": [
                colorParam,
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

export const colorParamOptions = Object.freeze([
    "color",
    "saturation",
    "brightness",
    "transparency",
] as const);

type ColorParamOption = typeof colorParamOptions[number];

type ColorParamChoice = Record<"colorParam", [
    colorParam: ColorParamOption,
    blockID: null,
]>;

export interface PenMenuColorParam extends PenBlock, ShadowBlock {
    opcode: "pen_menu_colorParam",
    next: null,
    inputs: None,
    fields: ColorParamChoice,
    shadow: true,
}

export interface SetPenColorParamTo extends PenBlock {
    opcode: "pen_setPenColorParamTo",
    inputs: ColorParam & Value,
    shadow: false,
    fields: None,
}

export function setPenColorParamTo(colorParam: ColorParamChoice["colorParam"][0] = "color", value = 50): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: SetPenColorParamTo = {
        "opcode": "pen_setPenColorParamTo",
        "next": null,
        "parent": null,
        "inputs": {
            "COLOR_PARAM": [
                1,
                menuID,
            ],
            "VALUE": mathNumberInput(value)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: PenMenuColorParam = {
        "opcode": "pen_menu_colorParam",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "colorParam": [
                colorParam,
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

type Size = Record<"SIZE", ShadowInput>;

export interface ChangePenSizeBy extends PenBlock {
    opcode: "pen_changePenSizeBy",
    inputs: Size,
    shadow: false,
    fields: None,
}

export function changePenSizeBy(size = 1): BlockMeta {
    const block: ChangePenSizeBy = {
        "opcode": "pen_changePenSizeBy",
        "next": null,
        "parent": null,
        "inputs": {
            "SIZE": mathNumberInput(size)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface SetPenSizeTo extends PenBlock {
    opcode: "pen_setPenSizeTo",
    inputs: Size,
    shadow: false,
    fields: None,
}

export function setPenSizeTo(size = 1): BlockMeta {
    const block: SetPenSizeTo = {
        "opcode": "pen_setPenSizeTo",
        "next": null,
        "parent": null,
        "inputs": {
            "SIZE": mathNumberInput(size)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}
