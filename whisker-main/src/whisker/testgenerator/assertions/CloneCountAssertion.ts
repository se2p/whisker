import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class CloneCountAssertion extends WhiskerAssertion {

    private readonly _count: number;

    constructor (target: RenderedTarget, count: number) {
        super(target);
        this._count = count;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target && !targetState.clone) {
                return targetState.cloneCount == this._count;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has clones: ${this._count}`;
    }
    toJavaScript(): string {
        return js`t.assert.equal(${this.getTargetAccessor()}.getCloneCount(), ${this._count}, "Expected ${this.getTargetName()} to have ${this._count} clones");`;
    }

    static createFactory() : AssertionFactory<CloneCountAssertion>{
        return new (class implements AssertionFactory<CloneCountAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): CloneCountAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    if (targetState.clone) {
                        continue;
                    }
                    assertions.push(new CloneCountAssertion(targetState.target, targetState.cloneCount));
                }

                return assertions;
            }
        })();
    }
}
