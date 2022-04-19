import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";

export class BackdropAssertion extends WhiskerAssertion {

    private readonly _backdrop: string;

    constructor (backdrop: string) {
        super();
        this._backdrop = backdrop;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert stage has backdrop ${this._backdrop}`;
    }
    toJavaScript(): string {
        return `t.assert.equal(t.getStage().currentCostume, ${this._backdrop}, "Expected backdrop ${this._backdrop}");`;
    }
    static createFactory() : AssertionFactory<BackdropAssertion>{
        return new (class implements AssertionFactory<BackdropAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): BackdropAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.name !== "Stage") {
                        continue;
                    }
                    assertions.push(new BackdropAssertion(targetState.costume));
                }

                return assertions;
            }
        })();
    }
}
