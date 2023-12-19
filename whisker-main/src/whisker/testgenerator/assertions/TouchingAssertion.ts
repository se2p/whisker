import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class TouchingAssertion extends WhiskerAssertion {

    private readonly _otherTarget: string;
    private readonly _touching: boolean;

    constructor (target: RenderedTarget, otherTarget: string, touching: boolean, cloneIndex?: number) {
        super(target, cloneIndex);
        this._otherTarget = otherTarget;
        this._touching    = touching;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.touching[this._otherTarget] === this._touching;
            }
        }

        return false;
    }

    toString(): string {
        if (this._touching) {
            return `assert ${this.getTargetName()} is touching ${this._otherTarget}`;
        } else {
            return `assert ${this.getTargetName()} is not touching ${this._otherTarget}`;
        }
    }
    toJavaScript(): string {
        if (this._touching) {
            return js`t.assert.ok(${this.getTargetAccessor()}.isTouchingSprite("${this._otherTarget}"), "Expected ${this.getTargetName()} to touch ${this._otherTarget}");`;
        } else {
            return js`t.assert.not(${this.getTargetAccessor()}.isTouchingSprite("${this._otherTarget}"), "Expected ${this.getTargetName()} not to touch ${this._otherTarget}");`;
        }
    }

    static createFactory() : AssertionFactory<TouchingAssertion>{
        return new (class implements AssertionFactory<TouchingAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): TouchingAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    for (const [spriteName, value] of Object.entries(targetState.touching)) {
                        assertions.push(new TouchingAssertion(targetState.target, spriteName, value as boolean, targetState.cloneIndex));
                    }
                }

                return assertions;
            }
        })();
    }
}
