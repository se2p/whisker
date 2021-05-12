import TestDriver from "../../../test/test-driver";
import {CheckListener} from "../util/CheckListener";
import {ModelEdge} from "./ModelEdge";
import {Checks} from "../util/Checks";
import {ModelResult} from "../../../test-runner/test-result";

/** Type for finding the correct condition function, defining the event. */
export enum ConditionName {
    Key = "Key", // args: key name
    Click = "Click", // args: sprite name
    VarComp = "VarComp", // args: sprite name, variable name, comparison (=,>,<...), value to compare to
    AttrComp = "AttrComp", // args: sprite name, attribute name, comparison (=,>,<...), value to compare to,
    VarChange = "VarChange", // sprite name, var name, ( + | - | new value)
    AttrChange = "AttrChange", // sprite name, attr name, (+|-|new value)
    SpriteTouching = "SpriteTouching", // two sprites touching each other, args: two sprite names
    SpriteColor = "SpriteColor", // sprite touching a color, args: sprite name, red, green, blue values
    Function = "Function", // args: js test function as a string
    Nothing = "Nothing" // instead of green flag event mostly
}

/**
 * Evaluate the conditions for the given edge.
 * @param newEdge Edge with the given condition.
 * @param condString String representing the conditions.
 */
export function setUpCondition(newEdge: ModelEdge, condString: string) {
    const conditions = condString.split(",");

    try {
        conditions.forEach(cond => {
            newEdge.addCondition(getCondition(cond));
        })
    } catch (e) {
        throw new Error("Edge '" + newEdge.id + "': " + e.message);
    }
}

/**
 * Converts a single condition for an edge into a function that can be evaluated. Single condition could be f.e.
 * 'Key:space'.
 * @param condString String part on the edge of the xml file that is the condition.
 */
export function getCondition(condString): Condition {
    let negated = false;
    if (condString.startsWith("!")) {
        negated = true;
        condString = condString.substr(1, condString.length);
    }

    const parts = condString.split(":");

    if (parts.length < 2 && condString != ConditionName.Nothing) {
        throw new Error("Edge condition not correctly formatted. ':' missing.");
    }
    return new Condition(parts[0], negated, parts.splice(1, parts.length));
}

/**
 * Defining an edge condition.
 */
export class Condition {
    private readonly name: ConditionName;
    private _condition: (...state) => boolean;
    private readonly args: any[];

    private readonly _negated: boolean;
    private checkListener: CheckListener;

    /**
     * Get a condition instance. Checks the number of arguments for a condition type.
     * @param name Type name of the condition.
     * @param negated Whether the condition is negated.
     * @param args The arguments for the condition to check later on.
     */
    constructor(name: ConditionName, negated: boolean, args: any[]) {
        this.name = name;
        this.args = args;
        this._negated = negated;

        let testArgs = function (length) {
            let error = new Error("Not enough arguments for condition " + name + ".");
            if (args.length !== length) {
                throw error;
            }

            for (let i = 0; i < length; i++) {
                if (args[i] == undefined) {
                    throw error;
                }
            }
        }

        // Get the condition by the name given.
        switch (this.name) {
            case ConditionName.Key:
            case ConditionName.Function:
            case ConditionName.Click:
                testArgs(1);
                break;
            case ConditionName.SpriteTouching:
                testArgs(2);
                break;
            case ConditionName.VarChange:
            case ConditionName.AttrChange:
                testArgs(3);
                break;
            case ConditionName.SpriteColor:
            case ConditionName.VarComp:
            case ConditionName.AttrComp:
                testArgs(4);
                break;
            case ConditionName.Nothing:
                break;
            default:
                throw new Error("Condition type not recognized: " + this.name);
        }
    }

    /**
     * Register the check listener and test driver and check the condition for errors.
     */
    registerComponents(cs: CheckListener, t: TestDriver, result: ModelResult) {
        try {
            switch (this.name) {
                case ConditionName.SpriteTouching:
                    this._condition = Checks.getSpriteTouchingCheck(t, cs, this.negated, (this.args)[0], (this.args)[1]);
                    break;
                case ConditionName.SpriteColor:
                    this._condition = Checks.getSpriteColorTouchingCheck(t, cs, this.negated, (this.args)[0],
                        (this.args)[1], (this.args)[2], (this.args)[3]);
                    break;
                case ConditionName.Key:
                    this._condition = Checks.getKeyDownCheck(t, cs, this.negated, this.args[0]);
                    break;
                case ConditionName.Click:
                    this._condition = Checks.getSpriteClickedCheck(t, this.negated, this.args[0]);
                    break;
                case ConditionName.VarComp:
                    this._condition = Checks.getVariableComparisonCheck(t, this.negated, this.args[0], this.args[1],
                        this.args[2], this.args[3]);
                    break;
                case ConditionName.AttrComp:
                    this._condition = Checks.getAttributeComparisonCheck(t, this.negated, this.args[0], this.args[1],
                        this.args[2], this.args[3]);
                    break;
                case ConditionName.AttrChange:
                    this._condition = Checks.getAttributeChangeCheck(t, this.negated, this.args[0], this.args[1], this.args[2]);
                    break;
                case ConditionName.VarChange:
                    this._condition = Checks.getVariableChangeCheck(t, this.negated, this.args[0], this.args[1], this.args[2]);
                    break;
                case ConditionName.Function:
                    this._condition = Checks.getFunctionCheck(t, this.negated, this.args[0]);
                    break;
                case ConditionName.Nothing:
                    this._condition = (cs) => {
                        return true;
                    };
                    break;
            }
        } catch (e) {
            console.error(e);
            result.error.push(e);
        }
    }

    /**
     * Check the edge condition.
     */
    check(): boolean {
        return this._condition(this.checkListener);
    }

    /**
     * Get the name of the condition event.
     */
    getConditionName(): ConditionName {
        return this.name;
    }

    /**
     * Get the arguments for the condition.
     */
    getArgs() {
        return this.args;
    }

    get condition(): (...state) => boolean {
        return this._condition;
    }

    get negated(): boolean {
        return this._negated;
    }

    /**
     * Get a compact representation for this condition for edge tracing.
     */
    toString() {
        if (this.name == ConditionName.Nothing) {
            return "no condition";
        }
        let result = this.name + "(";

        if (this.args.length == 1) {
            result = result + this.args[0];
        } else {
            result = result + this.args.concat();
        }

        result = result + ")";
        if (this._negated) {
            result = result + " (negated)";
        }
        return result;
    }
}
