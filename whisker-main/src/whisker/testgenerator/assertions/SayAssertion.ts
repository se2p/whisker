import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export class SayAssertion extends WhiskerAssertion {

    private readonly _text: string;

    constructor (target: RenderedTarget, text: string) {
        super(target);
        this._text = text;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        for (const targetState of Object.values(state)) {
            if (targetState.name === this._target.getName()) {
                if (this._cloneIndex !== undefined && this._cloneIndex !== targetState.cloneIndex) {
                    continue;
                }
                return targetState.bubbleState == this._text;
            }
        }

        return false;
    }

    toString(): string {
        if (this._text) {
            return `assert ${this.getTargetName()} is saying "${this._text}"`;
        } else {
            return `assert ${this.getTargetName()} is not saying anything`;
        }
    }
    toJavaScript(): string {
        if (this._text) {
            return `t.assert.equal(${this.getTargetAccessor()}.sayText, "${this._text}", "Expected ${this.getTargetName()} to say ${this._text}");`;
        } else {
            return `t.assert.not(${this.getTargetAccessor()}.sayText, "Expected ${this.getTargetName()} not to say anything");`;
        }
    }

    static createFactory() : AssertionFactory<SayAssertion>{
        return new (class implements AssertionFactory<SayAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): SayAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    if (!targetState.target.isOriginal) {
                        // TODO: Can clones say something that original sprites don't also say?
                        continue;
                    }
                    assertions.push(new SayAssertion(targetState.target, targetState.bubbleState));
                }

                return assertions;
            }
        })();
    }
}
