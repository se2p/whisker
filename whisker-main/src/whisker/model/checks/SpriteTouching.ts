import {AbstractCheck, Check, ICheckJSON, OptionalName, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {CheckUtility} from "../util/CheckUtility";
import Sprite from "../../../vm/sprite";
import {z} from "zod";

const name = "SpriteTouching" as const;

export type SpriteTouchingArgs = [
    /**
     * The name of the first sprite.
     */
    pSpriteName1: SpriteName,

    /**
     * The name of the second sprite.
     */
    pSpriteName2: SpriteName,
];

const SpriteTouchingArgs = z.tuple([
    SpriteName,
    SpriteName,
]);

export interface SpriteTouchingJSON extends ICheckJSON {
    name: "SpriteTouching";
    args: SpriteTouchingArgs;
}

export const SpriteTouchingJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: SpriteTouchingArgs,
});

export class SpriteTouching extends AbstractCheck<SpriteTouchingJSON> {
    constructor(edgeLabel: string, json: OptionalName<SpriteTouchingJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: SpriteTouchingJSON): SpriteTouchingJSON {
        return SpriteTouchingJSON.parse(checkJSON) as SpriteTouchingJSON;
    }

    /**
     * Get a method checking whether two sprites are touching.
     *
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.

     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): Check {
        const [pSpriteName1, pSpriteName2] = this._args;
        const negated = this._negated;
        const edgeLabel = this._edgeLabel;

        const spriteName1 = ModelUtil.checkSpriteExistence(t, pSpriteName1).name;
        const spriteName2 = ModelUtil.checkSpriteExistence(t, pSpriteName2).name;

        // on movement check sprite touching other sprite, sprite is given by movement event caller and
        // isTouchingSprite is checking all clones with spriteName2
        cu.registerOnMoveEvent(spriteName1, this, edgeLabel, graphID, (sprite) => {
            return !negated == sprite.isTouchingSprite(spriteName2);
        });

        // only test touching if the sprite did not move as otherwise the model was already notified and test it,
        // also test clones of spriteName1
        return () => {
            const sprites = t.getSprites((s: Sprite) => s.name === spriteName1, false);
            const anyTouchingSprite = sprites.some((s: Sprite) => s.visible && s.isTouchingSprite(spriteName2));
            return !negated == anyTouchingSprite;
        };
    }

    protected _contradicts(_that: SpriteTouching): boolean {
        return false; // Any combination of 4 sprites may touch each other at the same time.
    }

    override get dependsOnSayText(): boolean {
        return false;
    }
}
