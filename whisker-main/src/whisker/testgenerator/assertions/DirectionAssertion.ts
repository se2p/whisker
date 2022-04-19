import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";

export class DirectionAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _direction: number;

    constructor (targetName: string, direction: number) {
        super();
        this._targetName = targetName;
        this._direction = direction;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert ${this._targetName} has direction ${this._direction}`;
    }
    toJavaScript(): string {
        return `// assert t.getSprite("${this._targetName}").size == ${this._direction}`;
    }

    static createFactory() : AssertionFactory<DirectionAssertion>{
        return new (class implements AssertionFactory<DirectionAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): DirectionAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.name === "Stage") {
                        continue;
                    }
                    assertions.push(new DirectionAssertion(targetState.name, targetState.direction));
                }

                return assertions;
            }
        })();
    }
}
