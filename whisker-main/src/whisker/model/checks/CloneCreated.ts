import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {ArgType} from "../util/schema";
import TestDriver from "../../../test/test-driver";
import {wasCloneCreatedAroundStep} from "../util/ModelUtil";

const name = "CloneCreated";

export type CloneCreatedArgs = [
    /**
     * The name of the sprite.
     */
    spriteName: SpriteName,
];

const CloneCreatedArgs = z.tuple([
    SpriteName,
]);

export interface CloneCreatedJSON extends ICheckJSON {
    name: typeof name;
    args: CloneCreatedArgs;
}

export const CloneCreatedJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: CloneCreatedArgs,
});

export class CloneCreated extends PureCheck<CloneCreatedJSON, CheckFun0> {

    constructor(edgeLabel: string, json: SlimCheckJSON<CloneCreatedJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(CloneCreatedArgs.safeParse(args));
    }

    protected _validate(checkJSON: CloneCreatedJSON): CloneCreatedJSON {
        return CloneCreatedJSON.parse(checkJSON) as CloneCreatedJSON;
    }

    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const sprite = this._checkSpriteExistence(this._args[0]);
        const spriteName = sprite.name;
        return () => wasCloneCreatedAroundStep(spriteName, t.getTotalStepsExecuted());
    }

    protected _contradicts(that: CloneCreated): boolean {
        return false;
    }

}
