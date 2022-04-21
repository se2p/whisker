import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export abstract class WhiskerAssertion {

    protected _target: RenderedTarget;

    protected _cloneIndex: number;

    protected constructor (target: RenderedTarget, cloneIndex?: number) {
        this._target = target;
        this._cloneIndex = cloneIndex;
    }

    // evaluate a trace entry -> bool
    abstract evaluate(state): boolean;

    // String representation
    abstract toString(): string;

    // JavaScript representation
    abstract toJavaScript(): string;

    protected getTarget(): RenderedTarget {
        return this._target;
    }

    protected escaped(value: string): string {
        let jsonString = JSON.stringify(value);
        if (jsonString.charAt(0) == '"') {
            jsonString = jsonString.slice(1, -1);
        }
        return jsonString;
    }

    protected getTargetName(): string {
        if (this._target.isStage) {
            return "Stage";
        } else if (this._target.isOriginal) {
            return `Sprite ${this.escaped(this._target.getName())}`;
        } else {
            return `Clone ${this._cloneIndex} of ${this.escaped(this._target.getName())}`;
        }
    }

    protected getTargetAccessor(): string {
        if (this._target.isStage) {
            return "t.getStage()";
        } else if (this._target.isOriginal) {
            return `t.getSprite("${this.escaped(this._target.getName())}")`;
        } else {
            return `t.getSprite("${this.escaped(this._target.getName())}").getClone(${this._cloneIndex})`;
        }
    }
}
