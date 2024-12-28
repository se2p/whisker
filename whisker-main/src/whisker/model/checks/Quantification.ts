export interface Quantifiable<T extends Quantifiable<T>> {
    apply(...args: unknown[]): boolean;

    contradicts(that: T): boolean;
}

abstract class AbstractQuantification<T extends Quantifiable<T>> {
    protected constructor(private readonly _wrapped: T) {
    }

    get wrapped(): T {
        return this._wrapped;
    }

    abstract apply(args: unknown[]): boolean;

    protected _apply(a: unknown): boolean {
        return Array.isArray(a)
            ? this.applySingle(...a)
            : this.applySingle(a);
    }

    applySingle(...args: unknown[]): boolean {
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

    override apply(args: unknown[]): boolean {
        return args.some((a) => this._apply(a));
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

    override apply(args: unknown[]): boolean {
        return args.every((a) => this._apply(a));
    }
}
