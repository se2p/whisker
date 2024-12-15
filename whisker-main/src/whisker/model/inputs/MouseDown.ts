import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {MouseDownEvent} from "../../testcase/events/MouseDownEvent";
import {z} from "zod";

const name = "InputMouseDown" as const;

type MouseDownArgs = [boolean]; // Whether the mouse button is pressed or released.

const BooleanLike = z.union([
    z.boolean(),
    z.union([z.literal("true"), z.literal("false")]).transform((s) => s === "true"),
]);

const MouseDownArgs = z.tuple([BooleanLike]);

export type MouseDownJSON = IUserInputJSON<typeof name, MouseDownArgs>;

export const MouseDownJSON = z.object({
    name: z.literal(name),
    args: MouseDownArgs,
});

export class MouseDown extends AbstractUserInput<MouseDownJSON> {
    constructor(...args: MouseDownArgs) {
        super({name, args});
    }

    private get _down(): boolean {
        return this._inputJSON.args[0];
    }

    protected _validate(json: MouseDownJSON): MouseDownJSON {
        return MouseDownJSON.parse(json) as MouseDownJSON;
    }

    override async inputImmediate(_t: TestDriver): Promise<void> {
        const mouseDownEvent = new MouseDownEvent(this._down);
        return mouseDownEvent.apply();
    }
}
