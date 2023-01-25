import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class GraphicsEffectAssertion extends WhiskerAssertion {

    private readonly _effectName: string;
    private readonly _status: number;

    constructor (target: RenderedTarget, effectName: string, status: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._effectName = effectName;
        this._status     = status;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.effects[this._effectName] == this._status;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has graphics effect ${this._effectName} set to ${this._status}`;
    }
    toJavaScript(): string {
        return js`t.assert.equal(${this.getTargetAccessor()}.effects.${this._effectName}, ${this._status}, "Expected effect ${this._effectName} of ${this.getTargetName()} to be ${this._status}");`;
    }

    static createFactory() : AssertionFactory<GraphicsEffectAssertion>{
        return new (class implements AssertionFactory<GraphicsEffectAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): GraphicsEffectAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    for (const [effectName, value] of Object.entries(targetState.effects)) {
                        assertions.push(new GraphicsEffectAssertion(targetState.target, effectName, value, targetState.cloneIndex));
                    }
                }

                return assertions;
            }
        })();
    }
}
