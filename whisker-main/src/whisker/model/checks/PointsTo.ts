import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {CheckJSON} from "./newCheck";

const name = "PointsTo" as const;

export type PointsToArgs = [
    /**
     * Name of the sprite looking in the direction of something.
     */
    spriteName: SpriteName,

    /**
     * Key of the object the first sprite should be looking to.
     */
    otherObject: SpriteName | "mouse-pointer",
];

const PointsToArgs = z.tuple([
    SpriteName,
    SpriteName.or(z.literal("mouse-pointer")),
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

    protected _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): CheckFun0 {
        const spriteNameRotate = ModelUtil.checkSpriteExistence(t, this._args[0]).name;
        if (this._args[1] != "mouse-pointer") {
            ModelUtil.checkSpriteExistence(t, this._args[1]).name;
        }
        return () => {
            const rotatingSprite: Sprite = t.getSprite(spriteNameRotate);
            const expectedDirection = this._args[1] == "mouse-pointer"
                ? ModelUtil.getExpectedDirectionForSpriteLookingAtMouse(rotatingSprite, t)
                : ModelUtil.getExpectedDirectionForSprite1LookingAtSprite2(rotatingSprite, t.getSprite(this._args[1]));
            const sprites = rotatingSprite.getClones(true);
            const check = (s: Sprite) => ModelUtil.checkDirectionWithinDelta(s, expectedDirection);
            const anyHasCorrectDirection = sprites.some(check);
            return !this.negated == anyHasCorrectDirection;
        };
    }

    protected _contradicts(that: PointsTo): boolean {
        return false; // two different objects can be at the same location
    }

    protected _validate(checkJSON: PointsToJSON): PointsToJSON {
        return CheckJSON.parse(checkJSON) as PointsToJSON;
    }

    get dependsOnSayText(): boolean {
        return false;
    }
}
