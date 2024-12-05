import {AbstractCheck, Check, ICheckJSON} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

const NAME = "TimeBetween" as const;

export type TimeBetweenArgs = [
    /**
     * Time in milliseconds.
     */
    timeInMS: number,
];

const TimeBetweenArgs = z.tuple([
    z.coerce.number().nonnegative(),
]);

export interface TimeBetweenJSON extends ICheckJSON {
    name: typeof NAME;
    args: TimeBetweenArgs;
}

export const TimeBetweenJSON = ICheckJSON.extend({
    name: z.literal(NAME),
    args: TimeBetweenArgs,
});

export class TimeBetween extends AbstractCheck<TimeBetweenJSON> {
    constructor(edgeLabel: string, id: string, negated: boolean, args: TimeBetweenArgs) {
        super(edgeLabel, id, negated, NAME, args);
    }

    /**
     * Get a method that checks whether enough time has elapsed since the last edge transition in the current model.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): Check {
        const [timeInMS] = this._args;
        const negated = this._negated;
        const time = ModelUtil.testNumber(timeInMS);
        const steps = t.vmWrapper.convertFromTimeToSteps(time);
        return (stepsSinceLastTransition) => {
            return !negated == (steps <= stepsSinceLastTransition);
        };
    }
}
