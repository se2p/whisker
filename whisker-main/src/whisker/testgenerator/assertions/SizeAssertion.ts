import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class SizeAssertion extends WhiskerAssertion {

    private readonly _size: number;

    constructor (target: RenderedTarget, size: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._size = Math.trunc(size);
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return Math.trunc(targetState.size) === this._size;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has size ${this._size}`;
    }
    toJavaScript(): string {
        return js`t.assert.withinRange(${this.getTargetAccessor()}.size, ${this._size}, 1, "Expected ${this.getTargetName()} to have size ${this._size} +-1");`;
    }

    static createFactory() : AssertionFactory<SizeAssertion>{
        return new (class implements AssertionFactory<SizeAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): SizeAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new SizeAssertion(targetState.target, targetState.size, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
