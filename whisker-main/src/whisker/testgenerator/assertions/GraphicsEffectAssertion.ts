import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import {Container} from "../../utils/Container";

export class GraphicsEffectAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _effectName: string;
    private readonly _status: boolean;

    constructor (targetName: string, effectName, status: any) {
        super();
        this._targetName = targetName;
        this._effectName = effectName;
        this._status     = status;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert ${this._targetName} has graphics effect ${this._effectName} set to ${this._status}`;
    }
    toJavaScript(): string {
        return `t.assert.equal(t.getSprite("${this._targetName}").effects[${this._effectName}], ${this._status});`;
    }

    static createFactory() : AssertionFactory<GraphicsEffectAssertion>{
        return new (class implements AssertionFactory<GraphicsEffectAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): GraphicsEffectAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.name === "Stage") {
                        continue;
                    }
                    for (const [effectName, value] of Object.entries(targetState.effects)) {
                        assertions.push(new GraphicsEffectAssertion(targetState.name, effectName, value));
                    }
                }

                return assertions;
            }
        })();
    }
}
