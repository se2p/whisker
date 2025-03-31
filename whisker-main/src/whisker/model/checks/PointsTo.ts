import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {any, result} from "./CheckResult";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";

const name = "PointsTo" as const;

export type PointsToArgs = [
    /**
     * Name of the sprite looking in the direction of something.
     */
    spriteName: SpriteName,

    /**
     * Key of the object the first sprite should be looking to.
     */
    otherObject: SpriteName | "_mouse_",
];

const PointsToArgs = z.tuple([
    SpriteName,
    SpriteName.or(z.literal("_mouse_")),
]);

export interface PointsToJSON extends ICheckJSON {
    name: typeof name;
    args: PointsToArgs;
}

export const PointsToJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: PointsToArgs,
});

export class PointsTo extends AbstractCheck<PointsToJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<PointsToJSON>) {
        super(edgeLabel, {...json, name});
    }

    /**
     * Get a method whether a sprite points to the mouse/another sprite.
     *
     * @param t Instance of the test driver for retrieving the direction attribute of a sprite and its clones.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    protected _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const spriteNameRotate = ModelUtil.checkSpriteExistence(t, this._args[0]).name;
        if (this._args[1] != "_mouse_") {
            ModelUtil.checkSpriteExistence(t, this._args[1]).name;
        }

        const check = (s: Sprite) => {
            let expectedDirection: number, hasCorrectDirection: boolean;
            if (this._args[1] == "_mouse_") {
                expectedDirection = ModelUtil.getExpectedDirectionForSpriteLookingAtMouse(s, t);
                hasCorrectDirection = ModelUtil.checkDirectionWithinDelta(s, expectedDirection);
            } else {
                const target = t.getSprite(this._args[1]);
                expectedDirection = ModelUtil.getExpectedDirectionForSprite1LookingAtSprite2(s, target);
                hasCorrectDirection = ModelUtil.checkDirectionWithinDelta(s, expectedDirection);
                if (!hasCorrectDirection) {
                    // maybe the sprite just moved so it did point to the sprite
                    const dirOld = ModelUtil.getExpectedDirectionForSprite1LookingAtSprite2(s, target.old);
                    hasCorrectDirection = ModelUtil.checkDirectionWithinDelta(s, dirOld);
                }
            }
            return result(hasCorrectDirection, {actual: s.direction, expected: expectedDirection});
        };

        cu.registerOnVisualChange(spriteNameRotate, this, graphID, check);

        return () => {
            const sprites = t.getSprite(spriteNameRotate).getClones(true);
            return any(check, this.negated, sprites);
        };
    }

    protected _contradicts(that: PointsTo): boolean {
        return false; // two different objects can be at the same location
    }

    protected _validate(checkJSON: PointsToJSON): PointsToJSON {
        return PointsToJSON.parse(checkJSON) as PointsToJSON;
    }

    get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(PointsToArgs.safeParse(args));
    }
}
