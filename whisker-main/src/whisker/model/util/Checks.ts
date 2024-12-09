import {Check} from "../checks/newCheck";

export class Checks {
    private readonly _checks: Check[] = [];

    constructor(checks: readonly Check[] = []) {
        this.push(...checks);
    }

    public push(...checks: readonly Check[]): void {
        this._checks.push(...checks);
    }

    includes(check: Check): boolean {
        return this._checks.some((c) => c.equals(check));
    }

    get length(): number {
        return this._checks.length;
    }

    public some(predicate: (check: Check) => boolean): boolean {
        return this._checks.some((check) => predicate(check));
    }
}
