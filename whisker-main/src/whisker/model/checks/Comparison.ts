import {z} from "zod";
import {Optional} from "./AbstractCheck";
import {Existential, Quantifiable, Quantification, Universal} from "./Quantification";

export type Comparison =
    | Eq
    | Neq
    | Lt
    | Leq
    | Gt
    | Geq
    ;

abstract class AbstractComparison implements Quantifiable<Comparison> {
    protected constructor(private readonly _operand2: string | number) {
    }

    get operand2(): string | number {
        return this._operand2;
    }

    abstract get operator(): ComparisonOp;

    abstract apply(operand1: string | number): boolean;

    contradicts(that: Comparison): boolean {
        if (this.operator === "==") {
            return !that.apply(this.operand2);
        }

        if (that.operator === "==") {
            return !this.apply(that.operand2);
        }

        if (this.operator === "!=" || that.operator === "!=") {
            return false;
        }

        // < and <, > and >, < and <=, <= and <=, >= and >, > and >=
        if (this.operator.startsWith(that.operator) || that.operator.startsWith(this.operator)) {
            return false;
        }

        // < and >, < and >=, <= and >, <= and >=
        return !this.apply(that.operand2) || !that.apply(this.operand2);
    }

    abstract negate(): Comparison;

    toString(): string {
        return `x ${this.operator} ${this.operand2}`;
    }
}

class Eq extends AbstractComparison {
    constructor(operand2: string | number) {
        super(operand2);
    }

    override get operator(): ComparisonOp {
        return "==";
    }

    override apply(operand1: string | number | boolean): boolean {
        if (typeof operand1 === "boolean") { // FIXME: Workaround for issue #375
            operand1 = String(operand1);
        }

        return operand1 == this.operand2;
    }

    override negate(): Comparison {
        return new Neq(this.operand2);
    }
}

class Neq extends AbstractComparison {
    constructor(operand2: string | number) {
        super(operand2);
    }

    override get operator(): ComparisonOp {
        return "!=";
    }

    override apply(operand1: string | number | boolean): boolean {
        if (typeof operand1 === "boolean") { // FIXME: Workaround for issue #375
            operand1 = String(operand1);
        }

        return operand1 != this.operand2;
    }

    override negate(): Comparison {
        return new Eq(this.operand2);
    }
}

class Leq extends AbstractComparison {
    constructor(operand2: string | number) {
        super(operand2);
    }

    override get operator(): ComparisonOp {
        return "<=";
    }

    override apply(operand1: string | number): boolean {
        return operand1 <= this.operand2;
    }

    override negate(): Comparison {
        return new Gt(this.operand2);
    }
}

class Lt extends AbstractComparison {
    constructor(operand2: string | number) {
        super(operand2);
    }

    override get operator(): ComparisonOp {
        return "<";
    }

    override apply(operand1: string | number): boolean {
        return operand1 < this.operand2;
    }

    override negate(): Comparison {
        return new Geq(this.operand2);
    }
}

class Gt extends AbstractComparison {
    constructor(operand2: string | number) {
        super(operand2);
    }

    override get operator(): ComparisonOp {
        return ">";
    }

    override apply(operand1: string | number): boolean {
        return operand1 > this.operand2;
    }

    override negate(): Comparison {
        return new Leq(this.operand2);
    }
}

class Geq extends AbstractComparison {
    constructor(operand2: string | number) {
        super(operand2);
    }

    override get operator(): ComparisonOp {
        return ">=";
    }

    override apply(operand1: string | number): boolean {
        return operand1 >= this.operand2;
    }

    override negate(): Comparison {
        return new Lt(this.operand2);
    }
}

type ComparisonCtor = new (operand2: string | number) => Comparison;

const Comparison: Record<ComparisonOp, ComparisonCtor> = Object.freeze({
    "==": Eq,
    "!=": Neq,
    "<": Lt,
    ">": Gt,
    "<=": Leq,
    ">=": Geq,
});

export function newComparison({operator, value, negated = false}: Optional<ComparingCheck, 'negated'>): Comparison {
    const comparison = new Comparison[operator](value);
    return negated ? comparison.negate() : comparison;
}

export const comparisonOps = Object.freeze(["==", "!=", ">", ">=", "<", "<="] as const);

export type ComparisonOp = typeof comparisonOps[number];

export const ComparisonOp = z.preprocess(
    (v) => v === "=" ? "==" : v, // Canonicalize "=" to "=="
    z.enum(comparisonOps)
);

export interface ComparingCheck {
    operator: ComparisonOp;
    value: string | number;
    negated: boolean;
}

export function newQuantifiedComparison(
    {operator, value, negated = false}: Optional<ComparingCheck, 'negated'>
): Quantification<Comparison> {
    const comparison = newComparison({operator, value});

    return negated
        ? new Universal(comparison.negate())
        : new Existential(comparison);
}
