import TestDriver from "../../../test/test-driver";

export interface Condition {
    check(testDriver: TestDriver): boolean;

    register(testDriver: TestDriver): void;

    reset(): void;
}
