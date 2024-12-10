import {z} from "zod";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";

const changeOps = ["+", "-", "=", "+=", "-=", "!="] as const;

type ChangeOp = typeof changeOps[number];

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

function isChangeOp(op: Change): op is ChangeOp {
    return changeOps.includes(op as ChangeOp);
}

/**
 * Either a number, or a number-like string, e.g., "3.14", "-5", "+1.234", "0e4", but not the empty string.
 */
const NumberLike = z.union([
    z.number(),
    z.string().refine((s) => s !== "")
])
    .pipe(z.coerce.number())
    .refine((n) => !Number.isNaN(n));

/**
 * For integer variable '+'|'++' for increase, '-'|'--' for decrease. '='|'==' for staying the same.
 * "+=" for increase or staying the same."-=" for decrease or staying the same. For a numerical
 * change by an exact value '+<number>' or '<number>' or '-<number>'.
 */
export type Change =
    | ChangeOp
    | number
    ;

export const Change = ChangeOp.or(NumberLike);

export interface ChangingCheck {
    negated: boolean;
    change: Change;
}

/**
 * Tells whether the two given checks contradict each other. Every check represents a set of allowed number values.
 * Two checks are contradicting if the corresponding sets are disjoint.
 *
 * @param check1 The first check
 * @param check2 The second check
 */
export function contradicts(check1: ChangingCheck, check2: ChangingCheck): boolean {
    const change1 = check1.change;
    const change2 = check2.change;

    if (isChangeOp(change1) && isChangeOp(change2)) {
        const op1 = check1.negated ? negate(change1) : change1;
        const op2 = check2.negated ? negate(change2) : change2;

        switch (op1) {
            case "+":
                return ["=", "-", "-="].includes(op2);
            case "-":
                return ["=", "+", "+="].includes(op2);
            case "=":
                return ["+", "-", "!="].includes(op2);
            case "+=":
                return op2 === "-";
            case "-=":
                return op2 === "+";
            case "!=":
                return op2 === "=";
            default:
                throw new NonExhaustiveCaseDistinction(op1);
        }
    }

    const negated2 = check2.negated;

    if (isChangeOp(change1) && !isChangeOp(change2)) {
        const op2 = numberToChangeOp(change2);

        if (!check2.negated) {
            return contradicts(check1, {...check2, change: op2});
        }

        const op1 = check1.negated ? negate(change1) : change1;
        return op1 === op2;
    }

    if (!isChangeOp(change1) && isChangeOp(change2)) {
        return contradicts(check2, check1); // Handle via the symmetry of contradicts.
    }

    const negated1 = check1.negated;

    if (negated1 && negated2) {
        return false;
    }

    if (!negated1 && !negated2) {
        return change1 !== change2;
    }

    return change1 === change2;
}

function negate(op: ChangeOp): ChangeOp {
    switch (op) {
        case "+":
            return "-=";
        case "-":
            return "+=";
        case "+=":
            return "-";
        case "-=":
            return "+";
        case "=":
            return "!=";
        case "!=":
            return "=";
        default:
            throw new NonExhaustiveCaseDistinction(op);
    }
}

function numberToChangeOp(n: number): ChangeOp {
    if (n > 0) {
        return "+";
    }

    if (n < 0) {
        return "-";
    }

    return "=";
}
