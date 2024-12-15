import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";

const name = "InputClickStage" as const;

export interface ClickStageJSON extends IUserInputJSON {
    name: typeof name;
    args: [];
}

export class ClickStage extends AbstractUserInput {
    constructor() {
        super();
    }

    protected _userInput(t: TestDriver): Promise<void> {
        return Promise.resolve(undefined);
    }
}
