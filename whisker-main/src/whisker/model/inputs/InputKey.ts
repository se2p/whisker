import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {z} from "zod";

const name = "InputKey" as const;

type InputKeyArgs = [string]; // The key to press.

const Key = z.preprocess((key) => {
    if (key === "left") {
        return "left arrow";
    }

    if (key === "right") {
        return "right arrow";
    }

    if (key === "up") {
        return "up arrow";
    }

    if (key === "down") {
        return "down arrow";
    }

    return key;
}, z.string());

export interface InputKeyJSON extends IUserInputJSON {
    name: typeof name;
    args: InputKeyArgs;
}

export const InputKeyArgs = z.tuple([Key]);

export const InputKeyJSON = z.object({
    name: z.literal(name),
    args: InputKeyArgs,
});

export class InputKey extends AbstractUserInput<InputKeyJSON> {
    constructor(...args: InputKeyArgs) {
        super({name, args});
    }

    protected _validate(json: InputKeyJSON): InputKeyJSON {
        return InputKeyJSON.parse(json) as InputKeyJSON;
    }

    private get _key(): string {
        return this._inputJSON.args[0];
    }

    protected _userInput(t: TestDriver): Promise<void> {
        return t.inputImmediate({device: "keyboard", key: this._key, isDown: true, steps: 1});
    }
}
