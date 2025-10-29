import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {any, result} from "./CheckResult";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {checkSpriteExistence} from "../util/ModelUtil";

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
        const [pSpriteName] = this._args;
        const spriteName = checkSpriteExistence(t, pSpriteName).name;
        return () => {
            const sprites = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            const check = (s: Sprite) => result(Object.values(s.effects).every(v => v === 0), {...s.effects});
            return any(check, this.negated, sprites);
        };
    }

    protected override _contradicts(that: ClearedEffect): boolean {
        return false;
    }
}
