import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class DirectionAssertion extends WhiskerAssertion {

    private readonly _direction: number;

    constructor (target: RenderedTarget, direction: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._direction = direction;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.direction == this._direction;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has direction ${this._direction}`;
    }
    toJavaScript(): string {
        return js`t.assert.equal(${this.getTargetAccessor()}.direction, ${this._direction}, 1, "Expected ${this.getTargetName()} to face in direction ${this._direction} +-1");`;
    }

    static createFactory() : AssertionFactory<DirectionAssertion>{
        return new (class implements AssertionFactory<DirectionAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): DirectionAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new DirectionAssertion(targetState.target, targetState.direction, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
