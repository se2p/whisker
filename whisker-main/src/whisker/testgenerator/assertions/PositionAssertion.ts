import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class PositionAssertion extends WhiskerAssertion {

    private readonly _x: number;
    private readonly _y: number;

    constructor(target: RenderedTarget, x: number, y: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._x = x;
        this._y = y;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
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
        return js`t.assert.withinRange(${this.getTargetAccessor()}.x, ${this._x}, 5, "Expected ${this.getTargetName()} to have x-position ${this._x} +-5");` + '\n' +
            js`  t.assert.withinRange(${this.getTargetAccessor()}.y, ${this._y}, 5, "Expected ${this.getTargetName()} to have y-position ${this._y} +-5");`;
    }

    static createFactory(): AssertionFactory<PositionAssertion> {
        return new (class implements AssertionFactory<PositionAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): PositionAssertion[] {
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
