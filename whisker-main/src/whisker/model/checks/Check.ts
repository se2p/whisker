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
    private readonly _id: string;
    private readonly _name: CheckName;
    private readonly _args: ArgType[];
    private readonly _negated: boolean;
    private readonly _edgeLabel: string;
    private readonly _dependsOnSayText: boolean;
    private _check: (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean;

    /**
     * Get a check instance and test whether enough arguments are provided for a check type.
     * @param id Id for this check.
     * @param edgeLabel Label of the parent edge of the check.
     * @param name Type/name of the check.
     * @param negated Whether the check is negated.
     * @param args List of arguments for the check.
     * @protected
     */
    constructor(id: string, edgeLabel: string, name: CheckName, negated: boolean, args: ArgType[]) {
        if (!id) {
            throw new Error("No id given.");
        }
        this._name = name;
        this._args = args;
        this._negated = negated;
        this._id = id;
        this._edgeLabel = edgeLabel;
        this._check = () => false;

        if (name == "Expr" && args.length > 1) {
            this._args = [args.join("\n")];
        }
        let expectedLength: number;
        switch (name) {
            case "BackgroundChange":
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

        if (name == "Output" || ((name == "AttrComp" || name == "AttrChange") && (args[1] == "sayText"))) {
            this._dependsOnSayText = true;
        } else if (name == "Expr") {
            this._dependsOnSayText = String(args[0]).includes(".sayText");
        } else {
            this._dependsOnSayText = false;
        }
    }

    /**
     * Check the edge condition/effect.
     * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
     * @param stepsSinceEnd Number of steps since the after run model tests started.
     */
    get check(): (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean {
        return this._check;
    }

    get dependsOnSayText(): boolean {
        return this._dependsOnSayText;
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

    testForContradictingWithEvents(eventStrings: string[]): boolean {
        return eventStrings.some((e) => {
            const {negated, name, args} = CheckUtility.splitEventString(e);
            const checkDummy = new Check("dummy", "dummyEdge", name, negated, args);
            return this.contradicts(checkDummy);
        });
    }

    private _checkChange(that: Check): boolean {
        let change1 = String(this.args[2]);
        let change2 = String(that.args[2]);
        let negated1 = this.negated;
        let negated2 = that.negated;

        if (change1.length == 2 && change2.length == 2) {
            // += & +=, -= & -= are not getting until here, caught before call to checkChange
            // += & -=, -= & += only tested here
            return this.negated == that.negated;
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

    /**
     * Register the check listener and test driver and check for errors.
     */
    registerComponents(t, cu: CheckUtility, graphID: string): void {
        try {
            this._check = this.checkArgsWithTestDriver(t, cu, graphID);
        } catch (e) {
            cu.addErrorOutput(this._edgeLabel, graphID, e);
            this._check = () => false;
        }
    }

    /**
     * Whether this effect contradicts another effect check.
     * @param that The other effect.
     */
    contradicts(that: Check): boolean {
        if (this.name != that.name || this.equals(that)) {
            return false;
        }
        if (this.isInvertedOf(that)) {
            return true;
        }

        let comp1: ArgType, comp2: ArgType;
        switch (this.name) {
            case "Click":
                // you cant click on two different sprites at the same time
                return this.args[0] != that.args[0];
            case "BackgroundChange": // contradict if different costume names
                return this.args[0] != that.args[0];
            case "Output":
                // contradict if same sprite name and different output
                return this.args[0] == that.args[0] && this.args[1] != that.args[1];
            case "VarChange":
            case "AttrChange":
                if (this.args[0] != that.args[0] || this.args[1] != that.args[1]) {
                    return false;
                }

                return this._checkChange(that);
            case "VarComp":
            case "AttrComp":
                if (this.args[0] != that.args[0] || this.args[1] != that.args[1]) {
                    return false;
                }

                comp1 = this.args[2];
                comp2 = that.args[2];
                if (this.negated) {
                    comp1 = Check._getInvertedCompOp(comp1);
                }
                if (that.negated) {
                    comp2 = Check._getInvertedCompOp(comp2);
                }

                return Check._checkComparison(comp1, comp2, this.args[3], that.args[3]);
            case "NbrOfVisibleClones":
            case "NbrOfClones":
                if (this.args[0] != that.args[0]) {
                    return false;
                }

                comp1 = this.args[1];
                comp2 = that.args[1];
                if (this.negated) {
                    comp1 = Check._getInvertedCompOp(comp1);
                }
                if (that.negated) {
                    comp2 = Check._getInvertedCompOp(comp2);
                }

                return Check._checkComparison(comp1, comp2, this.args[2], that.args[2]);

            default:
                return false;
        }
    }

    toString(): string {
        const negated = this.negated ? "!" : "";
        const args = this.args.join(',');
        return `${negated}${this.name}(${args})`;
    }
}
