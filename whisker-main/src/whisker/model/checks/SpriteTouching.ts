import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {checkSpriteExistence} from "../util/ModelUtil";
import {result} from "./CheckResult";

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

export class SpriteTouching extends PureCheck<SpriteTouchingJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<SpriteTouchingJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(SpriteTouchingArgs.safeParse(args));
    }

    protected _validate(checkJSON: SpriteTouchingJSON): SpriteTouchingJSON {
        return SpriteTouchingJSON.parse(checkJSON) as SpriteTouchingJSON;
    }

    /**
     * Get a method checking whether two sprites are touching.
     *
     * @param t Instance of the test driver to check if two sprites are touching.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [pSpriteName1, pSpriteName2] = this._args;

        const sprite1 = this._checkSpriteExistence(pSpriteName1);
        const sprite2 = checkSpriteExistence(t, pSpriteName2);
        const spriteName1 = sprite1.name;
        const spriteName2 = sprite2.name;

        // on movement check sprite touching other sprite, sprite is given by movement event caller and
        // isTouchingSprite is checking all clones with spriteName2
        this._registerOnMoveEvent(spriteName1);
        this._registerOnMoveEvent(spriteName2);

        // only test touching if the sprite did not move as otherwise the model was already notified and test it,
        // also test clones of spriteName1
        return () => {
            let spritesTouching: boolean;
            const s1Visible = sprite1.visible;
            const s2Visible = sprite2.visible;
            try {
                spritesTouching = sprite1.isTouchingSprite(spriteName2);
            } catch (e) {
                // the clone this check operates on is no longer existent, so .isTouchingSprite throws an exception
                spritesTouching = false;
            }
            return result(spritesTouching, {spritesTouching, s1Visible, s2Visible}, this.negated);
        };
    }

    protected _contradicts(_that: SpriteTouching): boolean {
        return false; // Any combination of 4 sprites may touch each other at the same time.
    }
}
