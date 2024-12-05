import {AbstractCheck, Check, ICheckJSON} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {Randomness} from "../../utils/Randomness";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

const NAME = "Probability" as const;

export type ProbabilityArgs = [

    /**
     * The probability e.g. 0.5.
     */
    probability: number,
];

const ProbabilityArgs = z.tuple([
    z.coerce.number().min(0).max(1),
]);

export interface ProbabilityJSON extends ICheckJSON {
    name: typeof NAME;
    args: ProbabilityArgs;
}

export const ProbabilityJSON = ICheckJSON.extend({
    name: z.literal(NAME),
    args: ProbabilityArgs,
});

export class Probability extends AbstractCheck<ProbabilityJSON> {
    constructor(edgeLabel: string, id: string, negated: boolean, args: ProbabilityArgs) {
        super(edgeLabel, id, negated, NAME, args);
    }

    /**
     * Get a method that checks whether a random number is greater than the probability given. For randomness...
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): Check {
        const [probability] = this._args;
        const negated = this._negated;
        const prob = ModelUtil.testNumber(probability);
        return () => {
            return !negated == (Randomness.getInstance().nextDouble() <= prob);
        };
    }
}
