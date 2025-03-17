import {AbstractCheck, CheckFun0, couldBeSpriteName, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {CheckUtility} from "../util/CheckUtility";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {any, fail, pass, result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {InputErrorCodes} from "./newCheck";

const name = "SpriteTouching" as const;

export type SpriteTouchingArgs = [
    /**
     * The name of the first sprite.
     */
    spriteName1: SpriteName,

    /**
     * The name of the second sprite.
     */
    spriteName2: SpriteName,
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

export class SpriteTouching extends AbstractCheck<SpriteTouchingJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<SpriteTouchingJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: SpriteTouchingJSON): SpriteTouchingJSON {
        return SpriteTouchingJSON.parse(checkJSON) as SpriteTouchingJSON;
    }

    /**
     * Get a method checking whether two sprites are touching.
     *
     * @param t Instance of the test driver to check if two sprites are touching.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const [pSpriteName1, pSpriteName2] = this._args;
        const negated = this.negated;

        const spriteName1 = ModelUtil.checkSpriteExistence(t, pSpriteName1).name;
        const spriteName2 = ModelUtil.checkSpriteExistence(t, pSpriteName2).name;

        // on movement check sprite touching other sprite, sprite is given by movement event caller and
        // isTouchingSprite is checking all clones with spriteName2
        cu.registerOnMoveEvent(spriteName1, this, graphID, (sprite) =>
            result(sprite.isTouchingSprite(spriteName2), {}, negated));

        // only test touching if the sprite did not move as otherwise the model was already notified and test it,
        // also test clones of spriteName1
        return () => {
            const touchingCheck = (s: Sprite) => {
                if (!s.visible) {
                    return fail({
                        message: `Expected sprite "${s}" to be visible`
                    });
                }

                if (!s.isTouchingSprite(spriteName2)) {
                    return fail({message: `Expected sprite "${s}" to touch sprite "${spriteName2}"`});
                }

                return pass();
            };

            const sprites = t.getSprites((s: Sprite) => s.name === spriteName1, false);
            return any(touchingCheck, negated, sprites);
        };
    }

    protected _contradicts(_that: SpriteTouching): boolean {
        return false; // Any combination of 4 sprites may touch each other at the same time.
    }

    override get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): InputErrorCodes[] {
        return [
            couldBeSpriteName(args[0]),
            couldBeSpriteName(args[1])
        ];
    }
}
