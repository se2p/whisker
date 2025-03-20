import {z} from "zod";
import {Existential, Quantifiable, Quantification, Universal} from "./Quantification";
import {Optional} from "../../utils/Optional";
import {CheckResult, result} from "./CheckResult";
import {ArgType} from "../util/schema";

export type Comparison =
    | Eq
    | Neq
    | Lt
    | Leq
    | Gt
    | Geq
    ;

export type AttributeType = string | boolean | number | { x: number, y: number } | number[];

export interface Bounds {
    min: number;
    max: number;
}

abstract class AbstractComparison implements Quantifiable<Comparison> {
    protected constructor(
        private readonly _operand2: AttributeType,
        private readonly _bounds: Bounds | null,
    ) {
    }

    get operand2(): AttributeType {
        return this._operand2;
    }

    get bounds(): Bounds | null {
        return this._bounds;
    }

    abstract get operator(): ComparisonOp;

    abstract apply(operand1: AttributeType): CheckResult;

    contradicts(that: Comparison): boolean {
        if (this.operator === "==") {
            return !that.apply(this.operand2).passed;
        }

        if (that.operator === "==") {
            return !this.apply(that.operand2).passed;
        }

        if (this.operator === "!=" || that.operator === "!=") {
            return false;
        }

        // < and <, > and >, < and <=, <= and <=, >= and >, > and >=
        if (this.operator.startsWith(that.operator) || that.operator.startsWith(this.operator)) {
            return false;
        }

        // < and >, < and >=, <= and >, <= and >=
        return !this.apply(that.operand2).passed || !that.apply(this.operand2).passed;
    }

    abstract negate(): Comparison;

    toString(): string {
        return `x ${this.operator} ${this.operand2}`;
    }
}

class Eq extends AbstractComparison {
    constructor(operand2: AttributeType, bounds: Bounds | null = null) {
        super(operand2, bounds);
    }

    override get operator(): ComparisonOp {
        return "==";
    }

    override apply(operand1: AttributeType): CheckResult {
        return result(operand1 == this.operand2, {actual: operand1, expected: this.operand2});
    }

    override negate(): Comparison {
        return new Neq(this.operand2, this.bounds);
    }
}

class Neq extends AbstractComparison {
    private readonly _boundsToCheck: AttributeType[];

    constructor(operand2: AttributeType, bounds: Bounds | null = null) {
        super(operand2, bounds);
        this._boundsToCheck = Object.values({...bounds});
    }

    override get operator(): ComparisonOp {
        return "!=";
    }

    override apply(operand1: AttributeType): CheckResult {
        return result(
            operand1 != this.operand2 || this._boundsToCheck.includes(operand1),
            {actual: operand1}
        );
    }

    override negate(): Comparison {
        return new Eq(this.operand2, this.bounds);
    }
}

class Leq extends AbstractComparison {
    constructor(operand2: AttributeType, bounds: Bounds | null = null) {
        super(operand2, bounds);
    }

    override get operator(): ComparisonOp {
        return "<=";
    }

    override apply(operand1: AttributeType): CheckResult {
        return result(operand1 <= this.operand2, {actual: operand1, expected: this.operand2});
    }

    override negate(): Comparison {
        return new Gt(this.operand2, this.bounds);
    }
}

class Lt extends AbstractComparison {
    private readonly _boundsToCheck: AttributeType[];

    constructor(operand2: AttributeType, bounds: Bounds | null = null) {
        super(operand2, bounds);
        this._boundsToCheck = bounds === null ? [] : [bounds.min];
    }

    override get operator(): ComparisonOp {
        return "<";
    }

    override apply(operand1: AttributeType): CheckResult {
        return result(
            operand1 < this.operand2 || this._boundsToCheck.includes(operand1),
            {actual: operand1, expected: this.operand2}
        );
    }

    override negate(): Comparison {
        return new Geq(this.operand2);
    }
}

class Gt extends AbstractComparison {
    private readonly _boundsToCheck: AttributeType[];

    constructor(operand2: AttributeType, bounds: Bounds | null = null) {
        super(operand2, bounds);
        this._boundsToCheck = bounds === null ? [] : [bounds.max];
    }

    override get operator(): ComparisonOp {
        return ">";
    }

    override apply(operand1: AttributeType): CheckResult {
        return result(
            operand1 > this.operand2 || this._boundsToCheck.includes(operand1),
            {actual: operand1, expected: this.operand2}
        );
    }

    override negate(): Comparison {
        return new Leq(this.operand2, this.bounds);
    }
}

class Geq extends AbstractComparison {
    constructor(operand2: AttributeType, bounds: Bounds | null = null) {
        super(operand2, bounds);
    }

    override get operator(): ComparisonOp {
        return ">=";
    }

    override apply(operand1: AttributeType): CheckResult {
        return result(operand1 >= this.operand2, {actual: operand1, expected: this.operand2});
    }

    override negate(): Comparison {
        return new Lt(this.operand2, this.bounds);
    }
}

type ComparisonCtor = new (operand2: AttributeType, bounds: Bounds) => Comparison;

const Comparison: Record<ComparisonOp, ComparisonCtor> = Object.freeze({
    "==": Eq,
    "!=": Neq,
    "<": Lt,
    ">": Gt,
    "<=": Leq,
    ">=": Geq,
});

export function newComparison(
    {operator, value, negated = false}: Optional<ComparingCheck, 'negated'>,
    bounds: Bounds | null = null,
): Comparison {
    const comparison = new Comparison[operator](value, bounds);
    return negated ? comparison.negate() : comparison;
}

export function isValidComparisonOp(op: ArgType): boolean {
    return (comparisonOps as readonly ArgType[]).includes(op);
}

export const comparisonOps = Object.freeze(["==", "!=", ">", ">=", "<", "<="] as const);

export type ComparisonOp = typeof comparisonOps[number];

export const ComparisonOp = z.preprocess(
    (v) => v === "=" ? "==" : v, // Canonicalize "=" to "=="
    z.enum(comparisonOps)
);

export interface ComparingCheck {
    operator: ComparisonOp;
    value: AttributeType;
    negated: boolean;
}

export function newQuantifiedComparison(
    {operator, value, negated = false}: Optional<ComparingCheck, 'negated'>,
    bounds: Bounds | null = null,
): Quantification<Comparison> {
    const comparison = newComparison({operator, value}, bounds);

    return negated
        ? new Universal(comparison.negate())
        : new Existential(comparison);
}
