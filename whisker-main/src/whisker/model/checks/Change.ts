import {Comparison, CONST_PASS, Interval, newComparison} from "./Comparison";
import {Optional} from "../../utils/Optional";
import {CheckResult, Reason, result} from "./CheckResult";

import {ChangeOp, ComparisonOp, NumberOrChangeOp} from "./CheckTypes";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";

interface IBounds extends Interval {
    kind: "clamped" | "cyclic";
}

interface ClampedBounds extends IBounds {
    kind: "clamped";
}

interface CyclicBounds extends IBounds {
    kind: "cyclic";
}

export type Bounds =
    | ClampedBounds
    | CyclicBounds
    ;

export class Change {
    protected constructor(
        protected readonly _comparison: Comparison,
        protected readonly _bounds: Bounds | null = null,
    ) {
        if (_bounds === null) {
            return;
        }

        const {min, max} = _bounds;

        if (!(min < max)) {
            throw new RangeError(`Expected min < max, but got min=${min} and max=${max}`);
        }
    }

    static from(numberOrChangeOp: NumberOrChangeOp, bounds: Bounds | null = null): Change {
        // Special handling to support string operands as the subtraction trick would not work.
        if (bounds === null) {
            switch (numberOrChangeOp) {
                case "==":
                    return new Eq0(bounds);
                case "!=":
                    return new Neq0(bounds);
            }
        }

        const operatorMap = {
            "+": ">",
            "-": "<",
            "+=": ">=",
            "-=": "<=",
            "==": "==",
            "!=": "!=",
        } as Record<ChangeOp, ComparisonOp>;

        /*
         * Expresses a change in terms of a comparison:
         *
         * Operator     Comparison
         *
         *    +n        after - before == +n
         *    -n        after - before == -n
         *    0         after - before == 0
         *
         *    +         after - before >  0
         *    +=        after - before >= 0
         *    -         after - before <  0
         *    -=        after - before <= 0
         *    =         after - before == 0
         *    !=        after - before != 0
         */
        const comparison = newComparison<null>(
            typeof numberOrChangeOp === "number"
                ? {operator: "==", value: numberOrChangeOp}
                : {operator: operatorMap[numberOrChangeOp], value: 0}
        );

        if (bounds === null) {
            return new Change(comparison);
        }

        const boundsKind = bounds.kind;

        switch (boundsKind) {
            case "clamped":
                return new ClampedChange(comparison, bounds);
            case "cyclic":
                return new CyclicChange(comparison, bounds);
            default:
                throw new NonExhaustiveCaseDistinction(boundsKind);
        }
    }

    apply(after: number, before: number): CheckResult {
        return this._apply(this._clampToBounds(after), this._clampToBounds(before))
            .replace(this._extendReasonWithInterval({before, after}));
    }

    contradicts(that: Change): boolean {
        return this._comparison.contradicts(that._comparison);
    }

    negate(): Change {
        return new Change(this._comparison.negate(), this._bounds);
    }

    protected _apply(after: number, before: number): CheckResult {
        return this._comparison.apply(after - before);
    }

    private _clampToBounds(v: number): number {
        if (this._bounds === null) {
            return v;
        }

        // Although the stage has a width of 480 with bounds [-240, 240], it appears the x values of sprites can
        // sometimes drop below -240 or exceed 240. This might happen for other attributes as well. Our computations
        // might not expect values outside the interval, so we clamp these values back to it.
        const {min, max} = this._bounds;
        return Math.max(min, Math.min(max, v));
    }

    protected _extendReasonWithInterval(reason: Reason): Reason {
        return this._bounds === null ? reason : {...this._bounds, ...reason};
    }
}

class CyclicChange extends Change {
    private readonly _length: number;

    constructor(comparison: Comparison, bounds: CyclicBounds) {
        if (["<=", ">="].includes(comparison.operator)) { // Always passes
            super(CONST_PASS, bounds);
        } else if (["<", ">"].includes(comparison.operator)) { // Equivalent to !=
            super(newComparison({operator: "!=", value: 0}), bounds);
        } else {
            super(comparison, bounds);
        }

        this._length = bounds.max - bounds.min;
    }

    protected override _apply(after: number, before: number): CheckResult {
        const result = super._apply(after, before);

        if (!["==", "!="].includes(this._comparison.operator)) {
            return result;
        }

        // The special handling below is required only for changes by an exact number.

        if (this._comparison.operator === "==" && result.passed) {
            // Because the comparison passed, we know the `after` value did not wrap around -> pass.
            return result;
        }

        if (this._comparison.operator === "!=" && !result.passed) {
            // Because the comparison failed, we know the `after` value did not wrap around -> fail.
            return result;
        }

        // The `after` value might have wrapped around. We have to simulate the comparison as if that had not occurred.
        const uncycle = after + (this._comparison.operand2 > 0 ? this._length : -this._length);
        const difWithinRing = (uncycle - before) % this._length;
        // cyclic with changes min === max mean a change of this._length is the same as no change
        return this._comparison.apply(difWithinRing) || this._comparison.apply(difWithinRing + this._length);
    }
}

class ClampedChange extends Change {
    /**
     * The boundary points where a special comparison is required.
     * @private
     */
    private readonly _ifBounds: number[];

    /**
     * Comparison to perform when the "after" value of the change is at a boundary point.
     * @private
     */
    private readonly _atBounds: Comparison;

    constructor(comparison: Comparison, bounds: ClampedBounds) {
        super(comparison, bounds);

        const {operator, operand2: expectedChange} = comparison;
        const {min, max} = bounds;

        type OpBounds = [ComparisonOp, number[]];

        if (operator === "==" && expectedChange !== 0) {
            // Expects a "strict" change by a specific amount. If a value is at a boundary point afterward, it could be
            // because the expected change was too large/small to fit into the interval. In this case, pass. But it
            // could also be that the expected change was smaller/larger than the actual change, which would be a
            // failure. The comparison below rules out this possibility.
            const [op, ifBounds]: OpBounds = expectedChange > 0
                ? ["<=", [max]]
                : [">=", [min]];

            this._ifBounds = ifBounds;
            this._atBounds = newComparison({operator: op, value: expectedChange});
            return;
        }

        const [op, ifBounds] = ({
            // Expects a "strict" change, but if the value was already at a boundary point before, the best it could
            // possibly do is stay the same. Thus, allow equality as well.
            ">": [">=", [max]],
            "<": ["<=", [min]],
            "!=": ["==", [min, max]],

            // "Non-strict" change already allows equality, hence no explicit special handling required.
            ">=": [">=", [max]],
            "<=": ["<=", [min]],
            "==": ["==", []],
        } as Record<ComparisonOp, OpBounds>)[operator];

        this._ifBounds = ifBounds;
        this._atBounds = newComparison({operator: op, value: 0});
    }

    protected override _apply(after: number, before: number): CheckResult {
        return this._ifBounds.includes(after)
            ? this._atBounds.apply(after - before)
            : super._apply(after, before);
    }
}

class Eq0 extends Change {
    constructor(bounds: Bounds | null) {
        super(newComparison({operator: "==", value: 0}), bounds);
    }

    override apply(after: string | number, before: string | number): CheckResult {
        return result(after == before, {before, after}, false);
    }

    override negate(): Change {
        return new Neq0(this._bounds);
    }
}

class Neq0 extends Change {
    constructor(bounds: Bounds | null) {
        super(newComparison({operator: "!=", value: 0}), bounds);
    }

    override apply(after: string | number, before: string | number): CheckResult {
        return result(after != before, {before, after}, false);
    }

    override negate(): Change {
        return new Eq0(this._bounds);
    }
}

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
