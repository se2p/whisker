import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {z} from "zod";
import {ArgType} from "../util/schema";
import {InputErrorCodes} from "../checks/newCheck";
import {ModelUtil} from "../util/ModelUtil";

const name = "InputKey" as const;

type InputKeyArgs = [string]; // The key to press.

const Key = z.preprocess(
    (key) => ["left", "right", "up", "down"].includes(key as string) ? `${key} arrow` : key,
    z.string()
);

export type InputKeyJSON = IUserInputJSON<typeof name, InputKeyArgs>;

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

    override async inputImmediate(t: TestDriver): Promise<void> {
        return t.inputImmediate({device: "keyboard", key: this._key, isDown: true, steps: 1});
    }

    public static convertArgs(args: ArgType[]): InputErrorCodes[] {
        return [ModelUtil.isKey(args[0]) ? "" : "InvalidKey"];
    }
}
