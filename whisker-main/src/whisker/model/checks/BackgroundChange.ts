import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {ComparingCheck, Comparison, newComparison} from "./Comparison";
import {ErrorForAttribute} from "../util/ModelError";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {ComparisonOp, NonEmptyString, parseNonUnionError, ParsingResult} from "./CheckTypes";
import {STAGE_NAME} from "../../../assembler/utils/selectors";

const name = "BackgroundChange" as const;

export type BackgroundChangeArgs = [
    /**
     * Name of the new background.
     */
    newBackground: string,
];

const BackgroundChangeArgs = z.tuple([
    NonEmptyString,
]);

export interface BackgroundChangeJSON extends ICheckJSON {
    name: typeof name;
    args: BackgroundChangeArgs;
}

export const BackgroundChangeJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: BackgroundChangeArgs,
});

export class BackgroundChange extends PureCheck<BackgroundChangeJSON, CheckFun0> implements ComparingCheck {
    private readonly _comparison: Comparison;

    constructor(edgeLabel: string, json: SlimCheckJSON<BackgroundChangeJSON>) {
        super(edgeLabel, {...json, name});
        this._comparison = newComparison(this);
    }

    get operator(): ComparisonOp {
        return "==";
    }

    get value(): string {
        return this._args[0];
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(BackgroundChangeArgs.safeParse(args));
    }

    protected _validate(checkJSON: BackgroundChangeJSON): BackgroundChangeJSON {
        return BackgroundChangeJSON.parse(checkJSON) as BackgroundChangeJSON;
    }

    /**
     * Get a method checking whether the background of the stage changed.
     * @param t Instance of the test driver for retrieving the current costume of the stage
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        // without movement
        return () => {
            try {
                return this._comparison.apply(t.getStage()["currentCostumeName"]);
            } catch (e) {
                // should not even happen...
                throw new ErrorForAttribute(STAGE_NAME, "costume", e);
            }
        };
    }

    protected override _contradicts(that: BackgroundChange): boolean {
        return this._comparison.contradicts(that._comparison);
    }
}
