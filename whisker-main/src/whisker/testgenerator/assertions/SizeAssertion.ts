import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export class SizeAssertion extends WhiskerAssertion {

    private readonly _size: number;

    constructor (target: RenderedTarget, size: number, cloneIndex?: number) {
        super(target, cloneIndex);
        this._size = Math.trunc(size);
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        for (const targetState of Object.values(state)) {
            if (targetState.name === this._target.getName()) {
                if (this._cloneIndex !== undefined && this._cloneIndex !== targetState.cloneIndex) {
                    continue;
                }
                return Math.trunc(targetState.size) === this._size;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has size ${this._size}`;
    }
    toJavaScript(): string {
        return `t.assert.equal(${this.getTargetAccessor()}.size, ${this._size}, "Expected ${this.getTargetName()} to have size ${this._size}");`;
    }

    static createFactory() : AssertionFactory<SizeAssertion>{
        return new (class implements AssertionFactory<SizeAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): SizeAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
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
