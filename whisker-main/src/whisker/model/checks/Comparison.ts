import {Optional} from "../../utils/Optional";
import {CheckResult, Reason, result} from "./CheckResult";
import {ComparisonOp} from "./CheckTypes";
import {returnNumberIfPossible} from "../util/ModelUtil";

/**
 * Threshold for two numbers to be considered approximately equal. The value is chosen to be large enough to ignore
 * rounding errors introduced by floating point arithmetics, and small enough to not mask actual programming errors in
 * the Scratch program under test.
 */
export const EPSILON = 1e-10;

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

abstract class AbstractComparison<T extends Interval | null> {
    protected readonly _actualOperand2: AttributeType;

    protected constructor(
        private readonly _operand2: AttributeType,
        private readonly _interval: T | null,
    ) {
        this._actualOperand2 = this._interval === null || typeof _operand2 !== "number"
            ? _operand2
            : Math.min(_interval.max, Math.max(_interval.min, _operand2));
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

    protected _extendReasonWithInterval(reason: Reason): Reason {
        return this._interval === null ? reason : {...this._interval, ...reason};
    }
}

function approxEqNum(x: AttributeType, y: AttributeType, epsilon = EPSILON): boolean {
    const actual = returnNumberIfPossible(x, null);

    if (typeof y != "number" || typeof actual != "number") {
        return false; // at least one value is not a number, so the difference does not exist
    }

    return Math.abs(actual - y) <= epsilon;
}

export function approxEq(operand1: AttributeType, operand2: AttributeType, epsilon = EPSILON): boolean {
    if (operand1 == operand2) {
        return true;
    }

    return approxEqNum(operand1, operand2, epsilon);
}

function approxNeq(operand1: AttributeType, operand2: AttributeType, epsilon = EPSILON) {
    return !approxEq(operand1, operand2, epsilon);
}

function approxLeq(x: AttributeType, y: AttributeType, epsilon = EPSILON) {
    if (x <= y) {
        return true;
    }

    return approxEqNum(x, y, epsilon);
}

export function approxGt(x: AttributeType, y: AttributeType, epsilon = EPSILON): boolean {
    return !approxLeq(x, y, epsilon);
}

function approxGeq(x: AttributeType, y: AttributeType, epsilon = EPSILON) {
    if (x >= y) {
        return true;
    }

    return approxEqNum(x, y, epsilon);
}

export function approxLt(x: AttributeType, y: AttributeType, epsilon = EPSILON): boolean {
    return !approxGeq(x, y, epsilon);
}

class Eq<T extends Interval | null> extends AbstractComparison<T> {
    constructor(operand2: AttributeType, interval: T | null = null) {
        super(operand2, interval);
    }

    override get operator(): ComparisonOp {
        return "==";
    }

    override apply(operand1: AttributeType): CheckResult {
        const message = {actual: operand1, expected: this.operand2};
        const res = approxEq(operand1, this._actualOperand2);
        return result(res, this._extendReasonWithInterval(message), false);
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
        const message = {actual: operand1};
        const res = approxNeq(operand1, this._actualOperand2) || this._boundaries.includes(operand1);
        return result(res, this._extendReasonWithInterval(message), false);
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
        const message = {actual: operand1, expected: this.operand2};
        const res = approxLeq(operand1, this._actualOperand2);
        return result(res, this._extendReasonWithInterval(message), false);
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
        const message = {actual: operand1, expected: this.operand2};
        const res = approxLt(operand1, this._actualOperand2) || this._boundaries.includes(operand1);
        return result(res, this._extendReasonWithInterval(message), false);
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
        const message = {actual: operand1, expected: this.operand2};
        const res = approxGt(operand1, this._actualOperand2) || this._boundaries.includes(operand1);
        return result(res, this._extendReasonWithInterval(message), false);
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
        const message = {actual: operand1, expected: this.operand2};
        const res = approxGeq(operand1, this._actualOperand2);
        return result(res, this._extendReasonWithInterval(message), false);
    }

    override negate(): Comparison<T> {
        return new Lt(this.operand2, this.interval);
    }
}

export const CONST_PASS = new class ConstPass extends Neq<null> {
    constructor() {
        super(NaN, null); // Hack: Assuming x is a number, x != NaN is always true as per IEEE 754
    }

    override negate(): Comparison {
        return CONST_FAIL;
    }
};

export const CONST_FAIL = new class ConstFail extends Eq<null> {
    constructor() {
        super(NaN, null); // Hack: Assuming x is a number, x == NaN is always false as per IEEE 754
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
