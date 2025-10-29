import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {result} from "./CheckResult";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {checkCyclicValueWithinDelta, flipDirectionHorizontally, flipDirectionVertically} from "../util/ModelUtil";

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

export class Bounce extends PureCheck<BounceJSON, CheckFun0> {

    constructor(edgeLabel: string, json: SlimCheckJSON<BounceJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(BounceArgs.safeParse(args));
    }

    protected _validate(checkJSON: BounceJSON): BounceJSON {
        return BounceJSON.parse(checkJSON) as BounceJSON;
    }

    /**
     * Get a method whether a sprite bounces when it touches an edge.
     *
     * @param t Instance of the test driver for retrieving the direction attribute of a sprite and its clones.
     */
    protected _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const sprite = this._checkSpriteExistence(this._args[0]);
        const spriteName = sprite.name;

        this._registerOnVisualChange(spriteName);

        return () => {
            const isDirFlipped = (expected: number) =>
                checkCyclicValueWithinDelta(sprite.direction, expected, -180, 180, 5);
            // delta of 5 to minimize false positives

            const reason: Record<string, unknown> = {direction: sprite.direction, oldDirection: sprite.old.direction};
            let touchingEdge = false;
            let dirFlipped = false;

            if (sprite.isTouchingVerticalEdge()) {
                touchingEdge = true;
                const expected = flipDirectionVertically(sprite.old.direction);
                reason.isTouchingVerticalEdge = true;
                reason.expectedVerticalFlip = expected;
                dirFlipped = isDirFlipped(expected);
            }

            if (sprite.isTouchingHorizEdge()) {
                touchingEdge = true;
                const expected = flipDirectionHorizontally(sprite.old.direction);
                reason.isTouchingHorziEdge = true;
                reason.expectedHorizFlip = expected;
                dirFlipped ||= isDirFlipped(expected);
            }

            return result(!touchingEdge || dirFlipped, reason, this.negated);
        };
    }

    protected _contradicts(that: Bounce): boolean {
        return false; // there is neither a contradiction for different sprites nor a contradiction with the same
    }
}
