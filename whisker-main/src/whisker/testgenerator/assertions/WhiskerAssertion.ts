import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import Arrays from "../../utils/Arrays";
import {AssertionTargetState} from "./AssertionObserver";

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
