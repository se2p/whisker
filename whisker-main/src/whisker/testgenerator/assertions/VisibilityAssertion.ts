import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class VisibilityAssertion extends WhiskerAssertion {

    private readonly _visibility: boolean;

    constructor (target: RenderedTarget, visibility: boolean, cloneIndex?: number) {
        super(target, cloneIndex);
        this._visibility = visibility;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.visible == this._visibility;
            }
        }

        return false;
    }

    toString(): string {
        if (this._visibility) {
            return `assert ${this.getTargetName()} is visible`;
        } else {
            return `assert ${this.getTargetName()} is not visible`;
        }
    }
    toJavaScript(): string {
        if (this._visibility) {
            return js`t.assert.ok(${this.getTargetAccessor()}.visible, "Expected ${this.getTargetName()} to be visible");`;
        } else {
            return js`t.assert.not(${this.getTargetAccessor()}.visible, "Expected ${this.getTargetName()} not to be visible");`;
        }
    }

    static createFactory() : AssertionFactory<VisibilityAssertion>{
        return new (class implements AssertionFactory<VisibilityAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): VisibilityAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new VisibilityAssertion(targetState.target, targetState.visible, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
