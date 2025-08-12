import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {TypeTextEvent} from "../../testcase/events/TypeTextEvent";
import {z} from "zod";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "../checks/CheckTypes";

const name = "InputText" as const;

type InputTextArgs = [string]; // The text to input.

const InputTextArgs = z.tuple([z.string()]);

export type InputTextJSON = IUserInputJSON<typeof name, InputTextArgs>;

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

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(InputTextArgs.safeParse(args));
    }

    override async inputImmediate(_t: TestDriver, graphId: string): Promise<void> {
        const textEvent = new TypeTextEvent(this._text);
        return textEvent.apply();
    }

    protected _validate(json: InputTextJSON): InputTextJSON {
        return InputTextJSON.parse(json) as InputTextJSON;
    }
}
