import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
//import Variable from "../scratch-vm/@types/scratch-vm/engine/variable";
import Variable from 'scratch-vm/src/engine/variable.js';

export class VariableAssertion extends WhiskerAssertion {

    private readonly _targetName: string;
    private readonly _variableName: string;
    private readonly _variableValue: string;

    constructor (targetName: string, variableName: string, variableValue: any) {
        super();
        this._targetName = targetName;
        this._variableName = variableName;
        this._variableValue = variableValue;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        return false;
    }

    toString(): string {
        return `assert ${this._targetName} variable ${this._variableName} has value ${this._variableValue}`;
    }
    toJavaScript(): string {
        return `// t.assert.equal(t.getSprite("${this._targetName}").${this._variableName}, ${this._variableValue});`;
    }

    static createFactory() : AssertionFactory<VariableAssertion>{
        return new (class implements AssertionFactory<VariableAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): VariableAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    for (const [variableName, variableValue] of Object.entries(targetState.variables)) {
                        const variable = variableValue as Variable;
                        if (variable.type == Variable.SCALAR_TYPE) {
                            assertions.push(new VariableAssertion(targetState.name, variable.name, variable.value));
                        }
                    }
                }

                return assertions;
            }
        })();
    }
}
