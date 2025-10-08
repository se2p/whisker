import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {CheckJSON, ConditionJSON, SideEffectJSON} from "./newCheck";
import {ArgType} from "../util/schema";
import {z} from "zod";
import {Optional} from "../../utils/Optional";
import {CheckResult, fail} from "./CheckResult";

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
    private _check: C;
    private _lastStepExecuted: number;
    private _lastResult: CheckResult;
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
        this._reset();
    }

    abstract get isPure(): boolean;

    private _reset(): void {
        this._lastResult = fail({message: "The check has not been called yet!"});
        this._lastStepExecuted = -1;
    }

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
        this._reset();
        this._t = t;
        this._cu = cu;
        this._graphId = graphID;
        try {
            const check = this._checkArgsWithTestDriver(t);
            this._check = this._wrapCheck(check) as C;
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

    protected _registerOnMoveEvent(spriteName: string): void {
        this._cu.registerOnMoveEvent(spriteName);
    }

    protected _registerOnVisualChange(spriteName: string): void {
        this._cu.registerOnVisualChange(spriteName);
    }

    protected _registerOutput(spriteName: string): void {
        this._cu.registerOutput(spriteName);
    }

    protected _registerVarEvent(varName: string): void {
        this._cu.registerVarEvent(varName);
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

    private _wrapCheck<T extends unknown[]>(check: (...args: T) => CheckResult): (...args: T) => CheckResult {
        return (...args: T) => {
            const currentStep = this._t.getTotalStepsExecuted();
            if (currentStep === this._lastStepExecuted && this._lastResult.passed) {
                return this._lastResult;
            }
            this._lastResult = check(...args);
            this._lastStepExecuted = currentStep;
            return this._lastResult;
        };
    }

    private _equalsArgs(that: AbstractCheck): boolean {
        return this._args.length === that._args.length && this._args.every((val, index) => val === that._args[index]);
    }
}

export abstract class ConditionCheck<J extends ConditionJSON = ConditionJSON, C extends CheckFun = CheckFun> extends AbstractCheck<J, C> {
    override get isPure(): true {
        return true;
    }
}

export abstract class SideEffectCheck<J extends SideEffectJSON = SideEffectJSON, C extends CheckFun = CheckFun> extends AbstractCheck<J, C> {
    override get isPure(): false {
        return false;
    }
}
