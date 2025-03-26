import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {couldBeSpriteName} from "../checks/AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {ClickSpriteEvent} from "../../testcase/events/ClickSpriteEvent";
import {z} from "zod";
import {ArgType} from "../util/schema";
import {InputErrorCodes} from "../checks/newCheck";
import {SpriteName} from "../checks/CheckTypes";

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

    protected override _validate(json: ClickSpriteJSON): ClickSpriteJSON {
        return ClickSpriteJSON.parse(json) as ClickSpriteJSON;
    }

    override async inputImmediate(t: TestDriver): Promise<void> {
        const sprite = ModelUtil.checkSpriteExistence(t, this._spriteName);
        const clickSpriteEvent = new ClickSpriteEvent(sprite._target);
        return clickSpriteEvent.apply();
    }

    public static convertArgs(args: ArgType[]): InputErrorCodes[] {
        return [
            couldBeSpriteName(args[0])
        ];
    }
}
