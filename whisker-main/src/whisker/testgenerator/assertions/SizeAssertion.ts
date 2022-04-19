import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";

export class SizeAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _size: number;

    constructor (targetName: string, size: number) {
        super();
        this._targetName = targetName;
        this._size = size;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert ${this._targetName} has size ${this._size}`;
    }
    toJavaScript(): string {
        return `// assert t.getSprite("${this._targetName}").size == ${this._size}`;
    }

    static createFactory() : AssertionFactory<SizeAssertion>{
        return new (class implements AssertionFactory<SizeAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): SizeAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.name === "Stage") {
                        continue;
                    }
                    assertions.push(new SizeAssertion(targetState.name, targetState.size));
                }

                return assertions;
            }
        })();
    }
}
