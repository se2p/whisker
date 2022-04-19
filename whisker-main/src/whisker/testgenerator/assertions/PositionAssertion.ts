import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";

export class PositionAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _x: number;
    private readonly _y: number;

    constructor (targetName: string, x: number, y:number) {
        super();
        this._targetName = targetName;
        this._x = x;
        this._y = y;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert ${this._targetName} has position ${this._x}/${this._y}`;
    }
    toJavaScript(): string {
        return `t.assert.equal(t.getSprite("${this._targetName}").pos, {x: ${this._x}, y: ${this._y}});`;
    }

    static createFactory() : AssertionFactory<PositionAssertion>{
        return new (class implements AssertionFactory<PositionAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): PositionAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.name === "Stage") {
                        continue;
                    }
                    assertions.push(new PositionAssertion(targetState.name, targetState.x, targetState.y));
                }

                return assertions;
            }
        })();
    }
}
