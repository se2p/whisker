import {z} from "zod";
import {Bounds, Comparison, newComparison} from "./Comparison";
import {Existential, Quantifiable, Quantification, Universal} from "./Quantification";
import {Optional} from "../../utils/Optional";
import {CheckResult, result} from "./CheckResult";
import {ArgType} from "../util/schema";

export class Change implements Quantifiable<Change> {
    private readonly _comparison: Comparison;
    private readonly _nearBounds: Comparison | null;

    protected constructor(comparison: Comparison) {
        this._comparison = comparison;
        this._nearBounds = null;

        if (comparison.operator !== "==" || comparison.bounds === null) {
            return;
        }

        const change = comparison.operand2;

        if (typeof change !== "number" || change === 0) {
            return;
        }

        const operator = change > 0 ? ">=" : "<=";
        this._nearBounds = newComparison({operator, value: change});
    }

    private _compareNearBounds(after: number): boolean {
        if (this._nearBounds === null) {
            return false;
        }

        const {min, max} = this._comparison.bounds;

        if (this._nearBounds.operand2 > 0 && after === max) {
            return true;
        }

        if (this._nearBounds.operand2 < 0 && after === min) {
            return true;
        }

        return false;
    }

    apply(after: number, before: number): CheckResult {
        const actual = after - before;
        const comparison = this._compareNearBounds(after) ? this._nearBounds : this._comparison;
        return comparison.apply(actual).replace({before, after});
    }

    contradicts(that: Change): boolean {
        return this._comparison.contradicts(that._comparison);
    }

    negate(): Change {
        return new Change(this._comparison.negate());
    }

    static from(numberOrChangeOp: NumberOrChangeOp, bounds: Bounds | null = null): Change {
        // Special handling to support string operands as the subtraction trick would not work.
        switch (numberOrChangeOp) {
            case "=":
                return new Eq0(bounds);
            case "!=":
                return new Neq0(bounds);
        }

        if (typeof numberOrChangeOp === "number") {
            return new Change(newComparison({operator: "==", value: numberOrChangeOp}, bounds));
        }

        const operator = ({
            "+": ">",
            "-": "<",
            "+=": ">=",
            "-=": "<="
        } as const)[numberOrChangeOp];

        return new Change(newComparison({operator, value: 0}, bounds));
    }
}

class Eq0 extends Change {
    constructor(private readonly _bounds: Bounds) {
        super(newComparison({operator: "==", value: 0}, _bounds));
    }

    override apply(after: string | number, before: string | number): CheckResult {
        return result(after == before, {before, after});
    }

    override negate(): Change {
        return new Neq0(this._bounds);
    }
}

class Neq0 extends Change {
    constructor(private readonly _bounds: Bounds) {
        super(newComparison({operator: "!=", value: 0}, _bounds));
    }

    override apply(after: string | number, before: string | number): CheckResult {
        return result(after != before, {before, after});
    }

    override negate(): Change {
        return new Eq0(this._bounds);
    }
}

export const changeOps = ["+", "-", "=", "+=", "-=", "!="] as const;

export function isValidChangeOperator(change: ArgType): boolean {
    return (changeOps as readonly ArgType[]).includes(change);
}

export type ChangeOp = typeof changeOps[number];

const ChangeOp = z.preprocess(
    (change) => { // Canonicalize operators, handle aliases.
        switch (change) {
            case "++":
                return "+";
            case "--":
                return "-";
            case "==":
                return "=";
            default:
                return change;
        }
    },
    z.enum(changeOps)
);

/**
 * Either a number, or a number-like string, e.g., "3.14", "-5", "+1.234", "0e4", but not the empty string.
 */
const NumberLike = z.union([
    z.number(),
    z.string().refine((s) => s.trim() !== "")
])
    .pipe(z.coerce.number())
    .refine((n) => !Number.isNaN(n));

export type NumberOrChangeOp =
    | number
    | ChangeOp
    ;

export const NumberOrChangeOp = NumberLike.or(ChangeOp);

export function newChange(
    {change: numberOrChangeOp, negated = false}: Optional<ChangingCheck, "negated">,
    bounds: Bounds | null = null,
): Change {
    const change = Change.from(numberOrChangeOp, bounds);
    return negated ? change.negate() : change;
}

export interface ChangingCheck {
    change: NumberOrChangeOp;
    negated: boolean;
}

export function newQuantifiedChange(
    {change: numOp, negated = false}: Optional<ChangingCheck, 'negated'>,
    bounds: Bounds | null = null,
): Quantification<Change> {
    const change = newChange({change: numOp, negated: false}, bounds);

    return negated
        ? new Universal(change.negate())
        : new Existential(change);
}
