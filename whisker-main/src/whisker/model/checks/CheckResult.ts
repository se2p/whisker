import Sprite from "../../../vm/sprite";

export type Reason = Record<string, unknown>;

interface ICheckResult {
    passed: boolean;

    enhance(reason: Reason): CheckResult;

    replace(reason: Reason): CheckResult;
}

interface PassedCheck extends ICheckResult {
    passed: true;
}

interface FailedCheck extends ICheckResult {
    passed: false;
    reason: Reason;
}

class PassedCheckImpl implements PassedCheck {
    get passed(): true {
        return true;
    }

    enhance(_reason: Reason): PassedCheck {
        return this;
    }

    replace(_reason: Reason): PassedCheck {
        return this;
    }
}

class FailedCheckImpl implements FailedCheck {
    constructor(private readonly _reason: Reason) {

    }

    get passed(): false {
        return false;
    }

    get reason(): Reason {
        return this._reason;
    }

    enhance(reason: Reason): FailedCheck {
        return fail({...this._reason, ...reason});
    }

    replace(reason: Reason): FailedCheck {
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

export function fail(reason: Reason): FailedCheck {
    return new FailedCheckImpl(reason);
}

export function result(b: boolean, reason: Reason, negated = false): CheckResult {
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
