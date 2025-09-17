import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {RGBRangeError} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {any, fail, pass, result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, RGBNumber, SpriteName} from "./CheckTypes";
import {checkSpriteExistence, testNumber} from "../util/ModelUtil";

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

    override get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(SpriteColorArgs.safeParse(args));
    }

    /**
     * Get a method whether a sprite touches a color.
     *
     * @param t Instance of the test driver for checking if a sprite or its clones are touching a color.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [pSpriteName, pR, pG, pB] = this._args;
        const negated = this.negated;

        const r = testNumber(pR);
        const g = testNumber(pG);
        const b = testNumber(pB);
        const spriteName = checkSpriteExistence(t, pSpriteName).name;
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
            throw new RGBRangeError();
        }

        const color = [r, g, b];

        // on movement check sprite color
        this._registerOnMoveEvent(spriteName, (sprite) => result(sprite.isTouchingColor(color), {}, negated));

        // only test touching if the sprite did not move as otherwise the model was already notified and test it
        // also test clones of spriteName
        return () => {
            const touchingColorCheck = (s: Sprite) => {
                if (!s.visible) {
                    return fail({message: `Expected sprite "${s}" to be visible`});
                }

                if (!s.isTouchingColor(color)) {
                    return fail({message: `Expected sprite "${s}" to touch color ${color}`});
                }

                return pass();
            };

            const sprites = t.getSprites((s: Sprite) => s.name === spriteName, false);
            return any(touchingColorCheck, negated, sprites);
        };
    }

    protected _validate(checkJSON: SpriteColorJSON): SpriteColorJSON {
        return SpriteColorJSON.parse(checkJSON) as SpriteColorJSON;
    }

    protected _contradicts(_that: SpriteColor): boolean {
        return false; // A sprite can touch multiple different colors at the same time.
    }
}
