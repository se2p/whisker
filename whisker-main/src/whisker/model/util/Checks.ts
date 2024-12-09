import {AbstractCheck} from "../checks/AbstractCheck";

export class Checks {
    private readonly _checks: AbstractCheck[] = [];

    constructor(checks: readonly AbstractCheck[] = []) {
        this.push(...checks);
    }

    public push(...checks: readonly AbstractCheck[]): void {
        this._checks.push(...checks);
    }

    includes(check: AbstractCheck): boolean {
        return this._checks.some((c) => c.equals(check));
    }

    get length(): number {
        return this._checks.length;
    }

    public some(predicate: (check: AbstractCheck) => boolean): boolean {
        return this._checks.some((check) => predicate(check));
    }
}
