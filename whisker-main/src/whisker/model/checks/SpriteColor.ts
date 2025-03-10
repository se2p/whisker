import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {RGBRangeError} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {pass, fail, any, result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";

const name = "SpriteColor" as const;

export type SpriteColorArgs = [
    /**
     * The name of the sprite.
     */
    spriteName: SpriteName,

    /**
     * RGB red color value.
     */
    red: number,

    /**
     * RGB green color value.
     */
    green: number,

    /**
     * RGB blue color value.
     */
    blue: number,
];

const RGBNumber = z.coerce.number().min(0).max(255);

const SpriteColorArgs = z.tuple([
    SpriteName,
    RGBNumber,
    RGBNumber,
    RGBNumber,
]);

export interface SpriteColorJSON extends ICheckJSON {
    name: typeof name;
    args: SpriteColorArgs;
}

export const SpriteColorJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: SpriteColorArgs,
});

export class SpriteColor extends AbstractCheck<SpriteColorJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<SpriteColorJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: SpriteColorJSON): SpriteColorJSON {
        return SpriteColorJSON.parse(checkJSON) as SpriteColorJSON;
    }

    /**
     * Get a method whether a sprite touches a color.
     *
     * @param t Instance of the test driver for checking if a sprite or its clones are touching a color.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const [pSpriteName, pR, pG, pB] = this._args;
        const negated = this.negated;

        const r = ModelUtil.testNumber(pR);
        const g = ModelUtil.testNumber(pG);
        const b = ModelUtil.testNumber(pB);
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
            throw new RGBRangeError();
        }

        const color = [r, g, b];

        // on movement check sprite color
        cu.registerOnMoveEvent(spriteName, this, graphID, (sprite) => {
            return result(sprite.isTouchingColor(color), "(reason unknown)", negated);
        });

        // only test touching if the sprite did not move as otherwise the model was already notified and test it
        // also test clones of spriteName
        return () => {
            const touchingColorCheck = (s: Sprite) => {
                if (!s.visible) {
                    return fail(`Expected sprite "${s}" to be visible`);
                }

                if (!s.isTouchingColor(color)) {
                    return fail(`Expected sprite "${s}" to touch color ${color}`);
                }

                return pass();
            };

            const sprites = t.getSprites((s: Sprite) => s.name === spriteName, false);
            const reason = `Expected sprite "${spriteName}" not to touch color ${color}`;
            return any(touchingColorCheck, negated, reason, sprites);
        };
    }

    protected _contradicts(_that: SpriteColor): boolean {
        return false; // A sprite can touch multiple different colors at the same time.
    }

    override get dependsOnSayText(): boolean {
        return false;
    }
}
