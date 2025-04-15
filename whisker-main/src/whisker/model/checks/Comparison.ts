import {Existential, Quantifiable, Quantification, Universal} from "./Quantification";
import {Optional} from "../../utils/Optional";
import {CheckResult, result} from "./CheckResult";
import {ComparisonOp} from "./CheckTypes";
import {ModelUtil} from "../util/ModelUtil";

const EPSILON = 1e-5;

export type Comparison<T extends Interval | null = null> =
    | Eq<T>
    | Neq<T>
    | Lt<T>
    | Leq<T>
    | Gt<T>
    | Geq<T>
    ;

export type AttributeType = string | boolean | number;

export interface Interval {
    min: number;
    max: number;
}

abstract class AbstractComparison<T extends Interval | null> implements Quantifiable<Comparison<T>> {
    protected constructor(
        private readonly _operand2: AttributeType,
        private readonly _interval: T | null,
    ) {
    }

    get operand2(): AttributeType {
        return this._operand2;
    }

    get interval(): T | null {
        return this._interval;
    }

    abstract get operator(): ComparisonOp;

    abstract apply(operand1: AttributeType): CheckResult;

    contradicts(that: Comparison<T>): boolean {
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

    abstract negate(): Comparison<T>;

    toString(): string {
        return `x ${this.operator} ${this.operand2}`;
    }
}

class Eq<T extends Interval | null> extends AbstractComparison<T> {
    constructor(operand2: AttributeType, interval: T | null = null) {
        super(operand2, interval);
    }

    override get operator(): ComparisonOp {
        return "==";
    }

    override apply(operand1: AttributeType): CheckResult {
        let res:boolean;
        const actual = ModelUtil.returnNumberIfPossible(operand1, null);
        if(typeof this.operand2 != "number" || actual == null || (Number.isInteger(this.operand2) && Number.isInteger(actual))) {
            res = operand1 == this.operand2;
        }else{
            res = Math.abs(actual-this.operand2) <= EPSILON;
        }
        return result(res, {actual: operand1, expected: this.operand2});
    }

    override negate(): Comparison<T> {
        return new Neq<T>(this.operand2, this.interval);
    }
}

class Neq<T extends Interval | null> extends AbstractComparison<T> {
    private readonly _boundaries: AttributeType[];

    constructor(operand2: AttributeType, interval: T | null = null) {
        super(operand2, interval);
        this._boundaries = Object.values({...interval});
    }

    override get operator(): ComparisonOp {
        return "!=";
    }

    override apply(operand1: AttributeType): CheckResult {
        return result(
            operand1 != this.operand2 || this._boundaries.includes(operand1),
            {actual: operand1}
        );
    }

    override negate(): Comparison<T> {
        return new Eq(this.operand2, this.interval);
    }
}

class Leq<T extends Interval | null> extends AbstractComparison<T> {
    constructor(operand2: AttributeType, interval: T | null = null) {
        super(operand2, interval);
    }

    override get operator(): ComparisonOp {
        return "<=";
    }

    override apply(operand1: AttributeType): CheckResult {
        return result(operand1 <= this.operand2, {actual: operand1, expected: this.operand2});
    }

    override negate(): Comparison<T> {
        return new Gt(this.operand2, this.interval);
    }
}

class Lt<T extends Interval | null> extends AbstractComparison<T> {
    private readonly _boundaries: AttributeType[];

    constructor(operand2: AttributeType, interval: T | null = null) {
        super(operand2, interval);
        this._boundaries = interval === null ? [] : [interval.min];
    }

    override get operator(): ComparisonOp {
        return "<";
    }

    override apply(operand1: AttributeType): CheckResult {
        return result(
            operand1 < this.operand2 || this._boundaries.includes(operand1),
            {actual: operand1, expected: this.operand2}
        );
    }

    override negate(): Comparison<T> {
        return new Geq(this.operand2);
    }
}

class Gt<T extends Interval | null> extends AbstractComparison<T> {
    private readonly _boundaries: AttributeType[];

    constructor(operand2: AttributeType, interval: T | null = null) {
        super(operand2, interval);
        this._boundaries = interval === null ? [] : [interval.max];
    }

    override get operator(): ComparisonOp {
        return ">";
    }

    override apply(operand1: AttributeType): CheckResult {
        return result(
            operand1 > this.operand2 || this._boundaries.includes(operand1),
            {actual: operand1, expected: this.operand2}
        );
    }

    override negate(): Comparison<T> {
        return new Leq(this.operand2, this.interval);
    }
}

class Geq<T extends Interval | null> extends AbstractComparison<T> {
    constructor(operand2: AttributeType, interval: T | null = null) {
        super(operand2, interval);
    }

    override get operator(): ComparisonOp {
        return ">=";
    }

    override apply(operand1: AttributeType): CheckResult {
        return result(operand1 >= this.operand2, {actual: operand1, expected: this.operand2});
    }

    override negate(): Comparison<T> {
        return new Lt(this.operand2, this.interval);
    }
}

export const CONST_PASS = new class ConstPass extends Neq<null> {
    constructor() {
        super(NaN, null);
    }

    override negate(): Comparison {
        return CONST_FAIL;
    }
};

export const CONST_FAIL = new class ConstFail extends Eq<null> {
    constructor() {
        super(NaN, null);
    }

    override apply(operand1: AttributeType): CheckResult {
        return super.apply(operand1).replace({message: "CONST_FAIL"});
    }

    override negate(): Comparison {
        return CONST_PASS;
    }
};

type ComparisonCtor<T extends Interval | null> = new (operand2: AttributeType, interval: Interval) => Comparison<T>;

const Comparison: Record<ComparisonOp, ComparisonCtor<Interval>> = Object.freeze({
    "==": Eq,
    "!=": Neq,
    "<": Lt,
    ">": Gt,
    "<=": Leq,
    ">=": Geq,
});

export function newComparison<T extends Interval | null>(
    {operator, value, negated = false}: Optional<ComparingCheck, 'negated'>,
    interval: T = null,
): Comparison<T> {
    const comparison = new Comparison[operator](value, interval) as Comparison<T>;
    return negated ? comparison.negate() : comparison;
}

export interface ComparingCheck {
    operator: ComparisonOp;
    value: AttributeType;
    negated: boolean;
}

export function newQuantifiedComparison<T extends Interval | null>(
    {operator, value, negated = false}: Optional<ComparingCheck, 'negated'>,
    interval: T | null = null,
): Quantification<Comparison<T>> {
    const comparison = newComparison({operator, value}, interval);

    return negated
        ? new Universal(comparison.negate())
        : new Existential(comparison);
}
