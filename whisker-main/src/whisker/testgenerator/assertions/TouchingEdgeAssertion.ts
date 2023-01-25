import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class TouchingEdgeAssertion extends WhiskerAssertion {

    private readonly _touching: boolean;

    constructor (target: RenderedTarget, touching: boolean, cloneIndex?: number) {
        super(target, cloneIndex);
        this._touching    = touching;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.touchingEdge === this._touching;
            }
        }

        return false;
    }

    toString(): string {
        if (this._touching) {
            return `assert ${this.getTargetName()} is touching the edge`;
        } else {
            return `assert ${this.getTargetName()} is not touching the edge`;
        }
    }
    toJavaScript(): string {
        if (this._touching) {
            return js`t.assert.ok(${this.getTargetAccessor()}.isTouchingEdge(), "Expected ${this.getTargetName()} to touch edge");`;
        } else {
            return js`t.assert.not(${this.getTargetAccessor()}.isTouchingEdge(), "Expected ${this.getTargetName()} not to touch edge");`;
        }
    }

    static createFactory() : AssertionFactory<TouchingEdgeAssertion>{
        return new (class implements AssertionFactory<TouchingEdgeAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): TouchingEdgeAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new TouchingEdgeAssertion(targetState.target, targetState.touchingEdge, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
