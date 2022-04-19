import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";

export class CostumeAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _costume: string;

    constructor (targetName: string, costume: string) {
        super();
        this._targetName = targetName;
        this._costume = costume;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert ${this._targetName} has costume ${this._costume}`;
    }
    toJavaScript(): string {
        return `t.assert.equal(t.getSprite("${this._targetName}").costume, ${this._costume});`;
    }

    static createFactory() : AssertionFactory<CostumeAssertion>{
        return new (class implements AssertionFactory<CostumeAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): CostumeAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.name === "Stage") {
                        continue;
                    }
                    assertions.push(new CostumeAssertion(targetState.name, targetState.costume));
                }

                return assertions;
            }
        })();
    }
}
