import {Block} from "../Block";
import {broadcastInput, mathNumberInput, ShadowInput} from "../Inputs";
import {EventBlockOpcode, eventBlockOpcodes, HatBlockOpcode, Opcode} from "../Opcode";
import {HatBlock} from "../shapes/HatBlock";
import {BlockWithField} from "../other/BlockWithField";
import {blockMeta} from "../BlockFactory";
import uid from "scratch-vm/src/util/uid";
import {EmptyObject} from "../../utils/Objects";
import {BlockMeta} from "../../utils/meta";

type None = EmptyObject;

const defaultMessage = "message1";

export interface EventBlock extends Block {
    opcode: EventBlockOpcode;
}

export interface EventWhenFlagClicked extends EventBlock, HatBlock {
    opcode: "event_whenflagclicked";
    inputs: None;
    fields: None;
    shadow: false;
    parent: null;
    topLevel: true;
}

export function eventWhenFlagClicked(): BlockMeta {
    const block: EventWhenFlagClicked = {
        "opcode": "event_whenflagclicked",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
        "x": 0,
        "y": 0,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type PressedKey = Record<"KEY_OPTION", KeyOption>;

export type Key = typeof keys[number];

/**
 * The keys (on your keyboard) Scratch provides handlers/listeners for.
 */
export const keys = Object.freeze([
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "space", "up arrow", "down arrow", "right arrow", "left arrow", "any"
] as const);

type KeyOption = [key: Key, blockID: null];

export interface EventWhenKeyPressed extends EventBlock, HatBlock, BlockWithField {
    opcode: "event_whenkeypressed";
    inputs: None;
    fields: PressedKey;
    shadow: false;
    parent: null;
    topLevel: true;
}

export function eventWhenKeyPressed(key: Key = "space"): BlockMeta {
    const block: EventWhenKeyPressed = {
        "opcode": "event_whenkeypressed",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "KEY_OPTION": [
                key,
                null
            ]
        },
        "shadow": false,
        "topLevel": true,
        "x": 0,
        "y": 0
    };

    return blockMeta({
        [uid()]: block,
    });
}

interface EventWhenTargetClicked extends EventBlock, HatBlock {
    opcode: EventBlockOpcode & HatBlockOpcode;
    inputs: None;
    fields: None;
    shadow: false;
    parent: null;
    topLevel: true;
}

export interface EventWhenThisSpriteClicked extends EventWhenTargetClicked {
    opcode: "event_whenthisspriteclicked";
}

export function eventWhenThisSpriteClicked(): BlockMeta {
    const block: EventWhenThisSpriteClicked = {
        "opcode": "event_whenthisspriteclicked",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
        "x": 0,
        "y": 0
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface EventWhenStageClicked extends EventWhenTargetClicked {
    opcode: "event_whenstageclicked";
}

export function eventWhenStageClicked(): BlockMeta {
    const block: EventWhenStageClicked = {
        "opcode": "event_whenstageclicked",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
        "x": 0,
        "y": 0
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Backdrop = Record<"BACKDROP", BackdropName>;
type BackdropName = [backdropName: string, blockID: null];

export interface EventWhenBackdropSwitchesTo extends EventBlock, HatBlock, BlockWithField {
    opcode: "event_whenbackdropswitchesto";
    inputs: None;
    fields: Backdrop;
    shadow: false;
    parent: null;
    topLevel: true;
}

export function eventWhenBackdropSwitchesTo(backdrop = "backdrop1"): BlockMeta {
    const block: EventWhenBackdropSwitchesTo = {
        "opcode": "event_whenbackdropswitchesto",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "BACKDROP": [
                backdrop,
                null
            ]
        },
        "shadow": false,
        "topLevel": true,
        "x": 0,
        "y": 0
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Threshold = Record<"VALUE", ShadowInput>;

type LoudnessOrTimer = Record<"WHENGREATERTHANMENU", [
    loudnessOrTimer: "LOUDNESS" | "TIMER",
    blockID: null
]>;

export interface EventWhenGreaterThan extends EventBlock, HatBlock, BlockWithField {
    opcode: "event_whengreaterthan";
    inputs: Threshold;
    fields: LoudnessOrTimer;
    shadow: false;
    parent: null;
    topLevel: true;
}

export function eventWhenGreaterThan(what: LoudnessOrTimer["WHENGREATERTHANMENU"][0] = "LOUDNESS", value = 10): BlockMeta {
    const block: EventWhenGreaterThan = {
        "opcode": "event_whengreaterthan",
        "next": null,
        "parent": null,
        "inputs": {
            "VALUE": mathNumberInput(value)
        },
        "fields": {
            "WHENGREATERTHANMENU": [
                what,
                null
            ]
        },
        "shadow": false,
        "topLevel": true,
        "x": 0,
        "y": 0
    };

    return blockMeta({
        [uid()]: block,
    });
}

type ReceivedBroadcast = Record<"BROADCAST_OPTION", BroadcastOption>;
type BroadcastOption = [broadcastName: string, broadcastID: string];

export interface EventWhenBroadcastReceived extends EventBlock, HatBlock, BlockWithField {
    opcode: "event_whenbroadcastreceived";
    inputs: None;
    fields: ReceivedBroadcast;
    shadow: false;
    parent: null;
    topLevel: true;
}


export function eventWhenBroadcastReceived(message: string = defaultMessage): BlockMeta {
    const block: EventWhenBroadcastReceived = {
        "opcode": "event_whenbroadcastreceived",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "BROADCAST_OPTION": [
                message,
                uid()
            ]
        },
        "shadow": false,
        "topLevel": true,
        "x": 0,
        "y": 0
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Broadcast = Record<"BROADCAST_INPUT", ShadowInput>;

export interface EventBroadcast extends EventBlock {
    opcode: "event_broadcast";
    inputs: Broadcast;
    fields: None;
    shadow: false;
}

export function eventBroadcast(message: string = defaultMessage): BlockMeta {
    const block: EventBroadcast = {
        "opcode": "event_broadcast",
        "next": null,
        "parent": null,
        "inputs": {
            "BROADCAST_INPUT": broadcastInput(message),
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface EventBroadcastAndWait extends EventBlock {
    opcode: "event_broadcastandwait";
    inputs: Broadcast;
    fields: None;
    shadow: false;
}

export function eventBroadcastAndWait(message: string = defaultMessage): BlockMeta {
    const block: EventBroadcastAndWait = {
        "opcode": "event_broadcastandwait",
        "next": null,
        "parent": null,
        "inputs": {
            "BROADCAST_INPUT": broadcastInput(message),
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

/**
 * Tells whether the given block is an event block.
 * https://en.scratch-wiki.info/wiki/Events_Blocks
 *
 * @param block the block to check
 */
export function isEventBlock(block: Block): block is EventBlock {
    return (eventBlockOpcodes as readonly Opcode[]).includes(block.opcode);
}
