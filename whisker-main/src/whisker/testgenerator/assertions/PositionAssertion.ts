import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export class PositionAssertion extends WhiskerAssertion {

    private readonly _x: number;
    private readonly _y: number;

    constructor (target: RenderedTarget, x: number, y:number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._x = x;
        this._y = y;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        for (const targetState of Object.values(state)) {
            if (targetState.target === this._target) {
                return targetState.x == this._x && targetState.y == this._y;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has position ${this._x}/${this._y}`;
    }
    toJavaScript(): string {
        if (this._target.isOriginal) {
            return `t.assert.equalDictionaries(${this.getTargetAccessor()}.pos, {x: ${this._x}, y: ${this._y}}, "Expected ${this.getTargetName()} to have position ${this._x}, ${this._y}");`;
        } else {
            return `t.assert.equalDictionaries({x: ${this.getTargetAccessor()}.x, y: ${this.getTargetAccessor()}.y}, {x: ${this._x}, y: ${this._y}}, "Expected ${this.getTargetName()} to have position ${this._x}, ${this._y}");`;
        }
    }

    static createFactory() : AssertionFactory<PositionAssertion>{
        return new (class implements AssertionFactory<PositionAssertion> {
            createAssertions(state: Map<string, Record<string, any>>): PositionAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new PositionAssertion(targetState.target, targetState.x, targetState.y, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
