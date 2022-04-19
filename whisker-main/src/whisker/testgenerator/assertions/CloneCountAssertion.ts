import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";

export class CloneCountAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _count: number;

    constructor (targetName: string, count: number) {
        super();
        this._targetName = targetName;
        this._count = count;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert ${this._targetName} has clones: ${this._count}`;
    }
    toJavaScript(): string {
        return `t.assert.equal(t.getSprite("${this._targetName}").getCloneCount(), ${this._count});`;
    }

    static createFactory() : AssertionFactory<CloneCountAssertion>{
        return new (class implements AssertionFactory<CloneCountAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): CloneCountAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.name === "Stage") {
                        continue;
                    }
                    assertions.push(new CloneCountAssertion(targetState.name, targetState.cloneCount));
                }

                return assertions;
            }
        })();
    }
}
