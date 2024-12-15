import TestDriver from "../../../test/test-driver";

export abstract class AbstractUserInput {
    protected constructor() {
    }

    protected abstract _userInput(t: TestDriver): Promise<void>;
}
