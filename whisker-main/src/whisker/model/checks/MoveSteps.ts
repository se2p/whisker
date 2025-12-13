import {BoundedCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {AttrName, NumberLike, parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {getXYBounds, movedCorrectAmountOfSteps, XYBounds} from "../util/ModelUtil";
import {result} from "./CheckResult";
import Sprite from "../../../vm/sprite";

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

export class MoveSteps extends BoundedCheck<MoveStepsJSON, CheckFun0> {

    constructor(edgeLabel: string, json: SlimCheckJSON<MoveStepsJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(MoveStepsArgs.safeParse(args));
    }

    protected get attrName(): AttrName {
        // here it does not matter if the returned value is "x" or "y" because they need updates under the same events
        return "x";
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
        const sprite = this._checkSpriteExistence(this._args[0]);
        const spriteName = sprite.name;

        this._registerOnMoveEvent(spriteName);
        this._boundsNeedUpdate(sprite);
        let bounds = getXYBounds(sprite);

        return () => {
            const reason = {};
            bounds = this._updatedBound(sprite, bounds);
            const correct = movedCorrectAmountOfSteps(sprite, this._args[1], bounds, reason);
            return result(correct, reason, this.negated);
        };
    }

    private _updatedBound(s: Sprite, currentBounds: XYBounds): XYBounds {
        return this._boundsNeedUpdate(s) ? getXYBounds(s) : currentBounds;
    }

    protected _contradicts(that: MoveSteps): boolean {
        return this._args[0] === that._args[0] && this._args[1] !== that._args[1];
    }
}
