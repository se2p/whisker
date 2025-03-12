import {CheckResult, fail, pass} from "./CheckResult";

export interface Quantifiable<T extends Quantifiable<T>> {
    apply(...args: unknown[]): CheckResult;

    contradicts(that: T): boolean;
}

abstract class AbstractQuantification<T extends Quantifiable<T>> {
    protected constructor(private readonly _wrapped: T) {
    }

    get wrapped(): T {
        return this._wrapped;
    }

    abstract apply(args: unknown[]): CheckResult;

    protected _apply(a: unknown): CheckResult {
        return Array.isArray(a)
            ? this.applySingle(...a)
            : this.applySingle(a);
    }

    applySingle(...args: unknown[]): CheckResult {
        return this._wrapped.apply(...args);
    }

    contradicts(that: AbstractQuantification<T>): boolean {
        return this.wrapped.contradicts(that.wrapped);
    }
}

export type Quantification<T extends Quantifiable<T>> =
    | Existential<T>
    | Universal<T>
    ;

export class Existential<T extends Quantifiable<T>> extends AbstractQuantification<T> {
    constructor(wrapped: T) {
        super(wrapped);
    }

    override apply(args: unknown[]): CheckResult {
        let res: CheckResult = fail({message: "There are no elements to check!"});

        for (const a of args) {
            res = this._apply(a);

            if (res.passed) {
                return res;
            }
        }

        return res;
    }

    override contradicts(that: AbstractQuantification<T>): boolean {
        if (that instanceof Existential) {
            return false;
        }

        return super.contradicts(that);
    }
}

export class Universal<T extends Quantifiable<T>> extends AbstractQuantification<T> {
    constructor(wrapped: T) {
        super(wrapped);
    }

    override apply(args: unknown[]): CheckResult {
        let res: CheckResult = pass();

        for (const a of args) {
            res = this._apply(a);

            if (!res.passed) {
                return res;
            }
        }

        return res;
    }
}
