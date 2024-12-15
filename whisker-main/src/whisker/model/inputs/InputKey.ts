import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";

const name = "InputKey" as const;

type InputKeyArgs = [string]; // The key to press.

export interface InputKeyJSON extends IUserInputJSON {
    name: typeof name;
    args: InputKeyArgs;
}

export class InputKey extends AbstractUserInput<InputKeyJSON> {
    constructor(args: InputKeyArgs) {
        super({name, args});
    }

    private get _key(): string {
        return this._inputJSON.args[0];
    }

    protected _userInput(t: TestDriver): Promise<void> {
        return t.inputImmediate({device: "keyboard", key: this._key, isDown: true, steps: 1});
    }
}
