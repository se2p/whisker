import {AbstractCheck, Check, ICheckJSON} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

const NAME = "TimeElapsed" as const;

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
    name: typeof NAME;
    args: TimeElapsedArgs;
}

export const TimeElapsedJSON = ICheckJSON.extend({
    name: z.literal(NAME),
    args: TimeElapsedArgs,
});

export class TimeElapsed extends AbstractCheck<TimeElapsedJSON> {
    constructor(edgeLabel: string, id: string, negated: boolean, args: TimeElapsedArgs) {
        super(edgeLabel, id, negated, NAME, args);
    }

    /**
     * Get a method that checks whether enough time has elapsed since the test runner started the test.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): Check {
        const [timeInMS] = this._args;
        const negated = this._negated;
        const time = ModelUtil.testNumber(timeInMS);
        const steps = t.vmWrapper.convertFromTimeToSteps(time);
        return () => {
            return !negated == (steps <= t.getTotalStepsExecuted());
        };
    }
}
