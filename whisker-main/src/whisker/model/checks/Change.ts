import {z} from "zod";
import {Comparison, Interval, newComparison} from "./Comparison";
import {Existential, Quantifiable, Quantification, Universal} from "./Quantification";
import {Optional} from "../../utils/Optional";
import {CheckResult, result} from "./CheckResult";
import {ArgType} from "../util/schema";

/**
 * Implements the modulo operator. This is similar to JavaScript's remainder operator (`x % y`). In fact, if `x` and
 * `y` have the same sign, the two operators are equivalent. Otherwise, the result of `x % y` has the same sign as
 * the dividend (`x`), while `mod(x, y)` has the same sign as the divisor (`y`).
 *
 * @param x dividend
 * @param y divisor
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
 */
export function mod(x: number, y: number): number {
    return ((x % y) + y) % y;
}

export interface Bounds extends Interval {
    kind: "clamped" | "cyclic";
}

interface ClampedBounds extends Bounds {
    kind: "clamped";
}

interface CyclicBounds extends Bounds {
    kind: "cyclic";
}

export class Change implements Quantifiable<Change> {
    protected readonly _comparison: Comparison<Bounds>;

    constructor(comparison: Comparison<Bounds>) {
        this._comparison = comparison;
    }

    protected _apply(after: number, before: number): CheckResult {
        return this._comparison.apply(after - before);
    }

    apply(after: number, before: number): CheckResult {
        return this._apply(after, before).replace({before, after});
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

        type ChangeCtor = new (comparison: Comparison) => Change;

        const Chg: ChangeCtor = {
            unbound: Change,
            cyclic: CyclicChange,
            clamped: ClampedChange,
        }[bounds === null ? "unbound" : bounds.kind];

        if (typeof numberOrChangeOp === "number") {
            return new Chg(newComparison({operator: "==", value: numberOrChangeOp}, bounds));
        }

        const operator = ({
            "+": ">",
            "-": "<",
            "+=": ">=",
            "-=": "<="
        } as const)[numberOrChangeOp];

        return new Chg(newComparison({operator, value: 0}, bounds));
    }
}

export function mapInterval(x: number, {min, max}: Interval): number {
    return mod(
        x - min, // Shift interval such that it starts at 0, which allows mod to be used
        max - min + 1 // Length of the interval
    ) + min; // Shift interval back to original position
}

class CyclicChange extends Change {
    constructor(comparison: Comparison<CyclicBounds>) {
        super(comparison);
    }

    /**
     * Maps the given number `x` to the interval. Returns `x` unchanged if it is already inside the interval. Otherwise,
     * adds or subtracts the interval length to `x` repeatedly until we get a number inside the interval. This number is
     * then returned.
     *
     * @param x The number to map to the interval
     * @private
     */
    private _mapInterval(x: number): number {
        return mapInterval(x, this._comparison.interval);
    }

    override _apply(after: number, before: number): CheckResult {
        const actualChange = this._mapInterval(after - before);
        return this._comparison.apply(actualChange);
    }
}

class ClampedChange extends Change {
    private readonly _atBounds: Comparison;

    constructor(comparison: Comparison<ClampedBounds>) {
        super(comparison);

        const expectedChange = this._comparison.operand2;
        const operator = expectedChange > 0 ? "<=" : ">=";
        this._atBounds = newComparison({operator, value: expectedChange});
    }

    override _apply(after: number, before: number): CheckResult {
        const bounds = Object.values(this._comparison.interval);
        return bounds.includes(after)
            ? this._atBounds.apply(after - before)
            : super._apply(after, before);
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
