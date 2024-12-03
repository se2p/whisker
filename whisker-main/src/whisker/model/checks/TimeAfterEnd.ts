import {AbstractCheck, Check, ICheckJSON} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

const NAME = "TimeAfterEnd" as const;

export type TimeAfterEndArgs = [
    /**
     * Time in milliseconds.
     */
    timeInMS: number,
];

const TimeAfterEndArgs = z.tuple([
    z.coerce.number().nonnegative(),
]);

export interface TimeAfterEndJSON extends ICheckJSON {
    name: typeof NAME;
    args: TimeAfterEndArgs;
}

export const TimeAfterEndJSON = ICheckJSON.extend({
    name: z.literal(NAME),
    args: TimeAfterEndArgs,
});

export class TimeAfterEnd extends AbstractCheck<TimeAfterEndJSON> {
    constructor(id: string, edgeLabel: string, negated: boolean, args: TimeAfterEndArgs) {
        super(id, edgeLabel, negated, NAME, args);
    }

    /**
     * Get a method that checks whether enough time has elapsed since the program ended.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): Check {
        const [timeInMS] = this._args;
        const negated = this._negated;
        const time = ModelUtil.testNumber(timeInMS);
        const steps = t.vmWrapper.convertFromTimeToSteps(time);
        return (_, stepsSinceEnd) => {
            return !negated == (steps <= (t.getTotalStepsExecuted() - stepsSinceEnd));
        };
    }
}
