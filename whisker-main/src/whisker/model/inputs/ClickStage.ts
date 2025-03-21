import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {ClickStageEvent} from "../../testcase/events/ClickStageEvent";
import {z} from "zod";
import {ArgType} from "../util/schema";
import {InputErrorCodes} from "../checks/newCheck";
import {couldBeSpriteName} from "../checks/AbstractCheck";

const name = "InputClickStage" as const;

type ClickStageArgs = [];

export type ClickStageJSON = IUserInputJSON<typeof name, ClickStageArgs>;

export const ClickStageJSON = z.object({
    name: z.literal(name),
    args: z.tuple([]),
});

export class ClickStage extends AbstractUserInput<ClickStageJSON> {
    constructor(...args: ClickStageArgs) {
        super({name, args});
    }

    protected _validate(json: ClickStageJSON): ClickStageJSON {
        return ClickStageJSON.parse(json) as ClickStageJSON;
    }

    override async inputImmediate(_t: TestDriver): Promise<void> {
        const clickStageEvent = new ClickStageEvent();
        return clickStageEvent.apply();
    }

    public static convertArgs(args: ArgType[]): InputErrorCodes[] {
        return [];
    }
}
