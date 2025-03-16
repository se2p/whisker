import {AbstractCheck, CheckFun0, couldBeSpriteName, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {any, result} from "./CheckResult";
import {ArgType} from "../util/schema";

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
        return () => {
            const rotatingSprite: Sprite = t.getSprite(spriteNameRotate);
            const expectedDirection = this._args[1] == "_mouse_"
                ? ModelUtil.getExpectedDirectionForSpriteLookingAtMouse(rotatingSprite, t)
                : ModelUtil.getExpectedDirectionForSprite1LookingAtSprite2(rotatingSprite, t.getSprite(this._args[1]));
            const sprites = rotatingSprite.getClones(true);
            const check = (s: Sprite) => result(
                ModelUtil.checkDirectionWithinDelta(s, expectedDirection),
                {actual: s.direction, expected: expectedDirection}
            );
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

    public static convertArgs(args: ArgType[]): boolean[] {
        return [
            couldBeSpriteName(args[0]),
            couldBeSpriteName(args[1])
        ];
    }
}
