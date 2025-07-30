import TestDriver from "../../../test/test-driver";
import {UserInputJSON} from "./newUserInput";
import {SpriteName} from "../checks/CheckTypes";

export interface IUserInputJSON<N extends string, A extends (string | number | boolean | SpriteName)[]> {
    name: N;
    args: A
}

export abstract class AbstractUserInput<J extends UserInputJSON> {
    protected readonly _inputJSON: J;

    protected constructor(inputJSON: J) {
        this._inputJSON = this._validate(inputJSON);
    }

    /**
     * Input the saved input effects of this instance to the test driver.
     */
    abstract inputImmediate(t: TestDriver, graphID: string): Promise<void>;

    protected abstract _validate(json: J): J;

    toJSON(): J {
        return JSON.parse(JSON.stringify(this._inputJSON));
    }
}
