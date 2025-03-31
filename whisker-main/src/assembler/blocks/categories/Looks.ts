import {Block} from "../Block";
import {mathIntegerInput, mathNumberInput, ShadowInput, textInput} from "../Inputs";
import {LooksBlockOpcode, looksBlockOpcodes, Opcode} from "../Opcode";
import {BlockWithShadowInput} from "../other/BlockWithShadowInput";
import {ShadowBlock} from "../other/ShadowBlock";
import {BlockWithField} from "../other/BlockWithField";
import uid from "scratch-vm/src/util/uid";
import {blockMeta} from "../BlockFactory";
import {EmptyObject} from "../../utils/Objects";
import {BlockMeta} from "../../utils/meta";

type None = EmptyObject;

export interface LooksBlock extends Block {
    opcode: LooksBlockOpcode;
}

export interface LooksSize extends LooksBlock {
    opcode: "looks_size";
    inputs: None;
    fields: None;
    shadow: false,
}

export function looksSize(): BlockMeta {
    const block: LooksSize = {
        "opcode": "looks_size",
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

type Message = Record<"MESSAGE", ShadowInput>;
type Seconds = Record<"SECS", ShadowInput>;

interface LooksSayThinkForSecs extends LooksBlock {
    inputs: Message & Seconds;
    fields: None;
    shadow: false;
}

export interface LooksSayForSecs extends LooksSayThinkForSecs {
    opcode: "looks_sayforsecs";
}

export function looksSayForSecs(message = "Hello!", secs = 2): BlockMeta {
    const block: LooksSayForSecs = {
        "opcode": "looks_sayforsecs",
        "next": null,
        "parent": null,
        "inputs": {
            "MESSAGE": textInput(message),
            "SECS": mathNumberInput(secs),
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface LooksThinkForSecs extends LooksSayThinkForSecs {
    opcode: "looks_thinkforsecs";
}

export function looksThinkForSecs(message = "Hmm...", secs = 2): BlockMeta {
    const block: LooksThinkForSecs = {
        "opcode": "looks_thinkforsecs",
        "next": null,
        "parent": null,
        "inputs": {
            "MESSAGE": textInput(message),
            "SECS": mathNumberInput(secs)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface LooksSayThink extends LooksBlock {
    inputs: Message;
    fields: None;
    shadow: false;
}

export interface LooksSay extends LooksSayThink {
    opcode: "looks_say";
}

export function looksSay(message = "Hello!"): BlockMeta {
    const block: LooksSay = {
        "opcode": "looks_say",
        "next": null,
        "parent": null,
        "inputs": {
            "MESSAGE": textInput(message),
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface LooksThink extends LooksSayThink {
    opcode: "looks_think";
}

export function looksThink(message = "Hmm..."): BlockMeta {
    const block: LooksThink = {
        "opcode": "looks_think",
        "next": null,
        "parent": null,
        "inputs": {
            "MESSAGE": textInput(message),
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Costume = Record<"COSTUME", ShadowInput>;

export interface LooksSwitchCostumeTo extends LooksBlock, BlockWithShadowInput {
    opcode: "looks_switchcostumeto";
    inputs: Costume;
    fields: None;
    shadow: false;
}

export function looksSwitchCostumeTo(costumeName = "costume2"): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: LooksSwitchCostumeTo = {
        "opcode": "looks_switchcostumeto",
        "next": null,
        "parent": null,
        "inputs": {
            "COSTUME": [
                1,
                menuID
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: LooksCostume = {
        "opcode": "looks_costume",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "COSTUME": [
                costumeName,
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

type CostumeChoice = Record<"COSTUME", [name: string, blockID: null]>;

export interface LooksCostume extends LooksBlock, ShadowBlock {
    opcode: "looks_costume";
    fields: CostumeChoice;
    inputs: None;
    shadow: true;
    next: null;
}

export interface LooksNextCostume extends LooksBlock {
    opcode: "looks_nextcostume";
    inputs: None;
    fields: None;
    shadow: false;
}

export function looksNextCostume(): BlockMeta {
    const block: LooksNextCostume = {
        "opcode": "looks_nextcostume",
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

type Backdrop = Record<"BACKDROP", ShadowInput>;

interface LooksSwitchBackdrop extends LooksBlock, BlockWithShadowInput {
    opcode: "looks_switchbackdropto" | "looks_switchbackdroptoandwait";
    inputs: Backdrop;
    fields: None;
    shadow: false;
}

export interface LooksSwitchBackdropTo extends LooksSwitchBackdrop {
    opcode: "looks_switchbackdropto";
}

export function looksSwitchBackdropTo(backdropName = "backdrop1"): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: LooksSwitchBackdropTo = {
        "opcode": "looks_switchbackdropto",
        "next": null,
        "parent": null,
        "inputs": {
            "BACKDROP": [
                1,
                menuID
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: LooksBackdrops = {
        "opcode": "looks_backdrops",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "BACKDROP": [
                backdropName,
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

// only for the stage!
export interface LooksSwitchBackdropAndWait extends LooksSwitchBackdrop {
    opcode: "looks_switchbackdroptoandwait";
}

export function looksSwitchBackdropAndWait(backdropName = "backdrop1"): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: LooksSwitchBackdropAndWait = {
        "opcode": "looks_switchbackdroptoandwait",
        "next": null,
        "parent": null,
        "inputs": {
            "BACKDROP": [
                1,
                menuID,
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: LooksBackdrops = {
        "opcode": "looks_backdrops",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "BACKDROP": [
                backdropName,
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

type BackdropChoice = Record<"BACKDROP", [
    name: "next backdrop" | "previous backdrop" | "random backdrop" | string,
    blockID: null
]>;

export interface LooksBackdrops extends LooksBlock, ShadowBlock {
    opcode: "looks_backdrops";
    fields: BackdropChoice;
    inputs: None;
    shadow: true;
    next: null;
}

export interface LooksNextBackdrop extends LooksBlock {
    opcode: "looks_nextbackdrop";
    inputs: None;
    fields: None;
    shadow: false;
}

export function looksNextBackdrop(): BlockMeta {
    const block: LooksNextBackdrop = {
        "opcode": "looks_nextbackdrop",
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

export interface LooksChangeSizeBy extends LooksBlock {
    opcode: "looks_changesizeby";
    inputs: Change;
    fields: None;
    shadow: false;
}

export function looksChangeSizeBy(change = 10): BlockMeta {
    const block: LooksChangeSizeBy = {
        "opcode": "looks_changesizeby",
        "next": null,
        "parent": null,
        "inputs": {
            "CHANGE": mathNumberInput(change)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Size = Record<"SIZE", ShadowInput>;

export interface LooksSetSizeTo extends LooksBlock {
    opcode: "looks_setsizeto";
    inputs: Size;
    fields: None;
    shadow: false;
}

export function looksSetSizeTo(size = 100): BlockMeta {
    const block: LooksSetSizeTo = {
        "opcode": "looks_setsizeto",
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

type Change = Record<"CHANGE", ShadowInput>;

export const looksEffects = Object.freeze([
    "COLOR",
    "FISHEYE",
    "WHIRL",
    "PIXELATE",
    "MOSAIC",
    "BRIGHTNESS",
    "GHOST",
] as const);

type Effect = Record<"EFFECT", [
    effect: typeof looksEffects[number],
    blockID: null
]>;

export interface LooksChangeEffectBy extends LooksBlock, BlockWithField {
    opcode: "looks_changeeffectby";
    inputs: Change;
    fields: Effect;
    shadow: false;
}

export function looksChangeEffectBy(effect: Effect["EFFECT"][0] = "COLOR", change = 25): BlockMeta {
    const block: LooksChangeEffectBy = {
        "opcode": "looks_changeeffectby",
        "next": null,
        "parent": null,
        "inputs": {
            "CHANGE": mathNumberInput(change)
        },
        "fields": {
            "EFFECT": [
                effect,
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

type Value = Record<"VALUE", ShadowInput>;

export interface LooksSetEffectTo extends LooksBlock, BlockWithField {
    opcode: "looks_seteffectto";
    inputs: Value;
    fields: Effect;
    shadow: false;
}

export function looksSetEffectTo(effect: Effect["EFFECT"][0] = "COLOR", value = 0): BlockMeta {
    const block: LooksSetEffectTo = {
        "opcode": "looks_seteffectto",
        "next": null,
        "parent": null,
        "inputs": {
            "VALUE": mathNumberInput(value)
        },
        "fields": {
            "EFFECT": [
                effect,
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

export interface LooksClearGraphicEffects extends LooksBlock {
    opcode: "looks_cleargraphiceffects";
    inputs: None;
    fields: None;
    shadow: false;
}

export function looksClearGraphicEffects(): BlockMeta {
    const block: LooksClearGraphicEffects = {
        "opcode": "looks_cleargraphiceffects",
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

export interface LooksShow extends LooksBlock {
    opcode: "looks_show";
    inputs: None;
    fields: None;
    shadow: false;
}

export function looksShow(): BlockMeta {
    const block: LooksShow = {
        "opcode": "looks_show",
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

export interface LooksHide extends LooksBlock {
    opcode: "looks_hide";
    inputs: None;
    fields: None;
    shadow: false;
}

export function looksHide(): BlockMeta {
    const block: LooksHide = {
        "opcode": "looks_hide",
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

type FrontOrBack = Record<"FRONT_BACK", [
    frontOrBack: "front" | "back", blockID: null
]>;

export interface LooksGotoFrontBack extends LooksBlock, BlockWithField {
    opcode: "looks_gotofrontback";
    inputs: None;
    fields: FrontOrBack;
    shadow: false;
}

export function looksGotoFrontBack(frontOrBack: FrontOrBack["FRONT_BACK"][0] = "front"): BlockMeta {
    const block: LooksGotoFrontBack = {
        "opcode": "looks_gotofrontback",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "FRONT_BACK": [
                frontOrBack,
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

type Layers = Record<"NUM", ShadowInput>;

type ForwardOrBackward = Record<"FORWARD_BACKWARD", [
    forwardOrBackward: "forward" | "backward",
    blockID: null
]>;

export interface LooksGoForwardBackwardLayers extends LooksBlock, BlockWithField {
    opcode: "looks_goforwardbackwardlayers";
    inputs: Layers;
    fields: ForwardOrBackward;
    shadow: false;
}

export function looksGoForwardBackwardLayers(
    forwardBackward: ForwardOrBackward["FORWARD_BACKWARD"][0] = "forward",
    num = 1
): BlockMeta {
    const block: LooksGoForwardBackwardLayers = {
        "opcode": "looks_goforwardbackwardlayers",
        "next": null,
        "parent": null,
        "inputs": {
            "NUM": mathIntegerInput(num)
        },
        "fields": {
            "FORWARD_BACKWARD": [
                forwardBackward,
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

type NumberOrName = Record<"NUMBER_NAME", [
    numberOrName: "number" | "name", blockID: null
]>;

interface LooksCostumeBackdropNumberName extends LooksBlock, BlockWithField {
    opcode: "looks_costumenumbername" | "looks_backdropnumbername";
    inputs: None;
    fields: NumberOrName;
    shadow: false;
}

export interface LooksCostumeNumberName extends LooksCostumeBackdropNumberName {
    opcode: "looks_costumenumbername";
}

export function looksCostumeNumberName(numberName: NumberOrName["NUMBER_NAME"][0] = "number"): BlockMeta {
    const block: LooksCostumeNumberName = {
        "opcode": "looks_costumenumbername",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "NUMBER_NAME": [
                numberName,
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

export interface LooksBackdropNumberName extends LooksCostumeBackdropNumberName {
    opcode: "looks_backdropnumbername";
}

export function looksBackdropNumberName(numberName: NumberOrName["NUMBER_NAME"][0] = "number"): BlockMeta {
    const block: LooksBackdropNumberName = {
        "opcode": "looks_backdropnumbername",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "NUMBER_NAME": [
                numberName,
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

/**
 * Tells whether the given block is a looks block.
 * https://en.scratch-wiki.info/wiki/Looks_Blocks
 *
 * @param block the block to check
 */
export function isLooksBlock(block: Block): block is LooksBlock {
    return (looksBlockOpcodes as readonly Opcode[]).includes(block.opcode);
}
