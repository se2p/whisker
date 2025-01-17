import {z} from "zod";
import {Comparison, newComparison} from "./Comparison";
import {Existential, Quantifiable, Quantification, Universal} from "./Quantification";
import {Optional} from "../../utils/Optional";

export class Change implements Quantifiable<Change> {
    protected constructor(private readonly _comparison: Comparison) {
    }

    apply(after: number, before: number): boolean {
        return this._comparison.apply(after - before);
    }

    contradicts(that: Change): boolean {
        return this._comparison.contradicts(that._comparison);
    }

    negate(): Change {
        return new Change(this._comparison.negate());
    }

    static from(numberOrChangeOp: NumberOrChangeOp): Change {
        // Special handling to support string operands as the subtraction trick would not work.
        switch (numberOrChangeOp) {
            case "=":
                return eq0;
            case "!=":
                return neq0;
        }

        if (typeof numberOrChangeOp === "number") {
            return new Change(newComparison({operator: "==", value: numberOrChangeOp}));
        }

        const operator = ({
            "+": ">",
            "-": "<",
            "+=": ">=",
            "-=": "<="
        } as const)[numberOrChangeOp];

        return new Change(newComparison({operator, value: 0}));
    }
}

const eq0 = new class Eq0 extends Change {
    constructor() {
        super(newComparison({operator: "==", value: 0}));
    }

    override apply(after: string | number, before: string | number): boolean {
        return after == before;
    }

    override negate(): Change {
        return neq0;
    }
};

const neq0 = new class Neq0 extends Change {
    constructor() {
        super(newComparison({operator: "!=", value: 0}));
    }

    override apply(after: string | number, before: string | number): boolean {
        return after != before;
    }

    override negate(): Change {
        return eq0;
    }
};

export const changeOps = ["+", "-", "=", "+=", "-=", "!="] as const;

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

export function newChange({change: numberOrChangeOp, negated = false}: Optional<ChangingCheck, "negated">): Change {
    const change = Change.from(numberOrChangeOp);
    return negated ? change.negate() : change;
}

export interface ChangingCheck {
    change: NumberOrChangeOp;
    negated: boolean;
}

export function newQuantifiedChange(
    {change: numOp, negated = false}: Optional<ChangingCheck, 'negated'>
): Quantification<Change> {
    const change = newChange({change: numOp, negated: false});

    return negated
        ? new Universal(change.negate())
        : new Existential(change);
}
