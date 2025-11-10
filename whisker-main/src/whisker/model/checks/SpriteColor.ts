import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, RGBNumber, SpriteName} from "./CheckTypes";
import {convertToRgbNumbers} from "../util/ModelUtil";
import {result} from "./CheckResult";

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

export class SpriteColor extends PureCheck<SpriteColorJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<SpriteColorJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(SpriteColorArgs.safeParse(args));
    }

    protected _validate(checkJSON: SpriteColorJSON): SpriteColorJSON {
        return SpriteColorJSON.parse(checkJSON) as SpriteColorJSON;
    }

    /**
     * Get a method whether a sprite touches a color.
     *
     * @param t Instance of the test driver for checking if a sprite or its clones are touching a color.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [pSpriteName, pR, pG, pB] = this._args;
        const sprite = this._checkSpriteExistence(pSpriteName);
        const spriteName = sprite.name;
        const color = convertToRgbNumbers(pR, pG, pB);

        // on movement check sprite color
        this._registerOnMoveEvent(spriteName);

        // only test touching if the sprite did not move as otherwise the model was already notified and test it
        // also test clones of spriteName
        return () => {
            let res: boolean;
            try {
                res = sprite.isTouchingColor(color);
            } catch (e) {
                // the clone this check operates on is no longer existent, so .isTouchingColor throws an exception
                res = false;
            }
            return result(res, {}, this.negated);
        };
    }

    protected _contradicts(_that: SpriteColor): boolean {
        return false; // A sprite can touch multiple different colors at the same time.
    }
}
