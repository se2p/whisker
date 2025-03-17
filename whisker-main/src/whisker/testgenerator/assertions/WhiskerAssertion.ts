import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import Arrays from "../../utils/Arrays";
import {AssertionTargetState} from "./AssertionObserver";
import uid from "scratch-vm/src/util/uid";
import {ScratchScriptSnippet} from "../../../types/ScratchScriptSnippet";
import {SubVMBlock} from "../../../types/ScratchVMBlock";

export abstract class WhiskerAssertion {

    protected _target: RenderedTarget;

    protected _cloneIndex: number;

    protected constructor(target: RenderedTarget, cloneIndex?: number) {
        this._target = target;
        this._cloneIndex = cloneIndex;
    }

    // evaluate a trace entry -> bool
    abstract evaluate(state: Map<string, AssertionTargetState>): boolean;

    // String representation
    abstract toString(): string;

    // JavaScript representation
    abstract toJavaScript(): string;

    // Block representation
    abstract toScratchBlocks(): ScratchScriptSnippet | null;

    protected getTarget(): RenderedTarget {
        return this._target;
    }

    protected getTargetName(): string {
        if (this._target.isStage) {
            return "Stage";
        } else if (this._target.isOriginal) {
            return `Sprite ${this._target.getName()}`;
        } else {
            return `Clone ${this._cloneIndex} of ${this._target.getName()}`;
        }
    }

    protected getTargetAccessor(): string {
        if (this._target.isStage) {
            return "t.getStage()";
        } else if (this._target.isOriginal) {
            return `t.getSprite("${this._target.getName()}")`;
        } else {
            return `t.getSprite("${this._target.getName()}").getClone(${this._cloneIndex})`;
        }
    }
}

export function escaped(value: unknown): string {
    if (value.toString() === "Infinity") {
        return "Infinity";
    } else if (value.toString() === 'NaN') {
        return "NaN";
    }
    let jsonString = JSON.stringify(value);
    if (jsonString.charAt(0) == '"') {
        jsonString = jsonString.slice(1, -1);
    }
    return jsonString;
}

export function js(strings: TemplateStringsArray, ...keys: unknown[]): string {
    let str = '';
    let openedString = false;
    for (let i = 0; i < strings.length - 1; i++) {
        if (strings[i].includes('"')) {
            openedString = !openedString;
        }

        if (openedString) {
            // Make sure we properly escape interpolated variables when a string has been opened before.
            str += strings[i] + escaped(keys[i]);
        } else {
            str += strings[i] + keys[i];
        }
    }
    return str + Arrays.last(strings.raw);
}

/**
 * As many assertion types are equality assertions with the left value being a block
 * and the right value being a fixed value, this function generates a block construct
 * to represent such equality assertions.
 */
export function generateEqualityAssertion(leftBlockId: string, rightValue: string):
    [SubVMBlock, SubVMBlock, SubVMBlock] {

    const assertEqualsBlockId = uid();
    const assertEqualsBlockAId = uid();
    const assertEqualsBlockBId = uid();

    const assertEqualsBlock: SubVMBlock =
        {
            "id": assertEqualsBlockId,
            "opcode": "bbt_assertEquals",
            "inputs": {
                "A": {
                    "name": "A",
                    "block": leftBlockId,
                    "shadow": assertEqualsBlockAId
                },
                "B": {
                    "name": "B",
                    "block": assertEqualsBlockBId,
                    "shadow": assertEqualsBlockBId
                }
            },
            "fields": {},
            "next": null,
            "topLevel": false,
            "parent": null,
            "shadow": false,
            "breakpoint": false
        };

    const assertEqualsBlockA: SubVMBlock =
        {
            "id": assertEqualsBlockAId,
            "opcode": "text",
            "inputs": {},
            "fields": {
                "TEXT": {
                    "name": "TEXT",
                    "value": ""
                }
            },
            "next": null,
            "topLevel": true,
            "parent": null,
            "shadow": true,
            "breakpoint": false
        };

    const assertEqualsBlockB: SubVMBlock =
        {
            "id": assertEqualsBlockBId,
            "opcode": "text",
            "inputs": {},
            "fields": {
                "TEXT": {
                    "name": "TEXT",
                    "value": rightValue
                }
            },
            "next": null,
            "topLevel": false,
            "parent": assertEqualsBlockId,
            "shadow": true,
            "breakpoint": false
        };

    return [assertEqualsBlock, assertEqualsBlockA, assertEqualsBlockB];
}
