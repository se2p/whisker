import {z} from "zod";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";

export const comparisons = ["==", "!=", ">", ">=", "<", "<="] as const;

export type Comparison = typeof comparisons[number];

export const Comparison = z.preprocess(
    (v) => v === "=" ? "==" : v, // Canonicalize "=" to "=="
    z.enum(comparisons)
);

export interface ComparingCheck {
    comparison: Comparison;
    value: string | number;
    negated: boolean;
}

export function contradicts<T extends ComparingCheck>(check1: T, check2: T): boolean {
    const comp1 = getComparison(check1);
    const comp2 = getComparison(check2);
    return _contradicts(comp1, comp2, check1.value, check2.value);
}

function getComparison<T extends ComparingCheck>(check: T): Comparison {
    const comparison = check.comparison;
    return check.negated ? negate(comparison) : comparison;
}

function _contradicts(comparison1: Comparison, comparison2: Comparison, pValue1: string | number, pValue2: string | number): boolean {
    const value1 = String(pValue1);
    const value2 = String(pValue2);

    if (comparison1 == "!=" || comparison2 == "!=") {
        return false;
    }

    // =
    if ((comparison1 == '==') && (comparison2 == '==')) {
        return value1 != value2;
    }

    if (comparison1 == '==') {
        return !eval(value1 + comparison2 + value2);
    }

    if (comparison2 == '==') {
        return !eval(value2 + comparison1 + value1);
    }

    // < and <, > and >, < and <=, <= and <=, >= and >, > and >=
    if (comparison1.startsWith(comparison2) || comparison2.startsWith(comparison1)) {
        return false;
    }

    return !eval(value2 + comparison1 + value1) || !eval(value1 + comparison2 + value2);
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
