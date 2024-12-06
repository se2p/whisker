import {AbstractCheck, Check, ICheckJSON, OptionalName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

const name = "TimeAfterEnd" as const;

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
    name: typeof name;
    args: TimeAfterEndArgs;
}

export const TimeAfterEndJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: TimeAfterEndArgs,
});

export class TimeAfterEnd extends AbstractCheck<TimeAfterEndJSON> {
    constructor(edgeLabel: string, json: OptionalName<TimeAfterEndJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: TimeAfterEndJSON): TimeAfterEndJSON {
        return TimeAfterEndJSON.parse(checkJSON) as TimeAfterEndJSON;
    }

    /**
     * Get a method that checks whether enough time has elapsed since the program ended.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): Check {
        const [timeInMS] = this.args;
        const negated = this.negated;
        const time = ModelUtil.testNumber(timeInMS);
        const steps = t.vmWrapper.convertFromTimeToSteps(time);
        return (_, stepsSinceEnd) => {
            return !negated == (steps <= (t.getTotalStepsExecuted() - stepsSinceEnd));
        };
    }
}
