import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {result} from "./CheckResult";
import {ArgType} from "../util/schema";
import {InputErrorCodes} from "./newCheck";

const name = "AnyKey" as const;

export type AnyKeyArgs = [];

const AnyKeyArgs = z.tuple([]);

export interface AnyKeyJSON extends ICheckJSON {
    name: typeof name;
    args: AnyKeyArgs;
}

export const AnyKeyJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: AnyKeyArgs,
});

export class AnyKey extends AbstractCheck<AnyKeyJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<AnyKeyJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: AnyKeyJSON): AnyKeyJSON {
        return AnyKeyJSON.parse(checkJSON) as AnyKeyJSON;
    }

    /**
     * Get a method for checking if any key was pressed or not pressed.
     * @param t Instance of the test driver (unused).
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        return () => {
            return result(cu.isAnyKeyDown(), {}, this.negated);
        };
    }

    protected _contradicts(_that: AnyKey): boolean {
        return false; // Multiple keys can be pressed at the same time.
    }

    override get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): InputErrorCodes[] {
        return [];
    }
}
