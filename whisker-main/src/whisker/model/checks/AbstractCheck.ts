import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {CheckJSON} from "./newCheck";
import {ArgType} from "../util/schema";
import {z} from "zod";
import {Checks} from "../util/Checks";
import {Optional} from "../../utils/Optional";

export type SlimCheckJSON<J extends CheckJSON> = Optional<J, "name" | "negated">;

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

export const AttrName = z.preprocess(
    (attrName) => attrName === "costume" || attrName === "currentCostume" ? "currentCostumeName" : attrName,
    z.string()
);

export interface ICheckJSON {
    name: string;
    negated: boolean;
    args: ArgType[];
}

export const ICheckJSON = z.object({
    name: z.string(),
    negated: z.boolean(),
    args: z.array(z.string().or(z.number())),
});

/**
 * Check the edge condition/effect.
 * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
 * @param stepsSinceEnd Number of steps since the after run model tests started.
 */
export type CheckFun0 = (stepsSinceLastTransition?: number, stepsSinceEnd?: number) => boolean;
export type CheckFun1 = (stepsSinceLastTransition: number, stepsSinceEnd?: number) => boolean;
export type CheckFun2 = (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean;
export type CheckFun =
    | CheckFun0
    | CheckFun1
    | CheckFun2
    ;

/**
 * Super class for checks (effects/conditions on model edges). The check method depends on the test driver and needs
 * to be created once for every test run with a new test driver.
 */
export abstract class AbstractCheck<J extends CheckJSON = CheckJSON, C extends CheckFun = CheckFun> {
    protected readonly _edgeLabel: string;
    private readonly _checkJSON: J;
    private _check: C;

    /**
     * Get a check instance and test whether enough arguments are provided for a check type.
     * @param edgeLabel Label of the parent edge of the check.
     * @param checkJSON
     * @protected
     */
    protected constructor(edgeLabel: string, checkJSON: Optional<J, "negated">) {
        this._edgeLabel = edgeLabel;
        this._checkJSON = this._validate({negated: false, ...checkJSON} as J);
        this._check = (() => false) as C;
    }

    get edgeLabel(): string {
        return this._edgeLabel;
    }

    get name(): J["name"] {
        return this._checkJSON.name;
    }

    get negated(): J["negated"] {
        return this._checkJSON.negated;
    }

    protected get _args(): J["args"] {
        return this._checkJSON.args;
    }

    get check(): C {
        return this._check;
    }

    reasonForFailSummary():string {
        return "";
    }

    abstract get dependsOnSayText(): boolean;

    protected abstract _validate(checkJSON: J): J;

    /**
     * Test the arguments for this check with the current test driver instance that has a loaded scratch program and
     * get the correct check function (based and valid only on the given test driver!). This may throw an error if
     * arguments are not in the correct range (e.g. x coordinate) or a sprite/var/attribute is not defined.
     * @param t Instance of the test driver.
     * @param cu Instance of the check utility for listening and checking more complex events.
     * @param graphID ID of the parent graph of the check.
     */
    protected abstract _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): C;

    equals(that: AbstractCheck): boolean {
        return this.name === that.name && this.negated === that.negated && this._equalsArgs(that);
    }

    isInvertedOf(that: AbstractCheck): boolean {
        return this.name === that.name && this.negated !== that.negated && this._equalsArgs(that);
    }

    private _equalsArgs(that: AbstractCheck): boolean {
        return this._args.length === that._args.length && this._args.every((val, index) => val === that._args[index]);
    }

    testForContradictingWithEvents(checks: Checks): boolean {
        return checks.some((e) => this.contradicts(e));
    }

    /**
     * Register the check listener and test driver and check for errors.
     */
    registerComponents(t, cu: CheckUtility, graphID: string): void {
        try {
            this._check = this._checkArgsWithTestDriver(t, cu, graphID);
        } catch (e) {
            cu.addErrorOutput(this._edgeLabel, graphID, e);
            this._check = (() => false) as C;
        }
    }

    /**
     * Whether this effect contradicts another effect check.
     * @param that The other effect.
     */
    contradicts(that: AbstractCheck): boolean {
        if (this.name !== that.name || this.equals(that)) {
            return false;
        }

        if (this.isInvertedOf(that)) {
            return true;
        }

        return this._contradicts(that);
    }

    protected abstract _contradicts(that: AbstractCheck): boolean;

    toString(): string {
        const negated = this.negated ? "!" : "";
        const args = this._args.join(',');
        return `${negated}${this.name}(${args})`;
    }

    toJSON(): J {
        return JSON.parse(JSON.stringify(this._checkJSON));
    }
}
