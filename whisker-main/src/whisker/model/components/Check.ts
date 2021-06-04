import {ModelEdge} from "./ModelEdge";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {CheckGenerator} from "../util/CheckGenerator";

export enum CheckName {
    AttrChange = "AttrChange", // sprite name, attr name, ( + | - | = )
    AttrComp = "AttrComp",// args: sprite name, attribute name, comparison (=,>,<...), value to compare to
    BackgroundChange = "BackgroundChange",
    Click = "Click", // args: sprite name
    Function = "Function",
    Key = "Key", // args: key name
    Output = "Output", // sprite name, string output
    SpriteColor = "SpriteColor", // sprite touching a color, args: sprite name, red, green, blue values
    SpriteTouching = "SpriteTouching", // two sprites touching each other, args: two sprite names
    VarChange = "VarChange", // sprite name, var name, ( + | - | = )
    VarComp = "VarComp",// args: sprite name, variable name, comparison (=,>,<...), value to compare to
    Expr = "Expr", // evaluate an expression, args: expression
    Probability = "Probability" // for randomness, e.g. take an edge with probability 0.5. arg: probability (checks
    // rand<=prob)
}

/**
 * Super class for checks (effects/conditions on model edges). The check method depends on the test driver and needs
 * to be created once for every test run with a new test driver.
 */
export abstract class Check {
    protected readonly _id: string;
    protected readonly _edge: ModelEdge;
    protected readonly _name: CheckName;
    protected readonly _args: any[];
    protected readonly _negated: boolean;

    /**
     * Get a check instance and test whether enough arguments are provided for a check type.
     * @param id Id for this check.
     * @param edge Parent edge.
     * @param name Type/name of the check.
     * @param args List of arguments for the check.
     * @param negated Whether the check is negated.
     * @protected
     */
    protected constructor(id: string, edge: ModelEdge, name: CheckName, args: any[], negated: boolean) {
        if (!id || !edge) {
            throw new Error("No id or edge given.");
        }
        this._edge = edge;
        this._name = name;
        this._args = args;
        this._negated = negated;
        this._id = id;

        let _testArgs = function (length) {
            let error = new Error("Wrong number of arguments for check " + name + ".");
            if (args.length != length) {
                throw error;
            }

            for (let i = 0; i < length; i++) {
                if (args[i] == undefined) {
                    throw error;
                }
            }
        }

        switch (name) {
            case CheckName.BackgroundChange:
            case CheckName.Function:
            case CheckName.Key:
            case CheckName.Click:
            case CheckName.Probability:
            case CheckName.Expr:
                _testArgs(1);
                break;
            case CheckName.Output:
            case CheckName.SpriteTouching:
                _testArgs(2);
                break;
            case CheckName.VarChange:
            case CheckName.AttrChange:
                _testArgs(3);
                break;
            case CheckName.AttrComp:
            case CheckName.VarComp:
            case CheckName.SpriteColor:
                _testArgs(4);
                break;
            default:
                throw new Error("Check type not recognized: " + name);
        }
    }

    /**
     * Test the arguments for this check with the current test driver instance that has a loaded scratch program and
     * get the correct check function (based and valid only on the given test driver!). This may throw an error if
     * arguments are not in the correct range (e.g. x coordinate) or a sprite/var/attribute is not defined.
     * @param t Instance of the test driver.
     * @param cu Instance of the check utility for listening and checking more complex events.
     */
    checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility) {
        switch (this._name) {
            case CheckName.AttrComp:
                return CheckGenerator.getAttributeComparisonCheck(t, this._negated, this._args[0], this._args[1],
                    this._args[2], this._args[3]);
            case CheckName.AttrChange:
                return CheckGenerator.getAttributeChangeCheck(t, this._negated, this._args[0], this._args[1], this._args[2]);
            case CheckName.BackgroundChange:
                return CheckGenerator.getBackgroundChangeCheck(t, this._negated, this._args[0]);
            case CheckName.Function:
                return CheckGenerator.getFunctionCheck(t, this._negated, this._args[0]);
            case CheckName.Output:
                return CheckGenerator.getOutputOnSpriteCheck(t, this._negated, this._args[0], this._args[1]);
            case CheckName.VarChange:
                return CheckGenerator.getVariableChangeCheck(t, this._negated, this._args[0], this._args[1], this._args[2]);
            case CheckName.VarComp:
                return CheckGenerator.getVariableComparisonCheck(t, this._negated, this._args[0], this._args[1],
                    this._args[2], this._args[3]);
            case CheckName.SpriteTouching:
                return CheckGenerator.getSpriteTouchingCheck(t, cu, this._negated, this._args[0], this._args[1]);
            case CheckName.SpriteColor:
                return CheckGenerator.getSpriteColorTouchingCheck(t, cu, this._negated, this._args[0], this._args[1],
                    this._args[2], this._args[3]);
            case CheckName.Key:
                return CheckGenerator.getKeyDownCheck(t, cu, this._negated, this._args[0]);
            case CheckName.Click:
                return CheckGenerator.getSpriteClickedCheck(t, this._negated, this._args[0]);
            case CheckName.Expr:
                return CheckGenerator.getExpressionCheck(t, this._negated, this._args[0]);
            case CheckName.Probability:
                return CheckGenerator.getProbabilityCheck(t, this._negated, this._args[0]);
            default:
                return undefined;
        }
    }

    get edge(): ModelEdge {
        return this._edge;
    }

    get id(): string {
        return this._id;
    }

    get name(): CheckName {
        return this._name;
    }

    get args(): any[] {
        return this._args;
    }

    get negated(): boolean {
        return this._negated;
    }
}
