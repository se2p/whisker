import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";

const name = "InputText" as const;

type InputTextArgs = [string]; // The text to input.

export interface InputTextJSON extends IUserInputJSON {
    name: typeof name;
    args: InputTextArgs;
}

export class InputText extends AbstractUserInput<InputTextJSON> {
    constructor(args: InputTextArgs) {
        super({name, args});
    }

    protected _userInput(t: TestDriver): Promise<void> {
        return Promise.resolve(undefined);
    }
}
