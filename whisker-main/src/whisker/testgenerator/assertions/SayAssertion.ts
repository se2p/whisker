import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export class SayAssertion extends WhiskerAssertion {

    private readonly _text: string;

    constructor (target: RenderedTarget, text: string, cloneIndex?: number) {
        super(target, cloneIndex);
        this._text = text;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        for (const targetState of Object.values(state)) {
            if (targetState.target === this._target) {
                return targetState.bubbleState === this._text;
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
            return `t.assert.equal(${this.getTargetAccessor()}.sayText, "${this.getValue()}", "Expected ${this.getTargetName()} to say ${this.getValue()}");`;
        } else {
            return `t.assert.not(${this.getTargetAccessor()}.sayText, "Expected ${this.getTargetName()} not to say anything");`;
        }
    }

    private getValue(): string {
        return this.escaped(this._text);
    }

    static createFactory() : AssertionFactory<SayAssertion>{
        return new (class implements AssertionFactory<SayAssertion> {
            createAssertions(state: Map<string, Record<string, any>>): SayAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new SayAssertion(targetState.target, targetState.bubbleState, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
