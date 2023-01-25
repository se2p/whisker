import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class CostumeAssertion extends WhiskerAssertion {

    private readonly _costume: number;

    constructor (target: RenderedTarget, costume: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._costume = costume;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return targetState.costume == this._costume;
            }
        }

        return false;    }

    toString(): string {
        return `assert ${this.getTargetName()} has costume ${this._costume}`;
    }
    toJavaScript(): string {
        return js`t.assert.equal(${this.getTargetAccessor()}.currentCostume, ${this._costume}, "Expected ${this.getTargetName()} to have costume ${this._costume}");`;
    }

    static createFactory() : AssertionFactory<CostumeAssertion>{
        return new (class implements AssertionFactory<CostumeAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): CostumeAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new CostumeAssertion(targetState.target, targetState.costume, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
