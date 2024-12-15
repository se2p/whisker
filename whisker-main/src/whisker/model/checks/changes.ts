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

/**
 * Either a number, or a number-like string, e.g., "3.14", "-5", "+1.234", "0e4", but not the empty string.
 */
export const NumberLike = z.union([
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

export interface ChangingCheck<T extends Change = Change> {
    negated: boolean;
    change: T;
}

function isNumCheck(check: ChangingCheck): check is ChangingCheck<number> {
    return typeof check.change === "number";
}

/**
 * Tells whether the two given checks contradict each other. Every check represents a set of allowed number values.
 * Two checks are contradicting if the corresponding sets are disjoint.
 *
 * @param check1 The first check
 * @param check2 The second check
 */
export function contradicts(check1: ChangingCheck, check2: ChangingCheck): boolean {
    // If given two number checks, we try to determine if there's a contradiction on the precise "number"-level.
    if (isNumCheck(check1) && isNumCheck(check2)) {
        return contradictsNum(check1, check2);
    }

    // Otherwise, we have at least one operator check. Then, we have to convert the other check to the same level
    // if necessary, and try to determine a contradiction on the coarser "operator"-level.

    if (isNumCheck(check1)) {
        return contradicts(toOpCheck(check1), check2);
    }

    if (isNumCheck(check2)) {
        return contradicts(check1, toOpCheck(check2));
    }

    return contradictsOp(check1 as ChangingCheck<ChangeOp>, check2 as ChangingCheck<ChangeOp>);
}

function contradictsNum(check1: ChangingCheck<number>, check2: ChangingCheck<number>): boolean {
    const {negated: negated1, change: num1} = check1;
    const {negated: negated2, change: num2} = check2;

    if (negated1 && negated2) {
        // Essentially, we have two singleton sets, and create their complements in R (real numbers), before
        // intersecting them. This set is never empty, hence no contradiction possible.
        return false;
    }

    if (negated1 || negated2) {
        // Exactly one of the two is negated. Contradiction only possible if both numbers are the same.
        return num1 === num2;
    }

    // No negation. Contradiction only possible if the numbers are not the same.
    return num1 !== num2;
}

function contradictsOp(check1: ChangingCheck<ChangeOp>, check2: ChangingCheck<ChangeOp>): boolean {
    const op1 = check1.negated ? negate(check1.change) : check1.change;
    const op2 = check2.negated ? negate(check2.change) : check2.change;

    switch (op1) {
        case "+":
            return ["=", "-", "-="].includes(op2); // All the operators that don't allow for an increase.
        case "-":
            return ["=", "+", "+="].includes(op2); // All the operators that don't allow for a decrease.
        case "=":
            return ["+", "-", "!="].includes(op2); // All the operators that don't allow for staying the same.
        case "+=":
            return op2 === "-"; // The only operator allowing neither increase nor staying the same.
        case "-=":
            return op2 === "+"; // The only operation allowing neither decrease nor staying the same.
        case "!=":
            return op2 === "="; // The only operator allowing neither increase nor decrease.
        default:
            throw new NonExhaustiveCaseDistinction(op1);
    }
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

function toOpCheck({change, negated}: ChangingCheck<number>): ChangingCheck<ChangeOp> {
    return {
        negated,
        change: change > 0 ? "+" : change < 0 ? "-" : "=",
    };
}
