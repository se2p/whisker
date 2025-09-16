import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {Check, CheckJSON} from "./newCheck";
import {ArgType} from "../util/schema";
import {z} from "zod";
import {Optional} from "../../utils/Optional";
import {CheckResult, fail} from "./CheckResult";
import Sprite from "../../../vm/sprite";

export type SlimCheckJSON<J extends CheckJSON> = Optional<J, "name" | "negated">;

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
export type CheckFun0 = (stepsSinceLastTransition?: number, stepsSinceEnd?: number) => CheckResult;
export type CheckFun1 = (stepsSinceLastTransition: number, stepsSinceEnd?: number) => CheckResult;
export type CheckFun2 = (stepsSinceLastTransition: number, stepsSinceEnd: number) => CheckResult;
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
    private _lastStepExecuted: number;
    private _lastResult: CheckResult | null;
    private _graphId: string | null;
    private _t: TestDriver | null;
    private _cu: CheckUtility | null;

    /**
     * Get a check instance and test whether enough arguments are provided for a check type.
     * @param edgeLabel Label of the parent edge of the check.
     * @param checkJSON
     * @protected
     */
    protected constructor(edgeLabel: string, checkJSON: Optional<J, "negated">) {
        this._edgeLabel = edgeLabel;
        this._checkJSON = this._validate({negated: false, ...checkJSON} as J);
        const message = `The check is not initialized: ${this.registerComponents.name} has not been called yet!`;
        this._check = (() => fail({message})) as C;
        this._lastResult = null;
        this._lastStepExecuted = -1;
    }

    private _check: C;

    get check(): C {
        return this._check;
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

    abstract get dependsOnSayText(): boolean;

    protected get cu(): CheckUtility {
        return this._cu;
    }

    protected get _args(): J["args"] {
        return this._checkJSON.args;
    }

    protected get graphID(): string {
        return this._graphId;
    }

    equals(that: AbstractCheck): boolean {
        return this.name === that.name && this.negated === that.negated && this._equalsArgs(that);
    }

    isInvertedOf(that: AbstractCheck): boolean {
        return this.name === that.name && this.negated !== that.negated && this._equalsArgs(that);
    }

    /**
     * Register the check listener and test driver and check for errors.
     */
    registerComponents(t: TestDriver, cu: CheckUtility, graphID: string): void {
        this._lastResult = null;
        this._lastStepExecuted = -1;
        this._t = t;
        this._cu = cu;
        this._graphId = graphID;
        try {
            const check = this._checkArgsWithTestDriver(t);
            this._check = ((stepsSinceLastTransition: number, stepsSinceEnd: number): CheckResult => {
                const currentStep = t.getTotalStepsExecuted();
                if (currentStep === this._lastStepExecuted && this._lastResult?.passed) {
                    return this._lastResult;
                }
                this._lastResult = check(stepsSinceLastTransition, stepsSinceEnd);
                this._lastStepExecuted = currentStep;
                return this._lastResult;
            }) as C;
        } catch (e) {
            cu.addErrorOutput(this._edgeLabel, graphID, e);
            const message = `There was an error setting up the check: ${e instanceof Error ? e.message : e}`;
            this._check = (() => fail({message})) as C;
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

    toString(): string {
        const negated = this.negated ? "!" : "";
        const args = this._args.join(',');
        return `${negated}${this.name}(${args})`;
    }

    toJSON(): J {
        return JSON.parse(JSON.stringify(this._checkJSON));
    }

    protected _registerOnMoveEvent(spriteName: string, check: (s: Sprite) => CheckResult): void {
        this._cu.registerOnMoveEvent(spriteName, this as unknown as Check, this._graphId, this._wrapSpriteCheckForCU(check));
    }

    protected _registerOnVisualChange(spriteName: string, check: (s: Sprite) => CheckResult): void {
        this._cu.registerOnVisualChange(spriteName, this as unknown as Check, this._graphId, this._wrapSpriteCheckForCU(check));
    }

    protected _registerOutput(spriteName: string, check: (s: Sprite) => CheckResult): void {
        this._cu.registerOutput(spriteName, this as unknown as Check, this._graphId, this._wrapSpriteCheckForCU(check));
    }

    protected _registerVarEvent(spriteName: string, check: () => CheckResult): void {
        this._cu.registerVarEvent(spriteName, this as unknown as Check, this._graphId, this._wrapVariableCheckForCU(check));
    }

    protected abstract _validate(checkJSON: J): J;

    /**
     * Test the arguments for this check with the current test driver instance that has a loaded scratch program and
     * get the correct check function (based and valid only on the given test driver!). This may throw an error if
     * arguments are not in the correct range (e.g. x coordinate) or a sprite/var/attribute is not defined.
     * @param t Instance of the test driver.
     */
    protected abstract _checkArgsWithTestDriver(t: TestDriver): C;

    protected abstract _contradicts(that: AbstractCheck): boolean;

    private _wrapSpriteCheckForCU(check: (s: Sprite) => CheckResult) {
        return (s: Sprite) => {
            const currentStep = this._t.getTotalStepsExecuted();
            if (currentStep === this._lastStepExecuted && this._lastResult?.passed) {
                return this._lastResult;
            }
            this._lastResult = check(s);
            this._lastStepExecuted = currentStep;
            return this._lastResult;
        };
    }

    private _wrapVariableCheckForCU(check: () => CheckResult) {
        return () => {
            const currentStep = this._t.getTotalStepsExecuted();
            if (currentStep === this._lastStepExecuted && this._lastResult?.passed) {
                return this._lastResult;
            }
            this._lastResult = check();
            this._lastStepExecuted = currentStep;
            return this._lastResult;
        };
    }

    private _equalsArgs(that: AbstractCheck): boolean {
        return this._args.length === that._args.length && this._args.every((val, index) => val === that._args[index]);
    }
}
