import {AbstractCheck, Check, ICheckJSON, OptionalName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

const name = "TimeElapsed" as const;

export type TimeElapsedArgs = [
    /**
     * Time in milliseconds.
     */
    timeInMS: number,
];

const TimeElapsedArgs = z.tuple([
    z.coerce.number().nonnegative(),
]);

export interface TimeElapsedJSON extends ICheckJSON {
    name: typeof name;
    args: TimeElapsedArgs;
}

export const TimeElapsedJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: TimeElapsedArgs,
});

export class TimeElapsed extends AbstractCheck<TimeElapsedJSON> {
    constructor(edgeLabel: string, json: OptionalName<TimeElapsedJSON>) {
        super(edgeLabel, {...json, name});
    }

    /**
     * Get a method that checks whether enough time has elapsed since the test runner started the test.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): Check {
        const [timeInMS] = this.args;
        const negated = this.negated;
        const time = ModelUtil.testNumber(timeInMS);
        const steps = t.vmWrapper.convertFromTimeToSteps(time);
        return () => {
            return !negated == (steps <= t.getTotalStepsExecuted());
        };
    }
}
