import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {TypeTextEvent} from "../../testcase/events/TypeTextEvent";
import {z} from "zod";

const name = "InputText" as const;

type InputTextArgs = [string]; // The text to input.

const InputTextArgs = z.tuple([z.string()]);

export interface InputTextJSON extends IUserInputJSON {
    name: typeof name;
    args: InputTextArgs;
}

export const InputTextJSON = z.object({
    name: z.literal(name),
    args: InputTextArgs,
});

export class InputText extends AbstractUserInput<InputTextJSON> {
    constructor(...args: InputTextArgs) {
        super({name, args});
    }

    private get _text(): string {
        return this._inputJSON.args[0];
    }

    protected _validate(json: InputTextJSON): InputTextJSON {
        return InputTextJSON.parse(json) as InputTextJSON;
    }

    protected _userInput(_t: TestDriver): Promise<void> {
        const textEvent = new TypeTextEvent(this._text);
        return textEvent.apply();
    }
}
