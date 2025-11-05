import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {ArgType} from "../util/schema";
import TestDriver from "../../../test/test-driver";
import {result} from "./CheckResult";

const name = "CloneRemoved";

export type CloneRemovedArgs = [
    /**
     * The name of the sprite.
     */
    spriteName: SpriteName,
];

const CloneRemovedArgs = z.tuple([
    SpriteName,
]);

export interface CloneRemovedJSON extends ICheckJSON {
    name: typeof name;
    args: CloneRemovedArgs;
}

export const CloneRemovedJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: CloneRemovedArgs,
});

export class CloneRemoved extends PureCheck<CloneRemovedJSON, CheckFun0> {

    constructor(edgeLabel: string, json: SlimCheckJSON<CloneRemovedJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(CloneRemovedArgs.safeParse(args));
    }

    protected _validate(checkJSON: CloneRemovedJSON): CloneRemovedJSON {
        return CloneRemovedJSON.parse(checkJSON) as CloneRemovedJSON;
    }

    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const sprite = this._checkSpriteExistence(this._args[0]);
        return () => result(t.getSprites(s => s.id === sprite.id).length === 0, {message: "this clone was not deleted"}, this.negated);
    }

    protected _contradicts(that: CloneRemoved): boolean {
        return false;
    }

}
