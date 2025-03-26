import {Block, isBlock} from "../Block";
import {mathAngleInput, mathNumberInput, ShadowInput} from "../Inputs";
import {MotionBlockOpcode, motionBlockOpcodes, Opcode} from "../Opcode";
import {BlockWithShadowInput} from "../other/BlockWithShadowInput";
import {ShadowBlock} from "../other/ShadowBlock";
import {BlockWithField} from "../other/BlockWithField";
import {blockMeta} from "../BlockFactory";
import uid from "scratch-vm/src/util/uid";
import {EmptyObject} from "../../utils/Objects";
import {BlockMeta} from "../../utils/meta";

type None = EmptyObject;

export interface MotionBlock extends Block {
    opcode: MotionBlockOpcode;
}

type Steps = Record<"STEPS", ShadowInput>;

export interface MotionMoveSteps extends MotionBlock {
    opcode: "motion_movesteps";
    inputs: Steps;
    fields: None;
    shadow: false;
}

export function motionMoveSteps(steps = 10): BlockMeta {
    const block: MotionMoveSteps = {
        "opcode": "motion_movesteps",
        "next": null,
        "parent": null,
        "inputs": {
            "STEPS": mathNumberInput(steps),
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Degrees = Record<"DEGREES", ShadowInput>;

interface MotionTurnDirection extends MotionBlock {
    inputs: Degrees;
    fields: None;
    shadow: false;
}

export interface MotionTurnRight extends MotionTurnDirection {
    opcode: "motion_turnright";
}

export function motionTurnRight(degrees = 15): BlockMeta {
    const block: MotionTurnRight = {
        "opcode": "motion_turnright",
        "next": null,
        "parent": null,
        "inputs": {
            "DEGREES": mathNumberInput(degrees)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface MotionTurnLeft extends MotionTurnDirection {
    opcode: "motion_turnleft";
}

export function motionTurnLeft(degrees = 15): BlockMeta {
    const block: MotionTurnLeft = {
        "opcode": "motion_turnleft",
        "next": null,
        "parent": null,
        "inputs": {
            "DEGREES": mathNumberInput(degrees)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Destination = Record<"TO", ShadowInput>;

export interface MotionGoto extends MotionBlock, BlockWithShadowInput {
    opcode: "motion_goto";
    inputs: Destination;
    fields: None;
    shadow: false;
}

export function motionGoto(): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: MotionGoto = {
        "opcode": "motion_goto",
        "next": null,
        "parent": null,
        "inputs": {
            "TO": [
                1,
                menuID
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: MotionGotoMenu = {
        "opcode": "motion_goto_menu",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "TO": [
                "_random_",
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

type DestinationChoice = Record<"TO", [
    spriteName: string | "_random_" | "_mouse_", blockID: null
]>;

export interface MotionGotoMenu extends MotionBlock, ShadowBlock {
    opcode: "motion_goto_menu";
    fields: DestinationChoice;
    inputs: None;
    shadow: true;
    next: null;
}

type XYCoordinates = Record<"X" | "Y", ShadowInput>;

export interface MotionGotoXY extends MotionBlock {
    opcode: "motion_gotoxy";
    inputs: XYCoordinates;
    fields: None;
    shadow: false;
}

export function motionGotoXY(): BlockMeta {
    const block: MotionGotoXY = {
        "opcode": "motion_gotoxy",
        "next": null,
        "parent": null,
        "inputs": {
            "X": [
                1,
                [
                    4,
                    "0"
                ]
            ],
            "Y": [
                1,
                [
                    4,
                    "0"
                ]
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Seconds = Record<"SECS", ShadowInput>;

export interface MotionGlideTo extends MotionBlock, BlockWithShadowInput {
    opcode: "motion_glideto";
    inputs: Destination & Seconds;
    fields: None;
    shadow: false;
}

export function motionGlideTo(to: DestinationChoice["TO"][0] = "_random_"): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: MotionGlideTo = {
        "opcode": "motion_glideto",
        "next": null,
        "parent": null,
        "inputs": {
            "SECS": [
                1,
                [
                    4,
                    "1"
                ]
            ],
            "TO": [
                1,
                menuID
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: MotionGlideToMenu = {
        "opcode": "motion_glideto_menu",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "TO": [
                to,
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

export interface MotionGlideToMenu extends MotionBlock, ShadowBlock {
    opcode: "motion_glideto_menu";
    fields: DestinationChoice;
    inputs: None;
    next: null;
    shadow: true;
}

export interface MotionGlideSecsToXY extends MotionBlock {
    opcode: "motion_glidesecstoxy";
    inputs: Seconds & XYCoordinates;
    fields: None;
    shadow: false;
}

export function motionGlideSecsToXY(secs = 1, x = 0, y = 0): BlockMeta {
    const block: MotionGlideSecsToXY = {
        "opcode": "motion_glidesecstoxy",
        "next": null,
        "parent": null,
        "inputs": {
            "SECS": mathNumberInput(secs),
            "X": mathNumberInput(x),
            "Y": mathNumberInput(y)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Direction = Record<"DIRECTION", ShadowInput>;

export interface MotionPointInDirection extends MotionBlock {
    opcode: "motion_pointindirection";
    inputs: Direction;
    fields: None;
    shadow: false;
}

export function motionPointInDirection(direction = 90): BlockMeta {
    const block: MotionPointInDirection = {
        "opcode": "motion_pointindirection",
        "next": null,
        "parent": null,
        "inputs": {
            "DIRECTION": mathAngleInput(direction)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Towards = Record<"TOWARDS", ShadowInput>;

export interface MotionPointTowards extends MotionBlock, BlockWithShadowInput {
    opcode: "motion_pointtowards";
    inputs: Towards;
    fields: None;
    shadow: false;
}

export function motionPointTowards(towards: DirectionChoice["TOWARDS"][0] = "_mouse_"): BlockMeta {
    const blockID = uid();
    const menuID = uid();

    const block: MotionPointTowards = {
        "opcode": "motion_pointtowards",
        "next": null,
        "parent": null,
        "inputs": {
            "TOWARDS": [
                1,
                menuID
            ]
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    const menu: MotionPointTowardsMenu = {
        "opcode": "motion_pointtowards_menu",
        "next": null,
        "parent": blockID,
        "inputs": {},
        "fields": {
            "TOWARDS": [
                towards,
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

type DirectionChoice = Record<"TOWARDS", [
    spriteName: string | "_mouse_",
    blockID: null
]>;

export interface MotionPointTowardsMenu extends MotionBlock, ShadowBlock {
    opcode: "motion_pointtowards_menu";
    fields: DirectionChoice;
    inputs: None;
    next: null;
    shadow: true;
}

interface MotionChangeCoordinate extends MotionBlock {
    fields: None;
    shadow: false;
}

type DeltaX = Record<"DX", ShadowInput>;

export interface MotionChangeXBy extends MotionChangeCoordinate {
    opcode: "motion_changexby";
    inputs: DeltaX;
}

export function motionChangeXBy(dx = 10): BlockMeta {
    const block: MotionChangeXBy = {
        "opcode": "motion_changexby",
        "next": null,
        "parent": null,
        "inputs": {
            "DX": mathNumberInput(dx)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type DeltaY = Record<"DY", ShadowInput>;

export interface MotionChangeYBy extends MotionChangeCoordinate {
    opcode: "motion_changeyby";
    inputs: DeltaY;
}

export function motionChangeYBy(dy = 10): BlockMeta {
    const block: MotionChangeYBy = {
        "opcode": "motion_changeyby",
        "next": null,
        "parent": null,
        "inputs": {
            "DY": mathNumberInput(dy)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

interface MotionSetCoordinate extends MotionBlock {
    fields: None;
    shadow: false;
}

type NewX = Record<"X", ShadowInput>;

export interface MotionSetX extends MotionSetCoordinate {
    opcode: "motion_setx";
    inputs: NewX;
}

export function motionSetX(x = 0): BlockMeta {
    const block: MotionSetX = {
        "opcode": "motion_setx",
        "next": null,
        "parent": null,
        "inputs": {
            "X": mathNumberInput(x)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type NewY = Record<"Y", ShadowInput>;

export interface MotionSetY extends MotionSetCoordinate {
    opcode: "motion_sety";
    inputs: NewY;
}

export function motionSetY(y = 0): BlockMeta {
    const block: MotionSetY = {
        "opcode": "motion_sety",
        "next": null,
        "parent": null,
        "inputs": {
            "Y": mathNumberInput(0)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface MotionIfOnEdgeBounce extends MotionBlock {
    opcode: "motion_ifonedgebounce";
    inputs: None;
    fields: None;
    shadow: false;
}

export function motionIfOnEdgeBounce(): BlockMeta {
    const block: MotionIfOnEdgeBounce = {
        "opcode": "motion_ifonedgebounce",
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

export const rotationStyles = Object.freeze(["left-right", "don't rotate", "all around"] as const);

type RotationStyle = Record<"STYLE", [
    rotationStyle: typeof rotationStyles[number],
    blockID: null,
]>;

export interface MotionSetRotationStyle extends MotionBlock, BlockWithField {
    opcode: "motion_setrotationstyle";
    inputs: None;
    fields: RotationStyle;
    shadow: false;
}

export function motionSetRotationStyle(style: RotationStyle["STYLE"][0] = "left-right"): BlockMeta {
    const block: MotionSetRotationStyle = {
        "opcode": "motion_setrotationstyle",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "STYLE": [
                style,
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

interface MotionLocation extends MotionBlock {
    inputs: None;
    fields: None;
}

export interface MotionXPosition extends MotionLocation {
    opcode: "motion_xposition";
}

export function motionXPosition(): BlockMeta {
    const block: MotionXPosition = {
        "opcode": "motion_xposition",
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

export interface MotionYPosition extends MotionLocation {
    opcode: "motion_yposition";
}

export function motionYPosition(): BlockMeta {
    const block: MotionYPosition = {
        "opcode": "motion_yposition",
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

export interface MotionDirection extends MotionLocation {
    opcode: "motion_direction";
}

export function motionDirection(): BlockMeta {
    const block: MotionDirection = {
        "opcode": "motion_direction",
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
 * Tells whether the given block is a motion block.
 * https://en.scratch-wiki.info/wiki/Motion_Blocks
 *
 * @param o the block to check
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function isMotionBlock(o: {}): o is MotionBlock {
    return isBlock(o) && (motionBlockOpcodes as readonly Opcode[]).includes(o.opcode);
}
