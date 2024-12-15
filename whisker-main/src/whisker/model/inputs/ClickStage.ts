import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";

const name = "InputClickStage" as const;

type ClickStageArgs = [];

export interface ClickStageJSON extends IUserInputJSON {
    name: typeof name;
    args: ClickStageArgs;
}

export class ClickStage extends AbstractUserInput<ClickStageJSON> {
    constructor(args: ClickStageArgs = []) {
        super({name, args});
    }

    protected _userInput(t: TestDriver): Promise<void> {
        return Promise.resolve(undefined);
    }
}
