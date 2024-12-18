import {z} from "zod";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";

export const comparisons = ["==", "!=", ">", ">=", "<", "<="] as const;

export type Comparison = typeof comparisons[number];

export const Comparison = z.preprocess(
    (v) => v === "=" ? "==" : v, // Canonicalize "=" to "=="
    z.enum(comparisons)
);

type BinCompFun = (x: unknown, y: unknown) => boolean;

const opToFun: Record<Comparison, BinCompFun> = Object.freeze({
    "==": (x, y) => x == y,
    "!=": (x, y) => x != y,
    ">": (x, y) => x > y,
    "<": (x, y) => x < y,
    ">=": (x, y) => x >= y,
    "<=": (x, y) => x <= y,
});

function apply({comparison, value}: ComparingCheck, other: ComparingCheck): boolean {
    return opToFun[comparison](other.value, value);
}

function negate(comp: Comparison): Comparison {
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
    comparison: Comparison;
    value: string | number;
    negated: boolean;
}

function resolveNegation({comparison, negated, value}: ComparingCheck): ComparingCheck {
    return {
        value,
        negated: false,
        comparison: negated ? negate(comparison) : comparison
    };
}

export function contradicts(check1: ComparingCheck, check2: ComparingCheck): boolean {
    check1 = resolveNegation(check1);
    check2 = resolveNegation(check2);

    if (check1.comparison === "!=" || check2.comparison === "!=") {
        return false;
    }

    if (check1.comparison === "==") {
        return !apply(check2, check1);
    }

    if (check2.comparison === "==") {
        return !apply(check1, check2);
    }

    // < and <, > and >, < and <=, <= and <=, >= and >, > and >=
    if (check1.comparison.startsWith(check2.comparison) || check2.comparison.startsWith(check1.comparison)) {
        return false;
    }

    // < and >, < and >=, <= and >, <= and >=
    return !(apply(check1, check2)) || !(apply(check2, check1));
}
