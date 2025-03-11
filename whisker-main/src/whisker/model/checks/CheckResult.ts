import Sprite from "../../../vm/sprite";

interface ICheckResult {
    passed: boolean;
    enhance(reason: Record<string, unknown>): CheckResult;
    replace(reason: Record<string, unknown>): CheckResult;
}

interface PassedCheck extends ICheckResult {
    passed: true;
}

interface FailedCheck extends ICheckResult {
    passed: false;
    reason: Record<string, unknown>;
}

class PassedCheckImpl implements PassedCheck {
    get passed(): true {
        return true;
    }

    enhance(_reason: Record<string, unknown>): PassedCheck {
        return this;
    }

    replace(_reason: Record<string, unknown>): PassedCheck {
        return this;
    }
}

class FailedCheckImpl implements FailedCheck {
    constructor(private readonly _reason: Record<string, unknown>) {

    }

    get passed(): false {
        return false;
    }

    get reason(): Record<string, unknown> {
        return this._reason;
    }

    enhance(reason: Record<string, unknown>): FailedCheck {
        return fail({...this._reason, ...reason});
    }

    replace(reason: Record<string, unknown>): FailedCheck {
        return fail(reason);
    }
}

export type CheckResult =
    | PassedCheck
    | FailedCheck
    ;

export function pass(): PassedCheck {
    return new PassedCheckImpl();
}

export function fail(reason: Record<string, unknown>): FailedCheck {
    return new FailedCheckImpl(reason);
}

export function result(b: boolean, reason: Record<string, unknown>, negated = false): CheckResult {
    return (negated !== b) ? pass() : fail(reason);
}

export function any(
    check: (sprite: Sprite) => CheckResult,
    negated: boolean,
    sprites: Sprite[],
): CheckResult {
    function _any() {
        let res: CheckResult = fail({message: "There are no sprites!"});

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

    return fail({});
}
