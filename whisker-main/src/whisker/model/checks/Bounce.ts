import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {any, result} from "./CheckResult";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";

const name = "Bounce" as const;

export type BounceArgs = [
    /**
     * Name of the sprite bouncing.
     */
    spriteName: SpriteName,
];

const BounceArgs = z.tuple([
    SpriteName,
]);

export interface BounceJSON extends ICheckJSON {
    name: typeof name;
    args: BounceArgs;
}

export const BounceJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: BounceArgs,
});

export class Bounce extends AbstractCheck<BounceJSON, CheckFun0> {

    constructor(edgeLabel: string, json: SlimCheckJSON<BounceJSON>) {
        super(edgeLabel, {...json, name});
    }

    /**
     * Get a method whether a sprite bounces when it touches an edge.
     *
     * @param t Instance of the test driver for retrieving the direction attribute of a sprite and its clones.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    protected _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const spriteName = ModelUtil.checkSpriteExistence(t, this._args[0]).name;

        const check = (s: Sprite) => {
            const isDirFlipped = (expected: number) =>
                ModelUtil.checkCyclicValueWithinDelta(s.direction, expected, -180, 180);
            const reason: Record<string, unknown> = {direction: s.direction, oldDirection: s.old.direction};
            let res: boolean | null = null;
            if (s.isTouchingVerticalEdge()) {
                const expected = ModelUtil.flipDirectionVertically(s.old.direction);
                reason.isTouchingVerticalEdge = true;
                reason.expectedVerticalFlip = expected;
                res = isDirFlipped(expected);
            }
            if (s.isTouchingHorizEdge()) {
                const expected = ModelUtil.flipDirectionHorizontally(s.old.direction);
                reason.isTouchingHorziEdge = true;
                reason.expectedHorizFlip = expected;
                res = res === true || isDirFlipped(expected);
            }
            return result(res === true || res === null, reason);
        };

        cu.registerOnVisualChange(spriteName, this, graphID, check);

        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            return any(check, this.negated, sprites);
        };
    }

    protected _contradicts(that: Bounce): boolean {
        return false; // two different objects can be at the same location
    }

    protected _validate(checkJSON: BounceJSON): BounceJSON {
        return BounceJSON.parse(checkJSON) as BounceJSON;
    }

    get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(BounceArgs.safeParse(args));
    }
}
