import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export class CostumeAssertion extends WhiskerAssertion {

    private readonly _costume: string;

    constructor (target: RenderedTarget, costume: string, cloneIndex?: number) {
        super(target, cloneIndex);
        this._costume = costume;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        for (const targetState of Object.values(state)) {
            if (targetState.target === this._target) {
                return targetState.costume == this._costume;
            }
        }

        return false;    }

    toString(): string {
        return `assert ${this.getTargetName()} has costume ${this._costume}`;
    }
    toJavaScript(): string {
        return `t.assert.equal(${this.getTargetAccessor()}.currentCostume, ${this._costume}, "Expected ${this.getTargetName()} to have costume ${this._costume}");`;
    }

    static createFactory() : AssertionFactory<CostumeAssertion>{
        return new (class implements AssertionFactory<CostumeAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): CostumeAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.target.isStage) {
                        continue;
                    }
                    assertions.push(new CostumeAssertion(targetState.target, targetState.costume, targetState.cloneIndex));
                }

                return assertions;
            }
        })();
    }
}
