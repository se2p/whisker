import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {result} from "./CheckResult";
import {ArgType, Position} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {
    checkDirectionWithinDelta,
    getExpectedDirectionForSprite1LookingAtTarget,
    MOUSE_NAME,
    numberToReasonString
} from "../util/ModelUtil";

const name = "PointsTo" as const;

export type PointsToArgs = [
    /**
     * Name of the sprite looking in the direction of something.
     */
    spriteName: SpriteName,

    /**
     * Key of the object the first sprite should be looking to.
     */
    otherObject: SpriteName | typeof MOUSE_NAME,
];

const PointsToArgs = z.tuple([
    SpriteName,
    SpriteName.or(z.literal(MOUSE_NAME)),
]);

export interface PointsToJSON extends ICheckJSON {
    name: typeof name;
    args: PointsToArgs;
}

export const PointsToJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: PointsToArgs,
});

export class PointsTo extends PureCheck<PointsToJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<PointsToJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(PointsToArgs.safeParse(args));
    }

    protected _validate(checkJSON: PointsToJSON): PointsToJSON {
        return PointsToJSON.parse(checkJSON) as PointsToJSON;
    }

    /**
     * Get a method whether a sprite points to the mouse/another sprite.
     *
     * @param t Instance of the test driver for retrieving the direction attribute of a sprite and its clones.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const sprite = this._checkSpriteExistence(this._args[0]);
        const spriteNameRotate = sprite.name;
        const targetName = this._args[1] === MOUSE_NAME ? MOUSE_NAME : this._checkSpriteExistence(this._args[1]).name;
        this._registerOnVisualChange(spriteNameRotate);
        this._registerOnMoveEvent(spriteNameRotate);
        if (targetName !== MOUSE_NAME) {
            this._registerOnVisualChange(targetName);
            this._registerOnMoveEvent(targetName);
        }
        return () => {
            let target: Position;
            if (targetName == MOUSE_NAME) {
                target = t.getMousePos();
                if (Number.isNaN(target.x) || Number.isNaN(target.y)) {
                    return result(true, {msg: "mouse position is NaN"}, this.negated);
                }
            } else {
                target = t.getSprite(targetName);
            }
            const expectedValues = [
                getExpectedDirectionForSprite1LookingAtTarget(sprite, target.x, target.y),
                getExpectedDirectionForSprite1LookingAtTarget(sprite.old, target.x, target.y)
            ];
            const reason = {
                actual: numberToReasonString(sprite.direction),
                expected: `[${expectedValues.map(numberToReasonString).join(",")}]`,
                s_x: numberToReasonString(sprite.x),
                s_y: numberToReasonString(sprite.y),
                t_x: numberToReasonString(target.x),
                t_y: numberToReasonString(target.y),
            };
            const hasCorrectDirection = expectedValues.some(e => checkDirectionWithinDelta(sprite, e))
                || sprite.x === target.x && sprite.direction === 90; // 90 and 180 should both be fine
            return result(hasCorrectDirection, reason, this.negated);
        };
    }

    protected _contradicts(that: PointsTo): boolean {
        return false; // two different objects can be at the same location
    }
}
