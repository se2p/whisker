import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";

export class SayAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _text: string;

    constructor (targetName: string, text: string) {
        super();
        this._targetName = targetName;
        this._text = text;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        if (this._text) {
            return `assert ${this._targetName} is saying "${this._text}"`;
        } else {
            return `assert ${this._targetName} is not saying anything`;
        }
    }
    toJavaScript(): string {
        if (this._text) {
            return `t.assert.equal(t.getSprite("${this._targetName}").sayText, ${this._text}, "Expected ${this._targetName} to say ${this._text}");`;
        } else {
            return `t.assert.not(t.getSprite("${this._targetName}").sayText, "Expected ${this._targetName} not to say anything");`;
        }
    }

    static createFactory() : AssertionFactory<SayAssertion>{
        return new (class implements AssertionFactory<SayAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): SayAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.name === "Stage") {
                        continue;
                    }
                    assertions.push(new SayAssertion(targetState.name, targetState.bubbleState));
                }

                return assertions;
            }
        })();
    }
}
