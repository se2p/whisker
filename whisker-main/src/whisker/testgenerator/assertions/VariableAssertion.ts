import {escaped, js, WhiskerAssertion} from "./WhiskerAssertion";
import {AssertionFactory} from "./AssertionFactory";
//import Variable from "../scratch-vm/@types/scratch-vm/engine/variable";
import Variable from 'scratch-vm/src/engine/variable.js';
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {AssertionTargetState} from "./AssertionObserver";

export class VariableAssertion extends WhiskerAssertion {

    private readonly _variableID: string;
    private readonly _variableName: string;
    private readonly _variableValue: string;

    constructor(target: RenderedTarget, variableID: string, variableName: string, variableValue: string) {
        super(target);
        this._variableID = variableID;
        this._variableName = variableName;
        this._variableValue = variableValue;
    }

    evaluate(state: Map<string, AssertionTargetState>): boolean {
        for (const targetState of state.values()) {
            if (targetState.target === this._target) {
                return `${targetState.variables[this._variableID].value}` == `${this._variableValue}`;
            }
        }

        return false;
    }

    toString(): string {
        return `assert ${this.getTargetName()} variable ${this._variableName} has value ${this._variableValue}`;
    }

    toJavaScript(): string {
        if (this._target.isStage) {
            return js`t.assert.equal(${this.getTargetAccessor()}.getVariable("${this._variableName}", false).value, "${this.getValue()}", "Expected ${this._variableName} to have value ${this._variableValue}");`;
        } else {
            return js`t.assert.equal(${this.getTargetAccessor()}.getVariable("${this._variableName}").value, "${this.getValue()}", "Expected ${this._variableName} to have value ${this._variableValue} in ${this.getTargetName()}");`;
        }
    }

    private getValue(): string {
        return escaped(this._variableValue);
    }

    static createFactory(): AssertionFactory<VariableAssertion> {
        return new (class implements AssertionFactory<VariableAssertion> {
            createAssertions(state: Map<string, AssertionTargetState>): VariableAssertion[] {
                const assertions = [];
                for (const targetState of state.values()) {
                    if (targetState.clone) {
                        continue;
                    }
                    for (const [variableID, variableValue] of Object.entries(targetState.variables)) {
                        const variable = variableValue as Variable;
                        if (variable.type == Variable.SCALAR_TYPE &&
                            VariableAssertion._variableBelongsToTarget(variableID, targetState.target)) {
                            assertions.push(new VariableAssertion(targetState.target, variableID, variable.name, variable.value));
                        }
                    }
                }

                return assertions;
            }
        })();
    }

    /**
     * Name clashes are possible, we avoid them by checking if a respective sprite is interacting with a given variable.
     * Special handling for stage variables since these are global variables accessible from all sprites.
     * @param variableID of the variable we are evaluating.
     * @param target the RenderedTarget which is tested to interact with the variable in question.
     * @returns true if the RenderedTarget interacts with the variable.
     */
    private static _variableBelongsToTarget(variableID: string, target: RenderedTarget): boolean {
        for (const block of Object.values(target.blocks._blocks)) {
            if (("fields" in block && 'VARIABLE' in block['fields'] && block['fields']['VARIABLE']['id'] === variableID) ||
            target.isStage) {
                return true;
            }
        }
        return false;
    }
}
