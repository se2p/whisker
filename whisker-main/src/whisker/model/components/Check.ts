import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {CheckGenerator} from "../util/CheckGenerator";

export enum CheckName {
    AttrChange = "AttrChange", // sprite name, attr name, ( + | - | = | += | -= | +<number> | <number> | -<number>)
    AttrComp = "AttrComp",// args: sprite name, attribute name, comparison (=,>,<...), value to compare to
    BackgroundChange = "BackgroundChange",
    Click = "Click", // args: sprite name
    Function = "Function",
    Key = "Key", // args: key name
    Output = "Output", // sprite name, string output
    SpriteColor = "SpriteColor", // sprite touching a color, args: sprite name, red, green, blue values
    SpriteTouching = "SpriteTouching", // two sprites touching each other, args: two sprite names
    VarChange = "VarChange", // sprite name, var name, ( + | - | = | += | -= | +<number> | <number> | -<number>)
    VarComp = "VarComp",// args: sprite name, variable name, comparison (=,>,<...), value to compare to
    Expr = "Expr", // evaluate an expression, args: expression
    Probability = "Probability", // for randomness, e.g. take an edge with probability 0.5. arg: probability (checks
    // rand<=prob) (but this probability depends on the other edge conditions tested before -> edge conditions are
    // tested one for one and not tested if another edge is taken before it)
    TimeElapsed = "TimeElapsed", // time from the test start on, time in milliseconds
    TimeBetween = "TimeBetween", //  time from the last edge transition in the model, in milliseconds
    TimeAfterEnd = "TimeAfterEnd", // time from program end (for after end models)
    NbrOfClones = "NbrOfClones", // sprite name, comparison, number
    NbrOfVisibleClones = "NbrOfVisibleClones", // sprite name, comparison, number
    TouchingEdge = "TouchingEdge", // sprite name regex
    TouchingVerticalEdge = "TouchingVerticalEdge", // sprite name regex
    TouchingHorizEdge = "TouchingHorizEdge", // sprite name regex
    RandomValue = "RandomValue" // sprite name regex, attrName
}

/**
 * Super class for checks (effects/conditions on model edges). The check method depends on the test driver and needs
 * to be created once for every test run with a new test driver.
 */
export class Check {
    protected readonly _id: string;
    protected readonly _name: CheckName;
    protected readonly _args: any[];
    protected readonly _negated: boolean;
    protected readonly _edgeLabel: string;

    /**
     * Get a check instance and test whether enough arguments are provided for a check type.
     * @param id Id for this check.
     * @param edgeLabel Label of the parent edge of the check.
     * @param name Type/name of the check.
     * @param args List of arguments for the check.
     * @param negated Whether the check is negated.
     * @protected
     */
    protected constructor(id: string, edgeLabel: string, name: CheckName, args: any[], negated: boolean) {
        if (!id) {
            throw new Error("No id given.");
        }
        this._name = name;
        this._args = args;
        this._negated = negated;
        this._id = id;
        this._edgeLabel = edgeLabel;

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
        };

        switch (name) {
            case CheckName.BackgroundChange:
            case CheckName.Function:
            case CheckName.Key:
            case CheckName.Click:
            case CheckName.Probability:
            case CheckName.Expr:
            case CheckName.TimeElapsed:
            case CheckName.TimeAfterEnd:
            case CheckName.TimeBetween:
            case CheckName.TouchingEdge:
            case CheckName.TouchingHorizEdge:
            case CheckName.TouchingVerticalEdge:
                _testArgs(1);
                break;
            case CheckName.Output:
            case CheckName.SpriteTouching:
            case CheckName.RandomValue:
                _testArgs(2);
                break;
            case CheckName.VarChange:
            case CheckName.AttrChange:
            case CheckName.NbrOfClones:
            case CheckName.NbrOfVisibleClones:
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
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     * @param graphID ID of the parent graph of the check.
     */
    checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, caseSensitive: boolean, graphID: string):
        (...any) => boolean {
        switch (this._name) {
            case CheckName.AttrComp:
                return CheckGenerator.getAttributeComparisonCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    caseSensitive, this._args[0], this._args[1], this._args[2], this._args[3]);
            case CheckName.AttrChange:
                return CheckGenerator.getAttributeChangeCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    caseSensitive, this._args[0], this._args[1], this._args[2]);
            case CheckName.BackgroundChange:
                return CheckGenerator.getBackgroundChangeCheck(t, cu, this._edgeLabel, this._negated, this._args[0]);
            case CheckName.Function:
                return CheckGenerator.getFunctionCheck(t, cu, this._edgeLabel, graphID, this._negated, caseSensitive,
                    this._args[0]);
            case CheckName.Output:
                return CheckGenerator.getOutputOnSpriteCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    caseSensitive, this._args[0], this._args[1]);
            case CheckName.VarChange:
                return CheckGenerator.getVariableChangeCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    caseSensitive, this._args[0], this._args[1], this._args[2]);
            case CheckName.VarComp:
                return CheckGenerator.getVariableComparisonCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    caseSensitive, this._args[0], this._args[1], this._args[2], this._args[3]);
            case CheckName.SpriteTouching:
                return CheckGenerator.getSpriteTouchingCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    caseSensitive, this._args[0], this._args[1]);
            case CheckName.SpriteColor:
                return CheckGenerator.getSpriteColorTouchingCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    caseSensitive, this._args[0], this._args[1], this._args[2], this._args[3]);
            case CheckName.Key:
                return CheckGenerator.getKeyDownCheck(t, cu, this._negated, this._args[0]);
            case CheckName.Click:
                return CheckGenerator.getSpriteClickedCheck(t, this._negated, caseSensitive, this._args[0]);
            case CheckName.Expr:
                return CheckGenerator.getExpressionCheck(t, cu, this._edgeLabel, graphID, this._negated, caseSensitive,
                    this._args[0]);
            case CheckName.Probability:
                return CheckGenerator.getProbabilityCheck(t, this._negated, this._args[0]);
            case CheckName.TimeElapsed:
                return CheckGenerator.getTimeElapsedCheck(t, this._negated, this._args[0]);
            case CheckName.TimeBetween:
                return CheckGenerator.getTimeBetweenCheck(t, this._negated, this._args[0]);
            case CheckName.NbrOfClones:
                return CheckGenerator.getNumberOfClonesCheck(t, this._negated, caseSensitive, false,
                    this._args[0], this._args[1], this._args[2]);
            case CheckName.NbrOfVisibleClones:
                return CheckGenerator.getNumberOfClonesCheck(t, this._negated, caseSensitive, true,
                    this._args[0], this._args[1], this._args[2]);
            case CheckName.TouchingEdge:
                return CheckGenerator.getTouchingEdgeCheck(t, cu, this._edgeLabel, graphID, this._negated, caseSensitive,
                    this._args[0]);
            case CheckName.TouchingHorizEdge:
                return CheckGenerator.getTouchingEdgeCheck(t, cu, this._edgeLabel, graphID, this._negated, caseSensitive,
                    this._args[0], false);
            case CheckName.TouchingVerticalEdge:
                return CheckGenerator.getTouchingEdgeCheck(t, cu, this._edgeLabel, graphID, this._negated, caseSensitive,
                    this._args[0], true, false);
            case CheckName.TimeAfterEnd:
                return CheckGenerator.getTimeAfterEndCheck(t, this._negated, this._args[0]);
            case CheckName.RandomValue:
                return CheckGenerator.getRandomValueCheck(t, cu, this._edgeLabel, graphID, this.negated, caseSensitive,
                    this.args[0], this.args[1]);
            default:
                return undefined;
        }
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

    simplifyForSave() {
        return {
            id: this.id,
            name: this.name,
            args: this.args,
            negated: this.negated
        };
    }

    equals(check: Check) {
        return this.name == check.name && this.negated == check.negated && this.arrayEquals(this.args, check.args);
    }

    private arrayEquals(a, b) {
        return a.length === b.length && a.every((val, index) => val === b[index]);
    }

    isInvertedOf(check: Check) {
        return this.name == check.name && this.negated != check.negated && this.arrayEquals(this.args, check.args);
    }

    static testForContradictingWithEvents(check1: Check, eventStrings: string[]) {
        for (let i = 0; i < eventStrings.length; i++) {
            let event = eventStrings[i];
            let {negated, name, args} = CheckUtility.splitEventString(event);
            let checkDummy = new Check("dummy", "dummyEdge", name, args, negated);
            if (Check.testForContradicting(check1, checkDummy)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Test whether the checks are contradicting each other.
     */
    static testForContradicting(check1: Check, check2: Check) {
        if (check1.name != check2.name || check1.equals(check2)) {
            return false;
        }
        if (check1.isInvertedOf(check2)) {
            return true;
        }

        let comp1, comp2;
        switch (check1.name) {
            case CheckName.Click:
                // you cant click on two different sprites at the same time
                return check1.args[0] != check2.args[0];
            case CheckName.BackgroundChange: // contradict if different costume names
                return check1.args[0] != check2.args[0];
            case CheckName.Output:
                // contradict if same sprite name and different output
                return check1.args[0] == check2.args[0] && check1.args[1] != check2.args[1];
            case CheckName.VarChange:
            case CheckName.AttrChange:
                if (check1.args[0] != check2.args[0] || check1.args[1] != check2.args[1]) {
                    return false;
                }

                return Check.checkChange(check1, check2);
            case CheckName.VarComp:
            case CheckName.AttrComp:
                if (check1.args[0] != check2.args[0] || check1.args[1] != check2.args[1]) {
                    return false;
                }

                comp1 = check1.args[2];
                comp2 = check2.args[2];
                if (check1.negated) {
                    comp1 = this.getInvertedCompOp(comp1);
                }
                if (check2.negated) {
                    comp2 = this.getInvertedCompOp(comp2);
                }

                return this.checkComparison(comp1, comp2, check1.args[3], check2.args[3]);
            case CheckName.NbrOfVisibleClones:
            case CheckName.NbrOfClones:
                if (check1.args[0] != check2.args[0]) {
                    return false;
                }

                comp1 = check1.args[1];
                comp2 = check2.args[1];
                if (check1.negated) {
                    comp1 = this.getInvertedCompOp(comp1);
                }
                if (check2.negated) {
                    comp2 = this.getInvertedCompOp(comp2);
                }

                return this.checkComparison(comp1, comp2, check1.args[2], check2.args[2]);

            default:
                return false;
        }
    }

    private static checkChange(check1: Check, check2: Check) {
        let change1 = check1.args[2];
        let change2 = check2.args[2];
        let negated1 = check1.negated;
        let negated2 = check2.negated;

        if (change1.length == 2 && change2.length == 2) {
            // += & +=, -= & -= are not getting until here, caught before call to checkChange
            // += & -=, -= & += only tested here
            return check1.negated == check2.negated;
        } else if (change1.length == 2) {
            change1 = Check.getInvertedChangeOp(change1);
            negated1 = !negated1;
        } else if (change2.length == 2) {
            change2 = Check.getInvertedChangeOp(change2);
            negated2 = !negated2;
        }

        if (change1 == change2) {
            return negated1 != negated2;
        } else {
            return !negated1 && !negated2;
        }
    }

    // only for += and -=
    private static getInvertedChangeOp(change): string {
        return change == "+=" ? "-" : "+";
    }

    private static getInvertedCompOp(comp): string {
        if (comp == "=" || comp == "==") {
            return "!=";
        } else if (comp == "<") {
            return ">=";
        } else if (comp == ">") {
            return "<=";
        } else if (comp == ">=") {
            return "<";
        } else if (comp == "<=") {
            return ">";
        }
        throw new Error("unknown comparison");
    }

    private static checkComparison(comparison1: string, comparison2: string, value1: string, value2: string): boolean {
        if (comparison1 == "!=" || comparison2 == "!=") {
            return false;
        }

        // =
        if ((comparison1 == '=' || comparison2 == '==') && (comparison2 == '=' || comparison2 == '==')) {
            return value1 != value2;
        } else if (comparison1 == '=' || comparison1 == '==') {
            return !eval(value1 + comparison2 + value2);
        } else if (comparison2 == '=' || comparison2 == '==') {
            return !eval(value2 + comparison1 + value1);
        }
        // < and <, > and >, < and <=, <= and <=, >= and >, > and >=
        if (comparison1.startsWith(comparison2) || comparison2.startsWith(comparison1)) {
            return false;
        }

        return !eval(value2 + comparison1 + value1) || !eval(value1 + comparison2 + value2);
    }
}
