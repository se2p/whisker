import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {any} from "./CheckResult";
import {ArgType} from "../util/schema";
import {NumberLike, parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";

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

export class MoveSteps extends AbstractCheck<MoveStepsJSON, CheckFun0> {

    constructor(edgeLabel: string, json: SlimCheckJSON<MoveStepsJSON>) {
        super(edgeLabel, {...json, name});
    }

    /**
     * Get a method whether a sprite moved a certain number of steps
     *
     * @param t Instance of the test driver for retrieving the direction attribute of a sprite and its clones.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    protected _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const spriteName = ModelUtil.checkSpriteExistence(t, this._args[0]).name;

        const check = (s: Sprite) => ModelUtil.movedCorrectAmountOfSteps(s, this._args[1], this.negated);

        cu.registerOnVisualChange(spriteName, this, graphID, check);

        return () => {
            const sprites = t.getSprite(spriteName).getClones(true);
            return any(check, this.negated, sprites);
        };
    }

    protected _contradicts(that: MoveSteps): boolean {
        return false; // two different objects can be at the same location
    }

    protected _validate(checkJSON: MoveStepsJSON): MoveStepsJSON {
        return MoveStepsJSON.parse(checkJSON) as MoveStepsJSON;
    }

    get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(MoveStepsArgs.safeParse(args));
    }
}
