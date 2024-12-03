import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {CheckGenerator} from "../util/CheckGenerator";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";
import {ArgType, CheckJSON} from "../util/schema";

export const CHECK_NAMES = Object.freeze([
    "AttrChange", // sprite name, attr name, ( + | - | = | += | -= | +<number> | <number> | -<number>)
    "AttrComp",// args: sprite name, attribute name, comparison (=,>,<...), value to compare to
    "BackgroundChange",
    "Click", // args: sprite name
    "Function",
    "Key", // args: key name
    "Output", // sprite name, string output
    "SpriteColor", // sprite touching a color, args: sprite name, red, green, blue values
    "SpriteTouching", // two sprites touching each other, args: two sprite names
    "VarChange", // sprite name, var name, ( + | - | = | += | -= | +<number> | <number> | -<number>)
    "VarComp",// args: sprite name, variable name, comparison (=,>,<...), value to compare to
    "Expr", // evaluate an expression, args: expression
    "Probability", // for randomness, e.g. take an edge with probability 0.5. arg: probability (checks rand<=prob) (but this probability depends on the other edge conditions tested before -> edge conditions are tested one for one and not tested if another edge is taken before it)
    "TimeElapsed", // time from the test start on, time in milliseconds
    "TimeBetween", //  time from the last edge transition in the model, in milliseconds
    "TimeAfterEnd", // time from program end (for after end models)
    "NbrOfClones", // sprite name, comparison, number
    "NbrOfVisibleClones", // sprite name, comparison, number
    "TouchingEdge", // sprite name
    "TouchingVerticalEdge", // sprite name
    "TouchingHorizEdge", // sprite name
] as const);

export type CheckName = typeof CHECK_NAMES[number];

/**
 * Super class for checks (effects/conditions on model edges). The check method depends on the test driver and needs
 * to be created once for every test run with a new test driver.
 */
export class Check {
    protected readonly _id: string;
    protected readonly _name: CheckName;
    protected readonly _args: ArgType[];
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
    protected constructor(id: string, edgeLabel: string, name: CheckName, args: ArgType[], negated: boolean) {
        if (!id) {
            throw new Error("No id given.");
        }
        this._name = name;
        this._args = args;
        this._negated = negated;
        this._id = id;
        this._edgeLabel = edgeLabel;

        if ((name == "Expr" || name == "Function") && args.length > 1) {
            this._args = [args.join("\n")];
        }
        let expectedLength: number;
        switch (name) {
            case "BackgroundChange":
            case "Function":
            case "Key":
            case "Click":
            case "Probability":
            case "Expr":
            case "TimeElapsed":
            case "TimeAfterEnd":
            case "TimeBetween":
            case "TouchingEdge":
            case "TouchingHorizEdge":
            case "TouchingVerticalEdge":
                expectedLength = 1;
                break;
            case "Output":
            case "SpriteTouching":
                expectedLength = 2;
                break;
            case "VarChange":
            case "AttrChange":
            case "NbrOfClones":
            case "NbrOfVisibleClones":
                expectedLength = 3;
                break;
            case "AttrComp":
            case "VarComp":
            case "SpriteColor":
                expectedLength = 4;
                break;
            default:
                throw new NonExhaustiveCaseDistinction(name, "Check type not recognized: " + name);
        }
        if (this._args.length != expectedLength) {
            throw new Error("Wrong number of arguments for check " + name + ".");
        }
        if (this._args.some((arg) => arg == undefined)) {
            throw new Error("arguments cannot be undefined.");
        }
    }

    /**
     * Test the arguments for this check with the current test driver instance that has a loaded scratch program and
     * get the correct check function (based and valid only on the given test driver!). This may throw an error if
     * arguments are not in the correct range (e.g. x coordinate) or a sprite/var/attribute is not defined.
     * @param t Instance of the test driver.
     * @param cu Instance of the check utility for listening and checking more complex events.
     * @param graphID ID of the parent graph of the check.
     */
    checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string):
        ((...any: ArgType[]) => boolean) | ((...args: number[]) => boolean) {
        switch (this._name) {
            case "AttrComp":
                return CheckGenerator.getAttributeComparisonCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    this._args[0], this._args[1], this._args[2], this._args[3]);
            case "AttrChange":
                return CheckGenerator.getAttributeChangeCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    this._args[0], this._args[1], this._args[2]);
            case "BackgroundChange":
                return CheckGenerator.getBackgroundChangeCheck(t, cu, this._edgeLabel, this._negated, this._args[0]);
            case "Function":
                return CheckGenerator.getFunctionCheck(t, cu, this._edgeLabel, graphID, this._negated, this._args[0]);
            case "Output":
                return CheckGenerator.getOutputOnSpriteCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    this._args[0], this._args[1]);
            case "VarChange":
                return CheckGenerator.getVariableChangeCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    this._args[0], this._args[1], this._args[2]);
            case "VarComp":
                return CheckGenerator.getVariableComparisonCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    this._args[0], this._args[1], this._args[2], this._args[3]);
            case "SpriteTouching":
                return CheckGenerator.getSpriteTouchingCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    this._args[0], this._args[1]);
            case "SpriteColor":
                return CheckGenerator.getSpriteColorTouchingCheck(t, cu, this._edgeLabel, graphID, this._negated,
                    this._args[0], this._args[1], this._args[2], this._args[3]);
            case "Key":
                return CheckGenerator.getKeyDownCheck(t, cu, this._negated, this._args[0]);
            case "Click":
                return CheckGenerator.getSpriteClickedCheck(t, this._negated, this._args[0]);
            case "Expr":
                return CheckGenerator.getExpressionCheck(t, cu, this._edgeLabel, graphID, this._negated, this._args[0]);
            case "Probability":
                return CheckGenerator.getProbabilityCheck(t, this._negated, this._args[0]);
            case "TimeElapsed":
                return CheckGenerator.getTimeElapsedCheck(t, this._negated, this._args[0]);
            case "TimeBetween":
                return CheckGenerator.getTimeBetweenCheck(t, this._negated, this._args[0]);
            case "NbrOfClones":
                return CheckGenerator.getNumberOfClonesCheck(t, this._negated, false,
                    this._args[0], this._args[1], this._args[2]);
            case "NbrOfVisibleClones":
                return CheckGenerator.getNumberOfClonesCheck(t, this._negated, true,
                    this._args[0], this._args[1], this._args[2]);
            case "TouchingEdge":
                return CheckGenerator.getTouchingEdgeCheck(t, cu, this._edgeLabel, graphID, this._negated, this._args[0]);
            case "TouchingHorizEdge":
                return CheckGenerator.getTouchingEdgeCheck(t, cu, this._edgeLabel, graphID, this._negated, this._args[0],
                    false);
            case "TouchingVerticalEdge":
                return CheckGenerator.getTouchingEdgeCheck(t, cu, this._edgeLabel, graphID, this._negated, this._args[0],
                    true, false);
            case "TimeAfterEnd":
                return CheckGenerator.getTimeAfterEndCheck(t, this._negated, this._args[0]);
            default:
                throw new Error(`Unhandled check name "${this._name}"`);
        }
    }

    get id(): string {
        return this._id;
    }

    get name(): CheckName {
        return this._name;
    }

    get args(): ArgType[] {
        return this._args;
    }

    get negated(): boolean {
        return this._negated;
    }

    toJSON(): CheckJSON {
        return {
            id: this.id,
            name: this.name,
            args: this.args,
            negated: this.negated
        };
    }

    equals(check: Check): boolean {
        return this.name == check.name && this.negated == check.negated && this._arrayEquals(this.args, check.args);
    }

    private _arrayEquals<T>(a: T[], b: T[]): boolean {
        return a.length === b.length && a.every((val, index): boolean => val === b[index]);
    }

    isInvertedOf(check: Check): boolean {
        return this.name == check.name && this.negated != check.negated && this._arrayEquals(this.args, check.args);
    }

    static testForContradictingWithEvents(check1: Check, eventStrings: string[]): boolean {
        return eventStrings.some((e) => {
            const {negated, name, args} = CheckUtility.splitEventString(e);
            const checkDummy = new Check("dummy", "dummyEdge", name, args, negated);
            return Check.testForContradicting(check1, checkDummy);
        });
    }

    /**
     * Test whether the checks are contradicting each other.
     */
    static testForContradicting(check1: Check, check2: Check): boolean {
        if (check1.name != check2.name || check1.equals(check2)) {
            return false;
        }
        if (check1.isInvertedOf(check2)) {
            return true;
        }

        let comp1: ArgType, comp2: ArgType;
        switch (check1.name) {
            case "Click":
                // you cant click on two different sprites at the same time
                return check1.args[0] != check2.args[0];
            case "BackgroundChange": // contradict if different costume names
                return check1.args[0] != check2.args[0];
            case "Output":
                // contradict if same sprite name and different output
                return check1.args[0] == check2.args[0] && check1.args[1] != check2.args[1];
            case "VarChange":
            case "AttrChange":
                if (check1.args[0] != check2.args[0] || check1.args[1] != check2.args[1]) {
                    return false;
                }

                return Check._checkChange(check1, check2);
            case "VarComp":
            case "AttrComp":
                if (check1.args[0] != check2.args[0] || check1.args[1] != check2.args[1]) {
                    return false;
                }

                comp1 = check1.args[2];
                comp2 = check2.args[2];
                if (check1.negated) {
                    comp1 = this._getInvertedCompOp(comp1);
                }
                if (check2.negated) {
                    comp2 = this._getInvertedCompOp(comp2);
                }

                return this._checkComparison(comp1, comp2, check1.args[3], check2.args[3]);
            case "NbrOfVisibleClones":
            case "NbrOfClones":
                if (check1.args[0] != check2.args[0]) {
                    return false;
                }

                comp1 = check1.args[1];
                comp2 = check2.args[1];
                if (check1.negated) {
                    comp1 = this._getInvertedCompOp(comp1);
                }
                if (check2.negated) {
                    comp2 = this._getInvertedCompOp(comp2);
                }

                return this._checkComparison(comp1, comp2, check1.args[2], check2.args[2]);

            default:
                return false;
        }
    }

    private static _checkChange(check1: Check, check2: Check): boolean {
        let change1 = String(check1.args[2]);
        let change2 = String(check2.args[2]);
        let negated1 = check1.negated;
        let negated2 = check2.negated;

        if (change1.length == 2 && change2.length == 2) {
            // += & +=, -= & -= are not getting until here, caught before call to checkChange
            // += & -=, -= & += only tested here
            return check1.negated == check2.negated;
        }

        if (change1.length == 2) {
            change1 = Check._getInvertedChangeOp(change1);
            negated1 = !negated1;
        } else if (change2.length == 2) {
            change2 = Check._getInvertedChangeOp(change2);
            negated2 = !negated2;
        }

        if (change1 == change2) {
            return negated1 != negated2;
        }

        return !negated1 && !negated2;
    }

    // only for += and -=
    private static _getInvertedChangeOp(change: string): string {
        return change == "+=" ? "-" : "+";
    }

    private static _getInvertedCompOp(comp: ArgType): string {
        switch (comp) {
            case "=":
            case "==":
                return "!=";
            case "<":
                return ">=";
            case ">":
                return "<=";
            case ">=":
                return "<";
            case "<=":
                return ">";
            default:
                throw new Error("unknown comparison");
        }
    }

    private static _checkComparison(pComparison1: ArgType, pComparison2: ArgType, pValue1: ArgType, pValue2: ArgType): boolean {
        const comparison1 = String(pComparison1);
        const comparison2 = String(pComparison2);
        const value1 = String(pValue1);
        const value2 = String(pValue2);


        if (comparison1 == "!=" || comparison2 == "!=") {
            return false;
        }

        // =
        if ((comparison1 == '=' || comparison2 == '==') && (comparison2 == '=' || comparison2 == '==')) {
            return value1 != value2;
        }

        if (comparison1 == '=' || comparison1 == '==') {
            return !eval(value1 + comparison2 + value2);
        }

        if (comparison2 == '=' || comparison2 == '==') {
            return !eval(value2 + comparison1 + value1);
        }

        // < and <, > and >, < and <=, <= and <=, >= and >, > and >=
        if (comparison1.startsWith(comparison2) || comparison2.startsWith(comparison1)) {
            return false;
        }

        return !eval(value2 + comparison1 + value1) || !eval(value1 + comparison2 + value2);
    }

    toString(): string {
        const negated = this.negated ? "!" : "";
        const args = this.args.join(',');
        return `${negated}${this.name}(${args})`;
    }
}
