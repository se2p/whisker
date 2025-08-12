import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {ClickStageEvent} from "../../testcase/events/ClickStageEvent";
import {z} from "zod";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "../checks/CheckTypes";

const name = "InputClickStage" as const;

type ClickStageArgs = [];

export const ClickStageArgs = z.tuple([]);

export type ClickStageJSON = IUserInputJSON<typeof name, ClickStageArgs>;

export const ClickStageJSON = z.object({
    name: z.literal(name),
    args: ClickStageArgs,
});

export class ClickStage extends AbstractUserInput<ClickStageJSON> {
    constructor(...args: ClickStageArgs) {
        super({name, args});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(ClickStageArgs.safeParse(args));
    }

    override async inputImmediate(_t: TestDriver, graphId: string): Promise<void> {
        const clickStageEvent = new ClickStageEvent();
        return clickStageEvent.apply();
    }

    protected _validate(json: ClickStageJSON): ClickStageJSON {
        return ClickStageJSON.parse(json) as ClickStageJSON;
    }
}
