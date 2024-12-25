import {z} from "zod";
import {Optional} from "./AbstractCheck";
import {Pair} from "../../utils/Pair";

export type Change =
    | Eq
    | Neq
    | Gt
    | Lt
    | Geq
    | Leq
    ;

interface IChange {
    apply(before: number, after: number): boolean;

    negate(): Change;

    contradicts(that: Change): boolean;

    operator: ChangeOp;
}

class Eq implements IChange {
    constructor(private readonly _offset: number = 0) {
    }

    apply(after: number, before: number): boolean {
        return after === before + this._offset;
    }

    negate(): Change {
        return new Neq(this._offset);
    }

    contradicts(that: Change): boolean {
        if (that.operator === "=") {
            return this.offset !== that.offset;
        }

        if (that.operator === "!=") {
            return this.offset === that.offset;
        }

        if (this.offset > 0) {
            return ["-", "-="].includes(that.operator);
        }

        if (this.offset < 0) {
            return ["+", "+="].includes(that.operator);
        }

        return ["+", "-"].includes(that.operator);
    }

    get offset(): number {
        return this._offset;
    }

    get operator(): "=" {
        return "=";
    }
}

class Eq0 extends Eq {
    constructor() {
        super(0);
    }

    override apply(after: number | string, before: number | string): boolean {
        return after === before;
    }

    override negate(): Change {
        return new Neq0();
    }
}

class Neq implements IChange {
    constructor(private readonly _offset: number = 0) {
    }

    apply(after: number, before: number): boolean {
        return after !== before + this._offset;
    }

    negate(): Change {
        return new Eq(this._offset);
    }

    contradicts(that: Change): boolean {
        if (that.operator === "=") {
            return this.offset === that.offset;
        }

        return false;
    }

    get operator(): "!=" {
        return "!=";
    }

    get offset(): number {
        return this._offset;
    }
}

class Neq0 extends Neq {
    constructor() {
        super(0);
    }

    override apply(after: number | string, before: number | string): boolean {
        return after !== before;
    }

    override negate(): Change {
        return new Eq0();
    }
}

class Gt implements IChange {
    apply(after: number, before: number): boolean {
        return after > before;
    }

    negate(): Change {
        return new Leq();
    }

    contradicts(that: Change): boolean {
        if (that.operator === "=") {
            return !(that.offset > 0);
        }

        return ["-", "-="].includes(that.operator);
    }

    get operator(): "+" {
        return "+";
    }
}

class Lt implements IChange {
    apply(after: number, before: number): boolean {
        return after < before;
    }

    negate(): Change {
        return new Geq();
    }

    contradicts(that: Change): boolean {
        if (that.operator === "=") {
            return !(that.offset < 0);
        }

        return ["+", "+="].includes(that.operator);
    }

    get operator(): "-" {
        return "-";
    }
}

class Geq implements IChange {
    apply(after: number, before: number): boolean {
        return after >= before;
    }

    negate(): Change {
        return new Lt();
    }

    contradicts(that: Change): boolean {
        if (that.operator === "=") {
            return !(that.offset >= 0);
        }

        return that.operator === "-";
    }

    get operator(): "+=" {
        return "+=";
    }
}

class Leq implements IChange {
    apply(after: number, before: number): boolean {
        return after <= before;
    }

    negate(): Change {
        return new Gt();
    }

    contradicts(that: Change): boolean {
        if (that.operator === "=") {
            return !(that.offset <= 0);
        }

        return that.operator === "+";
    }

    get operator(): "-=" {
        return "-=";
    }
}

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
const NumberLike = z.union([
    z.number(),
    z.string().refine((s) => s !== "")
])
    .pipe(z.coerce.number())
    .refine((n) => !Number.isNaN(n));

export type NumberOrChangeOp =
    | number
    | ChangeOp
    ;

export const NumberOrChangeOp = NumberLike.or(ChangeOp);

const Change: Record<ChangeOp, new () => Change> = Object.freeze({
    "=": Eq0,
    "!=": Neq0,
    "+": Gt,
    "-": Lt,
    "+=": Geq,
    "-=": Leq,
});

export function newChange({change: numOp, negated = false}: ChangingCheck): Change {
    const change = typeof numOp === "number"
        ? new Eq(numOp)
        : new Change[numOp]();
    return negated ? change.negate() : change;
}

export interface ChangingCheck {
    change: NumberOrChangeOp;
    negated: boolean;
}

export type QuantifiedChange =
    | UniversalChange
    | ExistentialChange
    ;

export function newQuantifiedChange(
    {change: numOp, negated = false}: Optional<ChangingCheck, 'negated'>
): QuantifiedChange {
    const change = newChange({change: numOp, negated: false});

    return negated
        ? new UniversalChange(change.negate())
        : new ExistentialChange(change);
}

abstract class AbstractQuantifiedChange {
    protected constructor(private readonly _change: Change) {
    }

    get change(): Change {
        return this._change;
    }

    abstract apply(values: Pair<number>[]): boolean;

    abstract contradicts(that: QuantifiedChange): boolean;
}

class UniversalChange extends AbstractQuantifiedChange {
    constructor(change: Change) {
        super(change);
    }

    override apply(values: Pair<number>[]): boolean {
        return values.every(([after, before]) => this.change.apply(after, before));
    }

    override contradicts(that: QuantifiedChange): boolean {
        return this.change.contradicts(that.change);
    }
}

class ExistentialChange extends AbstractQuantifiedChange {
    constructor(change: Change) {
        super(change);
    }

    override apply(values: Pair<number>[]): boolean {
        return values.some(([after, before]) => this.change.apply(after, before));
    }

    override contradicts(that: QuantifiedChange): boolean {
        if (that instanceof ExistentialChange) {
            return false;
        }

        return this.change.contradicts(that.change);
    }
}
