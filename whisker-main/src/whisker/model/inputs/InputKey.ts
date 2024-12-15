import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";

const name = "InputKey" as const;

type InputKeyArgs = [string]; // The key to press.

export interface InputKeyJSON extends IUserInputJSON {
    name: typeof name;
    args: InputKeyArgs;
}

export class InputKey extends AbstractUserInput {
    constructor() {
        super();
    }

    protected _userInput(t: TestDriver): Promise<void> {
        return Promise.resolve(undefined);
    }
}
