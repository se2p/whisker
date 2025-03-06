import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {ComparingCheck, Comparison, ComparisonOp, newComparison} from "./Comparison";
import {fail} from "./CheckResult";
import {ErrorForAttribute} from "../util/ModelError";

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
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): CheckFun0 {
        // without movement
        return () => {
            const actual = t.getStage()["currentCostumeName"];
            try {
                const res = this._comparison.apply(actual);
                return res.passed === true
                    ? res
                    : fail(`Expected current background to be "${this.value}" but got "${actual}"`);
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
}
