import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import {Container} from "../../utils/Container";

export class VisibilityAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _visibility: boolean;

    constructor (targetName: string, visibility: boolean) {
        super();
        this._targetName = targetName;
        this._visibility = visibility;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        if (this._visibility) {
            return `assert ${this._targetName} is visible`;
        } else {
            return `assert ${this._targetName} is not visible`;
        }
    }
    toJavaScript(): string {
        if (this._visibility) {
            return `t.assert.ok(t.getSprite("${this._targetName}").visible, "Expected ${this._targetName} to be visible");`;
        } else {
            return `t.assert.not(t.getSprite("${this._targetName}").visible, "Expected ${this._targetName} not to be visible");`;
        }
    }

    static createFactory() : AssertionFactory<VisibilityAssertion>{
        return new (class implements AssertionFactory<VisibilityAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): VisibilityAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.name === "Stage") {
                        continue;
                    }
                    Container.debugLog("Values of "+targetState.name);
                    assertions.push(new VisibilityAssertion(targetState.name, targetState.visible));
                }

                return assertions;
            }
        })();
    }
}
