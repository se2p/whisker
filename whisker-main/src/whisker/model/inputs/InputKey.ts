import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {z} from "zod";
import {ArgType} from "../util/schema";
import {KeyArgument, parseNonUnionError, ParsingResult} from "../checks/CheckTypes";

const name = "InputKey" as const;

type InputKeyArgs = [string]; // The key to press.

export type InputKeyJSON = IUserInputJSON<typeof name, InputKeyArgs>;

export const InputKeyArgs = z.tuple([KeyArgument]);

export const InputKeyJSON = z.object({
    name: z.literal(name),
    args: InputKeyArgs,
});

export class InputKey extends AbstractUserInput<InputKeyJSON> {
    constructor(...args: InputKeyArgs) {
        super({name, args});
    }

    private get _key(): string {
        return this._inputJSON.args[0];
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(InputKeyArgs.safeParse(args));
    }

    override async inputImmediate(t: TestDriver, graphId: string): Promise<void> {
        return t.inputImmediate({device: "keyboard", key: this._key, isDown: true, steps: 1});
    }

    protected _validate(json: InputKeyJSON): InputKeyJSON {
        return InputKeyJSON.parse(json) as InputKeyJSON;
    }
}
