import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {Randomness} from "../../utils/Randomness";
import {z} from "zod";
import {result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, ProbabilityArg} from "./CheckTypes";
import {testNumber} from "../util/ModelUtil";

const name = "Probability" as const;

export type ProbabilityArgs = [

    /**
     * The probability e.g. 0.5.
     */
    probability: number,
];

const ProbabilityArgs = z.tuple([
    ProbabilityArg
]);

export interface ProbabilityJSON extends ICheckJSON {
    name: typeof name;
    args: ProbabilityArgs;
}

export const ProbabilityJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: ProbabilityArgs,
});

export class Probability extends PureCheck<ProbabilityJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<ProbabilityJSON>) {
        super(edgeLabel, {...json, name});
    }

    get probability(): number {
        return this._args[0];
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(ProbabilityArgs.safeParse(args));
    }

    protected _validate(checkJSON: ProbabilityJSON): ProbabilityJSON {
        return ProbabilityJSON.parse(checkJSON) as ProbabilityJSON;
    }

    /**
     * Get a method that checks whether a random number is greater than the probability given. For randomness...
     * @param t Instance of the test driver (unused).
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [probability] = this._args;
        const negated = this.negated;
        const prob = testNumber(probability);
        return () => result(Randomness.getInstance().nextDouble() < prob, {}, negated);
    }

    protected _contradicts(_that: Probability): boolean {
        return false;
    }
}
