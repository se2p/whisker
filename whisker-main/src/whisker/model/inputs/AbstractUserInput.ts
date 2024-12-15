import TestDriver from "../../../test/test-driver";
import {SpriteName} from "../checks/AbstractCheck";
import {UserInputJSON} from "./newUserInput";

export interface IUserInputJSON {
    name: string;
    args: (string | number | boolean | SpriteName)[]
}

export abstract class AbstractUserInput<J extends UserInputJSON> {
    protected readonly _inputJSON: J;

    protected constructor(inputJSON: J) {
        this._inputJSON = this._validate(inputJSON);
    }

    /**
     * Input the saved input effects of this instance to the test driver.
     */
    async inputImmediate(t: TestDriver): Promise<void> {
        return this._userInput(t);
    }

    protected abstract _userInput(t: TestDriver): Promise<void>;

    protected abstract _validate(json: J): J;

    toJSON(): J {
        return JSON.parse(JSON.stringify(this._inputJSON));
    }
}
