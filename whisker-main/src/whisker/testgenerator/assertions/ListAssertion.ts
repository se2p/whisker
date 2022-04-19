import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
//import Variable from "../scratch-vm/@types/scratch-vm/engine/variable";
import Variable from 'scratch-vm/src/engine/variable.js';

export class ListAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _variableName: string;
    private readonly _variableValue: [];

    constructor (targetName: string, variableName: string, variableValue: []) {
        super();
        this._targetName = targetName;
        this._variableName = variableName;
        this._variableValue = variableValue;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert ${this._targetName} list variable ${this._variableName} has length ${this._variableValue.length}`;
    }
    toJavaScript(): string {
        return `t.assert.equal(t.getSprite("${this._targetName}").getList("${this._variableName}").length, ${this._variableValue.length});`;
    }

    static createFactory() : AssertionFactory<ListAssertion>{
        return new (class implements AssertionFactory<ListAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): ListAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    for (const [variableName, variableValue] of Object.entries(targetState.variables)) {
                        const variable = variableValue as Variable;
                        if (variable.type == Variable.LIST_TYPE) {
                            assertions.push(new ListAssertion(targetState.name, variable.name, variable.value));
                        }
                    }
                }

                return assertions;
            }
        })();
    }
}
