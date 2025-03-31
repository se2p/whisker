import {mathNumberInput, ShadowInput} from "../Inputs";
import {Block} from "../Block";
import {Opcode, SoundBlockOpcode, soundBlockOpcodes} from "../Opcode";
import {BlockWithShadowInput} from "../other/BlockWithShadowInput";
import {ShadowBlock} from "../other/ShadowBlock";
import {BlockWithField} from "../other/BlockWithField";
import uid from "scratch-vm/src/util/uid";
import {blockMeta} from "../BlockFactory";
import {EmptyObject} from "../../utils/Objects";
import {BlockMeta} from "../../utils/meta";

type None = EmptyObject;

export interface SoundBlock extends Block {
    opcode: SoundBlockOpcode;
}

type Sound = Record<"SOUND_MENU", ShadowInput>;

export interface SoundPlayUntilDone extends SoundBlock, BlockWithShadowInput {
    opcode: "sound_playuntildone";
    inputs: Sound;
    fields: None;
    shadow: false;
}

export function soundPlayUntilDone(soundName = "Meow"): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: SoundPlayUntilDone = {
        "opcode": "sound_playuntildone",
        "next": null,
        "parent": null,
        "inputs": {
            "SOUND_MENU": [
                1,
                menuID
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: SoundsMenu = {
        "opcode": "sound_sounds_menu",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "SOUND_MENU": [
                soundName,
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

export interface SoundPlay extends SoundBlock, BlockWithShadowInput {
    opcode: "sound_play";
    inputs: Sound;
    fields: None;
    shadow: false;
}

export function soundPlay(soundName = "Meow"): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: SoundPlay = {
        "opcode": "sound_play",
        "next": null,
        "parent": null,
        "inputs": {
            "SOUND_MENU": [
                1,
                menuID
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: SoundsMenu = {
        "opcode": "sound_sounds_menu",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "SOUND_MENU": [
                soundName,
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

type SoundChoice = Record<"SOUND_MENU", [
    soundName: string, blockID: null
]>;

export interface SoundsMenu extends SoundBlock, ShadowBlock {
    opcode: "sound_sounds_menu";
    fields: SoundChoice;
    shadow: true;
    inputs: None;
    next: null;
}

export interface SoundStopAllSounds extends SoundBlock {
    opcode: "sound_stopallsounds";
    inputs: None;
    fields: None;
    shadow: false;
}

export function soundStopAllSounds(): BlockMeta {
    const block: SoundStopAllSounds = {
        "opcode": "sound_stopallsounds",
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

type Value = Record<"VALUE", ShadowInput>;

export const soundEffects = Object.freeze(["PITCH", "PAN"] as const);

type EffectName = Record<"EFFECT", [
    effectName: typeof soundEffects[number], objectID: null
]>;

export interface SoundChangeEffectBy extends SoundBlock, BlockWithField {
    opcode: "sound_changeeffectby";
    inputs: Value;
    fields: EffectName;
}

export function soundChangeEffectBy(effect: EffectName["EFFECT"][0] = "PITCH", value = 10): BlockMeta {
    const block: SoundChangeEffectBy = {
        "opcode": "sound_changeeffectby",
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
        [uid()]: block
    });
}

export interface SoundSetEffectTo extends SoundBlock, BlockWithField {
    opcode: "sound_seteffectto";
    inputs: Value;
    fields: EffectName;
}

export function soundSetEffectTo(effect: EffectName["EFFECT"][0] = "PITCH", value = 100): BlockMeta {
    const block: SoundSetEffectTo = {
        "opcode": "sound_seteffectto",
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
        [uid()]: block
    });
}

export interface SoundClearEffects extends SoundBlock {
    opcode: "sound_cleareffects";
    inputs: None;
    fields: None;
}

export function soundClearEffects(): BlockMeta {
    const block: SoundClearEffects = {
        "opcode": "sound_cleareffects",
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

type Volume = Record<"VOLUME", ShadowInput>;

export interface SoundChangeVolumeBy extends SoundBlock {
    opcode: "sound_changevolumeby";
    inputs: Volume;
    fields: None;
}

export function soundChangeVolumeBy(volume = -10): BlockMeta {
    const block: SoundChangeVolumeBy = {
        "opcode": "sound_changevolumeby",
        "next": null,
        "parent": null,
        "inputs": {
            "VOLUME": mathNumberInput(volume)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block
    });
}

export interface SoundSetVolumeTo extends SoundBlock {
    opcode: "sound_setvolumeto";
    inputs: Volume;
    fields: None;
}

export function soundSetVolumeTo(volume = 100): BlockMeta {
    const block: SoundSetVolumeTo = {
        "opcode": "sound_setvolumeto",
        "next": null,
        "parent": null,
        "inputs": {
            "VOLUME": mathNumberInput(volume)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block
    });
}

export interface SoundVolume extends SoundBlock {
    opcode: "sound_volume";
    inputs: None;
    fields: None;
}

export function soundVolume(): BlockMeta {
    const block: SoundVolume = {
        "opcode": "sound_volume",
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

/**
 * Tells whether the given block is a sound block.
 * https://en.scratch-wiki.info/wiki/Sound_Blocks
 *
 * @param block the block to check
 */
export function isSoundBlock(block: Block): block is SoundBlock {
    return (soundBlockOpcodes as readonly Opcode[]).includes(block.opcode);
}
