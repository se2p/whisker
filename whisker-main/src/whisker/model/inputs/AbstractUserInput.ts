import TestDriver from "../../../test/test-driver";
import {SpriteName} from "../checks/AbstractCheck";
import {InputJSON} from "./newInput";

export interface IUserInputJSON {
    name: string;
    args: (string | number | boolean | SpriteName)[]
}

export abstract class AbstractUserInput<J extends InputJSON> {
    protected readonly _inputJSON: J;

    protected constructor(inputJSON: J) {
        this._inputJSON = inputJSON;
    }

    protected abstract _userInput(t: TestDriver): Promise<void>;
}
