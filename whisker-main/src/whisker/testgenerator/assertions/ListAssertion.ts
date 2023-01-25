import {js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
//import Variable from "../scratch-vm/@types/scratch-vm/engine/variable";
import Variable from 'scratch-vm/src/engine/variable.js';
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class ListAssertion extends WhiskerAssertion {

    private readonly _variableID: string;
    private readonly _variableName: string;
    private readonly _variableValue: [];

    constructor(target: RenderedTarget, variableID: string, variableName: string, variableValue: []) {
        super(target);
        this._variableID = variableID;
        this._variableName = variableName;
        this._variableValue = variableValue;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                if (Array.isArray(targetState.variables[this._variableID].value)) {
                    const listVariable = targetState.variables[this._variableID].value as [];
                    return listVariable.length == this._variableValue.length;
                }
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} list variable ${this._variableName} has length ${this._variableValue.length}`;
    }

    toJavaScript(): string {
        if (this._target.isStage) {
            return js`t.assert.equal(${this.getTargetAccessor()}.getList("${this._variableName}", false).value.length, ${this._variableValue.length}, "Expected list ${this._variableName} to have length ${this._variableValue.length}");`;
        } else {
            return js`t.assert.equal(${this.getTargetAccessor()}.getList("${this._variableName}").value.length, ${this._variableValue.length}, "Expected list ${this._variableName} of sprite ${this.getTargetName()} to have length ${this._variableValue.length}");`;
        }
    }

    static createFactory(): AssertionFactory<ListAssertion> {
        return new (class implements AssertionFactory<ListAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): ListAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (!targetState.target.isOriginal) {
                        continue;
                    }
                    for (const [variableName, variableValue] of Object.entries(targetState.variables)) {
                        const variable = variableValue as Variable;
                        if (variable.type == Variable.LIST_TYPE) {
                            assertions.push(new ListAssertion(targetState.target, variableName, variable.name, variable.value));
                        }
                    }
                }

                return assertions;
            }
        })();
    }
}
