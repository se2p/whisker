import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class BackdropAssertion extends WhiskerAssertion {

    private readonly _backdrop: number;

    constructor (target: RenderedTarget, backdrop: number) {
        super(target);
        this._backdrop = backdrop;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.costume == this._backdrop;
            }
        }
        return false;
    }

    toString(): string {
        return `assert stage has backdrop ${this._backdrop}`;
    }
    toJavaScript(): string {
        return js`t.assert.equal(t.getStage().currentCostume, ${this._backdrop}, "Expected backdrop ${this._backdrop}");`;
    }
    static createFactory() : AssertionFactory<BackdropAssertion>{
        return new (class implements AssertionFactory<BackdropAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): BackdropAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (!targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new BackdropAssertion(targetState.target, targetState.costume));
                }

                return assertions;
            }
        })();
    }
}
