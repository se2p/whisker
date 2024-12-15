import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {SpriteName} from "../checks/AbstractCheck";

const name = "InputClickSprite" as const;

type ClickSpriteArgs = [SpriteName]

export interface ClickSpriteJSON extends IUserInputJSON {
    name: typeof name;
    args: ClickSpriteArgs;
}

export class ClickSprite extends AbstractUserInput<ClickSpriteJSON> {
    constructor(args: ClickSpriteArgs) {
        super({name, args});
    }

    protected _userInput(t: TestDriver): Promise<void> {
        return Promise.resolve(undefined);
    }
}
