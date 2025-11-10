import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, RGBNumber, SpriteName} from "./CheckTypes";
import {convertToRgbNumbers} from "../util/ModelUtil";
import {result} from "./CheckResult";

const name = "SpriteColorTouchColor" as const;

export type SpriteColorTouchColorArgs = [
    spriteName: SpriteName,
    red_1: number,
    green_1: number,
    blue_1: number,
    red_2: number,
    green_2: number,
    blue_2: number,
];

const SpriteColorTouchColorArgs = z.tuple([
    SpriteName,
    RGBNumber,
    RGBNumber,
    RGBNumber,
    RGBNumber,
    RGBNumber,
    RGBNumber,
]);

export interface SpriteColorTouchColorJSON extends ICheckJSON {
    name: typeof name;
    args: SpriteColorTouchColorArgs;
}

export const SpriteColorTouchColorJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: SpriteColorTouchColorArgs,
});

export class SpriteColorTouchColor extends PureCheck<SpriteColorTouchColorJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<SpriteColorTouchColorJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(SpriteColorTouchColorArgs.safeParse(args));
    }

    protected _validate(checkJSON: SpriteColorTouchColorJSON): SpriteColorTouchColorJSON {
        return SpriteColorTouchColorJSON.parse(checkJSON) as SpriteColorTouchColorJSON;
    }

    /**
     * Get a method whether a sprite touches a color.
     *
     * @param t Instance of the test driver for checking if a sprite or its clones are touching a color.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [pSpriteName, pR_1, pG_1, pB_1, pR_2, pG_2, pB_2] = this._args;

        const color1 = convertToRgbNumbers(pR_1, pG_1, pB_1);
        const color2 = convertToRgbNumbers(pR_2, pG_2, pB_2);
        const sprite = this._checkSpriteExistence(pSpriteName);
        const spriteName = sprite.name;
        // on movement check sprite color
        this._registerOnMoveEvent(spriteName);
        this._registerOnVisualChange(spriteName);

        return () => {
            let res: boolean;
            try {
                res = sprite.isColorTouchingColor(color1, color2) || sprite.isColorTouchingColor(color2, color1);
            } catch (e) {
                // the clone this check operates on is no longer existent, so .isColorTouchingColor throws an exception
                res = false;
            }
            return result(res, {}, this.negated);
        };
    }

    protected _contradicts(_that: SpriteColorTouchColor): boolean {
        return false; // A sprite can touch multiple different colors at the same time.
    }
}
