import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export class CloneCountAssertion extends WhiskerAssertion {

    private readonly _count: number;

    constructor (target: RenderedTarget, count: number) {
        super(target);
        this._count = count;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} has clones: ${this._count}`;
    }
    toJavaScript(): string {
        return `t.assert.equal(${this.getTargetAccessor()}.getCloneCount(), ${this._count}, "Expected ${this.getTargetName()} to have ${this._count} clones");`;
    }

    static createFactory() : AssertionFactory<CloneCountAssertion>{
        return new (class implements AssertionFactory<CloneCountAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): CloneCountAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
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
