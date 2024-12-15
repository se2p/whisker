import TestDriver from "../../../test/test-driver";
import {SpriteName} from "../checks/AbstractCheck";

export interface IUserInputJSON {
    name: string;
    args: (string | number | boolean | SpriteName)[]
}

export abstract class AbstractUserInput {
    protected constructor() {
    }

    protected abstract _userInput(t: TestDriver): Promise<void>;
}
