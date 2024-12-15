import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {SpriteName} from "../checks/AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {ClickSpriteEvent} from "../../testcase/events/ClickSpriteEvent";
import {z} from "zod";

const name = "InputClickSprite" as const;

type ClickSpriteArgs = [SpriteName]

const ClickSpriteArgs = z.tuple([SpriteName]);

export interface ClickSpriteJSON extends IUserInputJSON {
    name: typeof name;
    args: ClickSpriteArgs;
}

export const ClickSpriteJSON = z.object({
    name: z.literal(name),
    args: ClickSpriteArgs,
});

export class ClickSprite extends AbstractUserInput<ClickSpriteJSON> {
    constructor(args: ClickSpriteArgs) {
        super({name, args});
    }

    private get _spriteName(): SpriteName {
        return this._inputJSON.args[0];
    }

    protected _userInput(t: TestDriver): Promise<void> {
        const sprite = ModelUtil.checkSpriteExistence(t, this._spriteName);
        const clickSpriteEvent = new ClickSpriteEvent(sprite._target);
        return clickSpriteEvent.apply();
    }
}
