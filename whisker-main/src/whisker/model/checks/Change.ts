import {z} from "zod";

export type Change =
    | Eq
    | Neq
    | Plus
    | Minus
    | PlusEq
    | MinusEq
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

    apply(before: number, after: number): boolean {
        return before + this._offset === after;
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

    override apply(before: number | string, after: number | string): boolean {
        return before === after;
    }

    override negate(): Change {
        return new Neq0();
    }
}

class Neq implements IChange {
    constructor(private readonly _offset: number = 0) {
    }

    apply(before: number, after: number): boolean {
        return before + this._offset !== after;
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

    override apply(before: number | string, after: number | string): boolean {
        return before !== after;
    }

    override negate(): Change {
        return new Eq0();
    }
}

class Plus implements IChange {
    apply(before: number, after: number): boolean {
        return before < after;
    }

    negate(): Change {
        return new MinusEq();
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

class Minus implements IChange {
    apply(before: number, after: number): boolean {
        return before > after;
    }

    negate(): Change {
        return new PlusEq();
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

class PlusEq implements IChange {
    apply(before: number, after: number): boolean {
        return before <= after;
    }

    negate(): Change {
        return new Minus();
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

class MinusEq implements IChange {
    apply(before: number, after: number): boolean {
        return before >= after;
    }

    negate(): Change {
        return new Plus();
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
    "+": Plus,
    "-": Minus,
    "+=": PlusEq,
    "-=": MinusEq,
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
