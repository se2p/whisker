import TestDriver from "../../../test/test-driver";
import {CheckListener} from "../util/CheckListener";
import {ModelEdge} from "./ModelEdge";
import {Checks} from "../util/Checks";
import {Util} from "../util/Util";

/** Type for finding the correct condition function, defining the event. */
export enum ConditionName {
    Key = "Key", // args: key name
    Click = "Click", // args: sprite name
    VarTest = "VarTest", // args: sprite name, variable name, comparison (=,>,<...), value to compare to
    AttrTest = "AttrTest", // args: sprite name, attribute name, comparison (=,>,<...), value to compare to
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
    private readonly _condition: (ts: TestDriver, ...state) => boolean;
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
                testArgs(1);
                this._condition = Checks.getKeyDownCheck(negated, args[0]);
                break;
            case ConditionName.Click:
                testArgs(1);
                this._condition = Checks.getSpriteClickedCheck(negated, args[0]);
                break;
            case ConditionName.SpriteColor:
                testArgs(4);
                this._condition = Checks.getSpriteColorTouchingCheck(negated, args[0], args[1], args[2], args[3]);
                break;
            case ConditionName.SpriteTouching:
                testArgs(2);
                this._condition = Checks.getSpriteTouchingCheck(negated, args[0], args[1]);
                break;
            case ConditionName.VarTest:
                testArgs(4);
                this._condition = Checks.getVariableComparisonCheck(negated, args[0], args[1], args[2], args[3]);
                break;
            case ConditionName.AttrTest:
                testArgs(4);
                this._condition = Checks.getAttributeComparisonCheck(negated, args[0], args[1], args[2], args[3]);
                break;
            case ConditionName.Function:
                testArgs(1);
                this._condition = (t, cs) => {
                    return eval(this.args[0]);
                };
                break;
            case ConditionName.Nothing:
                // Nothing
                this._condition = (t, cs) => {
                    return true;
                };
                break;
            default:
                throw new Error("Condition type not recognized.");
        }
    }

    /**
     * Register the condition state.
     */
    registerCheckListener(checkListener: CheckListener) {
        this.checkListener = checkListener;
        switch (this.name) {
            case ConditionName.SpriteTouching:
                this.checkListener.registerTouching(this.args[0], this.args[1]);
                break;
            case ConditionName.SpriteColor:
                this.checkListener.registerColor(this.args[0], this.args[1], this.args[2], this.args[3]);
                break;
            case ConditionName.Key:
                this.checkListener.registerKeyCheck(this.args[0]);
                break;
        }
    }

    /**
     * Check the edge condition.
     * @param testDriver Instance of the test driver.
     */
    check(testDriver: TestDriver): boolean {
        return this._condition(testDriver, this.checkListener);
    }

    /**
     * Get the name of the condition event.
     */
    getConditionName(): ConditionName {
        return this.name;
    }

    /**
     * Check existences of sprites, existences of variables and ranges of arguments.
     */
    testConditionsForErrors(testDriver: TestDriver) {
        switch (this.name) {
            case ConditionName.SpriteTouching:
                Util.checkSpriteExistence(testDriver, this.args[0]);
                Util.checkSpriteExistence(testDriver, this.args[1]);
                break;
            case ConditionName.SpriteColor:
                Util.checkSpriteExistence(testDriver, this.args[0]);
                let r = this.args[1];
                let g = this.args[2];
                let b = this.args[3];

                if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
                    throw new Error("RGB ranges not correct.");
                }
                break;
            case ConditionName.Click:
                Util.checkSpriteExistence(testDriver, this.args[0]);
                break;
            case ConditionName.VarTest:
                let sprite = Util.checkSpriteExistence(testDriver, this.args[0]);
                let variable = sprite.getVariable(this.args[1]);

                if (variable == undefined) {
                    throw new Error("Variable not found: " + this.args[1]);
                }
                if (this.args[2] != "==" && this.args[2] != "=" && this.args[2] != ">" && this.args[2] != ">="
                    && this.args[2] != "<" && this.args[2] != "<=") {
                    throw new Error("Comparison not known: " + this.args[2]);
                }
                break;
            case ConditionName.AttrTest:
                Util.checkAttributeExistence(testDriver, this.args[0], this.args[1]);
                if (this.args[2] != "==" && this.args[2] != "=" && this.args[2] != ">" && this.args[2] != ">="
                    && this.args[2] != "<" && this.args[2] != "<=") {
                    throw new Error("Comparison not known: " + this.args[2]);
                }
                break;
            case ConditionName.Function:
                try {
                    eval(this.args[0]);
                } catch (e) {
                    throw new Error("Condition Function cannot be evaluated:\n" + e);
                }
        }
    }

    /**
     * Get the arguments for the condition.
     */
    getArgs() {
        return this.args;
    }

    get condition(): (ts: TestDriver, ...state) => boolean {
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
