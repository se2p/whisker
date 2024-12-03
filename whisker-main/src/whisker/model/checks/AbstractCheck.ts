import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {CheckJSON} from "./newCheck";
import {ArgType} from "../util/schema";
import {z} from "zod";

export type SpriteName =
    | string
    | [string, ...string[]]
    ;

export type VariableName = SpriteName;

export const SpriteName = z.union([
    z.string(),
    z.string().array().nonempty()
]);

export const VariableName = SpriteName;

export interface ICheckJSON {
    id: string
    name: string;
    negated: boolean;
    args: ArgType[];
}

let idUndefined = 0;

function nextId(): number {
    return idUndefined++;
}

export const ICheckJSON = z.object({
    id: z.string().default(() => `check${nextId()}`),
    name: z.string(),
    negated: z.boolean(),
    args: z.array(z.string().or(z.number())),
});

/**
 * Check the edge condition/effect.
 * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
 * @param stepsSinceEnd Number of steps since the after run model tests started.
 */
export type Check = (stepsSinceLastTransition?: number, stepsSinceEnd?: number) => boolean;

/**
 * Super class for checks (effects/conditions on model edges). The check method depends on the test driver and needs
 * to be created once for every test run with a new test driver.
 */
export abstract class AbstractCheck<C extends CheckJSON = CheckJSON> implements ICheckJSON {
    private _check: Check;

    /**
     * Get a check instance and test whether enough arguments are provided for a check type.
     * @param _id Id for this check.
     * @param _edgeLabel Label of the parent edge of the check.
     * @param _negated Whether the check is negated.
     * @param _name Type/name of the check.
     * @param _args List of arguments for the check.
     * @protected
     */
    protected constructor(
        protected readonly _id: string,
        protected readonly _edgeLabel: string,
        protected readonly _negated: boolean,
        protected readonly _name: C["name"],
        protected readonly _args: C["args"],
    ) {
        this._check = () => false;
    }

    get check(): Check {
        return this._check;
    }

    get dependsOnSayText(): boolean {
        return false;
    }

    /**
     * Test the arguments for this check with the current test driver instance that has a loaded scratch program and
     * get the correct check function (based and valid only on the given test driver!). This may throw an error if
     * arguments are not in the correct range (e.g. x coordinate) or a sprite/var/attribute is not defined.
     * @param t Instance of the test driver.
     * @param cu Instance of the check utility for listening and checking more complex events.
     * @param graphID ID of the parent graph of the check.
     */
    protected abstract _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): Check;

    get id(): string {
        return this._id;
    }

    get name(): C["name"] {
        return this._name;
    }

    get args(): C["args"] {
        return this._args;
    }

    get negated(): boolean {
        return this._negated;
    }

    toJSON(): C {
        return {
            id: this.id,
            name: this.name,
            args: this.args,
            negated: this.negated
        } as C;
    }

    private _equalsArgs(that: ICheckJSON): boolean {
        return this.args.length === that.args.length && this._args.every((val, index) => val === that.args[index]);
    }

    equals(check: ICheckJSON): boolean {
        return this.name == check.name && this.negated == check.negated && this._equalsArgs(check);
    }

    isInvertedOf(check: ICheckJSON): boolean {
        return this.name == check.name && this.negated != check.negated && this._equalsArgs(check);
    }

    testForContradictingWithEvents(eventStrings: string[]): boolean {
        return eventStrings.some((e) => {
            const {negated, name, args} = CheckUtility.splitEventString(e);
            return this.contradicts({id: "dummy", name, negated, args});
        });
    }

    private _checkChange(that: ICheckJSON): boolean {
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
            change1 = AbstractCheck._getInvertedChangeOp(change1);
            negated1 = !negated1;
        } else if (change2.length == 2) {
            change2 = AbstractCheck._getInvertedChangeOp(change2);
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
            this._check = this._checkArgsWithTestDriver(t, cu, graphID);
        } catch (e) {
            cu.addErrorOutput(this._edgeLabel, graphID, e);
            this._check = () => false;
        }
    }

    /**
     * Whether this effect contradicts another effect check.
     * @param that The other effect.
     */
    contradicts(that: ICheckJSON): boolean {
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
                    comp1 = AbstractCheck._getInvertedCompOp(comp1);
                }
                if (that.negated) {
                    comp2 = AbstractCheck._getInvertedCompOp(comp2);
                }

                return AbstractCheck._checkComparison(comp1, comp2, this.args[3], that.args[3]);
            case "NbrOfVisibleClones":
            case "NbrOfClones":
                if (this.args[0] != that.args[0]) {
                    return false;
                }

                comp1 = this.args[1];
                comp2 = that.args[1];
                if (this.negated) {
                    comp1 = AbstractCheck._getInvertedCompOp(comp1);
                }
                if (that.negated) {
                    comp2 = AbstractCheck._getInvertedCompOp(comp2);
                }

                return AbstractCheck._checkComparison(comp1, comp2, this.args[2], that.args[2]);

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
