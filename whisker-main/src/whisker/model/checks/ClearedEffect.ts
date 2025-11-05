import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {result} from "./CheckResult";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";

const name = "ClearedEffects" as const;

export type ClearedEffectArgs = [
    /**
     * The name of the sprite.
     */
    spriteName: SpriteName,
];

const ClearedEffectArgs = z.tuple([
    SpriteName,
]);

export interface ClearedEffectJSON extends ICheckJSON {
    name: typeof name;
    args: ClearedEffectArgs;
}

export const ClearedEffectJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: ClearedEffectArgs,
});

export class ClearedEffect extends PureCheck<ClearedEffectJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<ClearedEffectJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(ClearedEffectArgs.safeParse(args));
    }

    protected _validate(checkJSON: ClearedEffectJSON): ClearedEffectJSON {
        return ClearedEffectJSON.parse(checkJSON) as ClearedEffectJSON;
    }

    /**
     * Get a method for checking whether a sprite has no effects activated.
     * @param t Instance of the test driver for retrieving the effect values of a sprite and its clones
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const sprite = this._getStageOrSprite(this._args[0]);
        this._registerOnVisualChange(sprite.name);
        return () => result(Object.values(sprite.effects).every(v => v === 0), {...sprite.effects}, this.negated);
    }

    protected override _contradicts(that: ClearedEffect): boolean {
        return false;
    }
}
