import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

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

export class ClearedEffect extends AbstractCheck<ClearedEffectJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<ClearedEffectJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: ClearedEffectJSON): ClearedEffectJSON {
        return ClearedEffectJSON.parse(checkJSON) as ClearedEffectJSON;
    }

    /**
     * Get a method for checking whether a sprite has no effects activated.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): CheckFun0 {
        const [pSpriteName] = this._args;
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        return () => {
            const sprites = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            const anyHasNoEffect = sprites.some((s: Sprite) => Object.values(s.effects).every(v => v === 0));
            return !this.negated == anyHasNoEffect;
        };
    }

    protected override _contradicts(that: ClearedEffect): boolean {
        return false;
    }

    override get dependsOnSayText(): boolean {
        return false;
    }
}
