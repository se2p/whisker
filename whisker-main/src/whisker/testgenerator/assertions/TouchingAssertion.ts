import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";

export class TouchingAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _otherTarget: string;
    private readonly _touching: boolean;

    constructor (targetName: string, otherTarget: string, touching: boolean) {
        super();
        this._targetName   = targetName;
        this._otherTarget  = otherTarget;
        this._touching     = touching;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        if (this._touching) {
            return `assert ${this._targetName} is touching ${this._otherTarget}`;
        } else {
            return `assert ${this._targetName} is not touching ${this._otherTarget}`;
        }
    }
    toJavaScript(): string {
        if (this._touching) {
            return `t.assert.ok(t.getSprite("${this._targetName}").isTouchingSprite("${this._otherTarget}"));`;
        } else {
            return `t.assert.not(t.getSprite("${this._targetName}").isTouchingSprite("${this._otherTarget}"));`;
        }
    }

    static createFactory() : AssertionFactory<TouchingAssertion>{
        return new (class implements AssertionFactory<TouchingAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): TouchingAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.name === "Stage") {
                        continue;
                    }
                    for (const [spriteName, value] of Object.entries(targetState.touching)) {
                        assertions.push(new TouchingAssertion(targetState.name, spriteName, value as boolean));
                    }
                }

                return assertions;
            }
        })();
    }
}
