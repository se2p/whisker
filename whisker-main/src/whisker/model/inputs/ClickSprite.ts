import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {ClickSpriteEvent} from "../../testcase/events/ClickSpriteEvent";
import {z} from "zod";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "../checks/CheckTypes";
import {checkSpriteExistence} from "../util/ModelUtil";

const name = "InputClickSprite" as const;

type ClickSpriteArgs = [SpriteName]

const ClickSpriteArgs = z.tuple([SpriteName]);

export type ClickSpriteJSON = IUserInputJSON<typeof name, ClickSpriteArgs>;

export const ClickSpriteJSON = z.object({
    name: z.literal(name),
    args: ClickSpriteArgs,
});

export class ClickSprite extends AbstractUserInput<ClickSpriteJSON> {
    constructor(...args: ClickSpriteArgs) {
        super({name, args});
    }

    private get _spriteName(): SpriteName {
        return this._inputJSON.args[0];
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(ClickSpriteArgs.safeParse(args));
    }

    override async inputImmediate(t: TestDriver, graphId: string): Promise<void> {
        const sprite = checkSpriteExistence(t, this._spriteName);
        const clickSpriteEvent = new ClickSpriteEvent(sprite._target);
        return clickSpriteEvent.apply();
    }

    protected override _validate(json: ClickSpriteJSON): ClickSpriteJSON {
        return ClickSpriteJSON.parse(json) as ClickSpriteJSON;
    }
}
