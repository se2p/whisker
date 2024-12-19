import {z} from "zod";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";

export const comparisonOps = ["==", "!=", ">", ">=", "<", "<="] as const;

export type ComparisonOp = typeof comparisonOps[number];

export const ComparisonOp = z.preprocess(
    (v) => v === "=" ? "==" : v, // Canonicalize "=" to "=="
    z.enum(comparisonOps)
);

type BinCompFun = (x: unknown, y: unknown) => boolean;

const opToFun: Record<ComparisonOp, BinCompFun> = Object.freeze({
    "==": (x, y) => x == y,
    "!=": (x, y) => x != y,
    ">": (x, y) => x > y,
    "<": (x, y) => x < y,
    ">=": (x, y) => x >= y,
    "<=": (x, y) => x <= y,
});

function apply({operator, value}: ComparingCheck, other: ComparingCheck): boolean {
    return opToFun[operator](other.value, value);
}

function negate(comp: ComparisonOp): ComparisonOp {
    switch (comp) {
        case "==":
            return "!=";
        case "!=":
            return "==";
        case "<":
            return ">=";
        case ">":
            return "<=";
        case ">=":
            return "<";
        case "<=":
            return ">";
        default:
            throw new NonExhaustiveCaseDistinction(comp);
    }
}

export interface ComparingCheck {
    operator: ComparisonOp;
    value: string | number;
    negated: boolean;
}

function resolveNegation({operator, negated, value}: ComparingCheck): ComparingCheck {
    return {
        value,
        negated: false,
        operator: negated ? negate(operator) : operator
    };
}

export function contradicts(check1: ComparingCheck, check2: ComparingCheck): boolean {
    check1 = resolveNegation(check1);
    check2 = resolveNegation(check2);

    if (check1.operator === "==") {
        return !apply(check2, check1);
    }

    if (check2.operator === "==") {
        return !apply(check1, check2);
    }

    if (check1.operator === "!=" || check2.operator === "!=") {
        return false;
    }

    // < and <, > and >, < and <=, <= and <=, >= and >, > and >=
    if (check1.operator.startsWith(check2.operator) || check2.operator.startsWith(check1.operator)) {
        return false;
    }

    // < and >, < and >=, <= and >, <= and >=
    return !apply(check1, check2) || !apply(check2, check1);
}
