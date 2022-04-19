import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export class BackdropAssertion extends WhiskerAssertion {

    private readonly _backdrop: string;

    constructor (target: RenderedTarget, backdrop: string) {
        super(target);
        this._backdrop = backdrop;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        for (const targetState of Object.values(state)) {
            if (targetState.name === this._target.getName()) {
                return targetState.costume == this._backdrop;
            }
        }

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
                    if (!targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new BackdropAssertion(targetState.target, targetState.costume));
                }

                return assertions;
            }
        })();
    }
}
