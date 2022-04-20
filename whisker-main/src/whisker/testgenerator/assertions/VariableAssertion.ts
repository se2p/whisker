import {WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
//import Variable from "../scratch-vm/@types/scratch-vm/engine/variable";
import Variable from 'scratch-vm/src/engine/variable.js';
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export class VariableAssertion extends WhiskerAssertion {

    private readonly _variableID: string;
    private readonly _variableName: string;
    private readonly _variableValue: string;

    constructor (target: RenderedTarget, variableID: string, variableName: string, variableValue: any) {
        super(target);
        this._variableID = variableID;
        this._variableName = variableName;
        this._variableValue = variableValue;
    }

    evaluate(state: Map<string, Map<string, any>>): boolean {
        for (const targetState of Object.values(state)) {
            if (targetState.name === this._target.getName() && !targetState.clone) {
                return targetState.variables[this._variableID].value == this._variableValue;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} variable ${this._variableName} has value ${this._variableValue}`;
    }

    toJavaScript(): string {
        if (this._target.isStage) {
            return `t.assert.equal(${this.getTargetAccessor()}.getVariable("${this._variableName}", false).value, ${this.getValueString()}, "Expected ${this._variableName} to have value ${this._variableValue}");`;
        } else {
            return `t.assert.equal(${this.getTargetAccessor()}.getVariable("${this._variableName}").value, ${this.getValueString()}, "Expected ${this._variableName} to have value ${this._variableValue} in ${this.getTargetName()}");`;
        }
    }

    private getValueString(): string {
        if (this.isNumber(this._variableValue)) {
            return this._variableValue;
        } else {
            return `"${this._variableValue}"`
        }
    }

    private isNumber(value: string | number): boolean {
        return ((value != null) &&
            (value !== '') &&
            !isNaN(Number(value.toString())));
    }

    static createFactory() : AssertionFactory<VariableAssertion>{
        return new (class implements AssertionFactory<VariableAssertion> {
            createAssertions(state: Map<string, Map<string, any>>): VariableAssertion[] {
                const assertions = [];
                for (const targetState of Object.values(state)) {
                    if (targetState.clone) {
                        continue;
                    }
                    for (const [variableName, variableValue] of Object.entries(targetState.variables)) {
                        const variable = variableValue as Variable;
                        if (variable.type == Variable.SCALAR_TYPE) {
                            assertions.push(new VariableAssertion(targetState.target, variableName, variable.name, variable.value));
                        }
                    }
                }

                return assertions;
            }
        })();
    }
}
