import Sprite from "../../../vm/sprite";

interface ICheckResult {
    passed: boolean;

    enhance(context: string): CheckResult;

    replace(reason: string): CheckResult;
}

interface PassedCheck extends ICheckResult {
    passed: true;
}

interface FailedCheck extends ICheckResult {
    passed: false;
    reason: string;
}

class PassedCheckImpl implements PassedCheck {
    get passed(): true {
        return true;
    }

    enhance(_ctx: string): CheckResult {
        return this;
    }

    replace(_reason: string): CheckResult {
        return this;
    }
}

class FailedCheckImpl implements FailedCheck {
    constructor(private readonly _reason: string) {

    }

    get passed(): false {
        return false;
    }

    get reason(): string {
        return this._reason;
    }

    enhance(ctx: string): CheckResult {
        return new FailedCheckImpl(`${ctx}: ${this._reason}`);
    }

    replace(reason: string): CheckResult {
        return new FailedCheckImpl(reason);
    }
}

export type CheckResult =
    | PassedCheck
    | FailedCheck
    ;

export function pass(): PassedCheck {
    return new PassedCheckImpl();
}

export function fail(reason: string): FailedCheck {
    return new FailedCheckImpl(reason);
}

export function result(b: boolean, reason: string, negated = false): CheckResult {
    return (negated !== b) ? pass() : fail(reason);
}

export function any(
    check: (sprite: Sprite) => CheckResult,
    negated: boolean,
    reason: string,
    sprites: Sprite[],
): CheckResult {
    function _any() {
        let res: CheckResult = fail("There are no sprites!");

        for (const s of sprites) {
            res = check(s);

            if (res.passed) {
                return res;
            }
        }

        return res;
    }

    const res = _any();

    if (!negated) {
        return res;
    }

    if (!res.passed) {
        return pass();
    }

    return fail(reason);
}
