import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {ClickStageEvent} from "../../testcase/events/ClickStageEvent";

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

    protected _userInput(_t: TestDriver): Promise<void> {
        const clickStageEvent = new ClickStageEvent();
        return clickStageEvent.apply();
    }
}
