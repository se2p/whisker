import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {result} from "./CheckResult";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "./CheckTypes";

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

export class AnyKey extends PureCheck<AnyKeyJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<AnyKeyJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(AnyKeyArgs.safeParse(args));
    }

    protected _validate(checkJSON: AnyKeyJSON): AnyKeyJSON {
        return AnyKeyJSON.parse(checkJSON) as AnyKeyJSON;
    }

    /**
     * Get a method for checking if any key was pressed or not pressed.
     * @param t Instance of the test driver (unused).
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        return () => {
            return result(this.cu.isAnyKeyDown(), {}, this.negated);
        };
    }

    protected _contradicts(_that: AnyKey): boolean {
        return false; // Multiple keys can be pressed at the same time.
    }
}
