import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {ComparingCheck, Comparison, newComparison} from "./Comparison";
import {ErrorForAttribute} from "../util/ModelError";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {InputErrorCodes} from "./newCheck";
import {ModelUtil} from "../util/ModelUtil";
import {ComparisonOp} from "./CheckTypes";

const name = "BackgroundChange" as const;

export type BackgroundChangeArgs = [
    /**
     * Name of the new background.
     */
    newBackground: string,
];

const BackgroundChangeArgs = z.tuple([
    z.string(),
]);

export interface BackgroundChangeJSON extends ICheckJSON {
    name: typeof name;
    args: BackgroundChangeArgs;
}

export const BackgroundChangeJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: BackgroundChangeArgs,
});

export class BackgroundChange extends AbstractCheck<BackgroundChangeJSON, CheckFun0> implements ComparingCheck {
    private readonly _comparison: Comparison;

    constructor(edgeLabel: string, json: SlimCheckJSON<BackgroundChangeJSON>) {
        super(edgeLabel, {...json, name});
        this._comparison = newComparison(this);
    }

    protected _validate(checkJSON: BackgroundChangeJSON): BackgroundChangeJSON {
        return BackgroundChangeJSON.parse(checkJSON) as BackgroundChangeJSON;
    }

    get operator(): ComparisonOp {
        return "==";
    }

    get value(): string {
        return this._args[0];
    }

    /**
     * Get a method checking whether the background of the stage changed.
     * @param t Instance of the test driver for retrieving the current costume of the stage
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        // without movement
        return () => {
            try {
                return this._comparison.apply(t.getStage()["currentCostumeName"]);
            } catch (e) {
                // should not even happen...
                throw new ErrorForAttribute("_stage_", "costume", e);
            }
        };
    }

    protected override _contradicts(that: BackgroundChange): boolean {
        return this._comparison.contradicts(that._comparison);
    }

    override get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): InputErrorCodes[] {
        return [ModelUtil.argIsString(args, 0)];
    }
}
