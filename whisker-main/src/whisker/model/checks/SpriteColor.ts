import {AbstractCheck, Check, ICheckJSON, OptionalName, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {RGBRangeError} from "../util/ModelError";
import Sprite from "../../../vm/sprite";
import {z} from "zod";

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

export class SpriteColor extends AbstractCheck<SpriteColorJSON> {
    constructor(edgeLabel: string, json: OptionalName<SpriteColorJSON>) {
        super(edgeLabel, {...json, name}, SpriteColorJSON.parse.bind(SpriteColorJSON));
    }

    /**
     * Get a method whether a sprite touches a color.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): Check {
        const [pSpriteName, pR, pG, pB] = this.args;
        const negated = this.negated;
        const edgeLabel = this._edgeLabel;

        const r = ModelUtil.testNumber(pR);
        const g = ModelUtil.testNumber(pG);
        const b = ModelUtil.testNumber(pB);
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
            throw new RGBRangeError();
        }
        const eventString = this.getEventString();
        // on movement check sprite color
        cu.registerOnMoveEvent(spriteName, eventString, edgeLabel, graphID, (sprite) => {
            return !negated == sprite.isTouchingColor([r, g, b]);
        });

        // only test touching if the sprite did not move as otherwise the model was already notified and test it
        // also test clones of spriteName
        return () => {
            const sprites = t.getSprites((s: Sprite) => s.name === spriteName, false);
            const anyTouchingColor = sprites.some((s: Sprite) => s.visible && s.isTouchingColor([r, g, b]));
            return !negated == anyTouchingColor;
        };
    }
}
