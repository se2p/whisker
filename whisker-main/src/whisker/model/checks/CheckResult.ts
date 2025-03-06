import Sprite from "../../../vm/sprite";

interface ICheckResult {
    passed: boolean;
}

export interface PassedCheck extends ICheckResult {
    passed: true;
}

export interface FailedCheck extends ICheckResult {
    passed: false;
    reason: string;
}

export type CheckResult =
    | PassedCheck
    | FailedCheck
    ;

export function pass(): PassedCheck {
    return {
        passed: true,
    };
}

export function fail(reason: string): FailedCheck {
    return {
        passed: false,
        reason: reason,
    };
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
