import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {any, Reason, result} from "./CheckResult";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {
    checkCyclicValueWithinDelta,
    checkSpriteExistence,
    flipDirectionHorizontally,
    flipDirectionVertically
} from "../util/ModelUtil";

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

    get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(BounceArgs.safeParse(args));
    }

    /**
     * Get a method whether a sprite bounces when it touches an edge.
     *
     * @param t Instance of the test driver for retrieving the direction attribute of a sprite and its clones.
     */
    protected _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const spriteName = checkSpriteExistence(t, this._args[0]).name;

        const check = (s: Sprite) => {
            const isDirFlipped = (expected: number) =>
                checkCyclicValueWithinDelta(s.direction, expected, -180, 180);
            const reason: Reason = {direction: s.direction, oldDirection: s.old.direction};
            let touchingEdge = false;
            let dirFlipped = false;

            if (s.isTouchingVerticalEdge()) {
                touchingEdge = true;
                const expected = flipDirectionVertically(s.old.direction);
                reason.isTouchingVerticalEdge = true;
                reason.expectedVerticalFlip = expected;
                dirFlipped = isDirFlipped(expected);
            }

            if (s.isTouchingHorizEdge()) {
                touchingEdge = true;
                const expected = flipDirectionHorizontally(s.old.direction);
                reason.isTouchingHorziEdge = true;
                reason.expectedHorizFlip = expected;
                dirFlipped ||= isDirFlipped(expected);
            }

            return result(!touchingEdge || dirFlipped, reason);
        };

        this._registerOnVisualChange(spriteName, check);

        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            return any(check, this.negated, sprites);
        };
    }

    protected _contradicts(that: Bounce): boolean {
        return false; // a sprite and a clone can touch both edges at the same time
    }

    protected _validate(checkJSON: BounceJSON): BounceJSON {
        return BounceJSON.parse(checkJSON) as BounceJSON;
    }
}
