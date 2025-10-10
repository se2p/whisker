import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {any} from "./CheckResult";
import {ArgType} from "../util/schema";
import {NumberLike, parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {checkSpriteExistence, movedCorrectAmountOfSteps} from "../util/ModelUtil";

const name = "MoveSteps" as const;

export type MoveStepsArgs = [
    /**
     * Name of the sprite moving.
     */
    spriteName: SpriteName,

    /**
     * Distance the sprite should be moving.
     */
    distance: number,
];

const MoveStepsArgs = z.tuple([
    SpriteName,
    NumberLike,
]);

export interface MoveStepsJSON extends ICheckJSON {
    name: typeof name;
    args: MoveStepsArgs;
}

export const MoveStepsJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: MoveStepsArgs,
});

export class MoveSteps extends PureCheck<MoveStepsJSON, CheckFun0> {

    constructor(edgeLabel: string, json: SlimCheckJSON<MoveStepsJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(MoveStepsArgs.safeParse(args));
    }

    protected _validate(checkJSON: MoveStepsJSON): MoveStepsJSON {
        return MoveStepsJSON.parse(checkJSON) as MoveStepsJSON;
    }

    /**
     * Get a method whether a sprite moved a certain number of steps
     *
     * @param t Instance of the test driver for retrieving the direction attribute of a sprite and its clones.
     */
    protected _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const spriteName = checkSpriteExistence(t, this._args[0]).name;

        const check = (s: Sprite) => movedCorrectAmountOfSteps(s, this._args[1], this.negated);

        this._registerOnMoveEvent(spriteName);

        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            return any(check, this.negated, sprites);
        };
    }

    protected _contradicts(that: MoveSteps): boolean {
        return false; // a sprite and a clone can move two different amounts at the same time
    }
}
