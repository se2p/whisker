import {AbstractCheck, Check, ICheckJSON, OptionalName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

const name = "TimeBetween" as const;

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
    name: typeof name;
    args: TimeBetweenArgs;
}

export const TimeBetweenJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: TimeBetweenArgs,
});

export class TimeBetween extends AbstractCheck<TimeBetweenJSON> {
    constructor(edgeLabel: string, json: OptionalName<TimeBetweenJSON>) {
        super(edgeLabel, {...json, name}, TimeBetweenJSON.parse.bind(TimeBetweenJSON));
    }

    /**
     * Get a method that checks whether enough time has elapsed since the last edge transition in the current model.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): Check {
        const [timeInMS] = this.args;
        const negated = this.negated;
        const time = ModelUtil.testNumber(timeInMS);
        const steps = t.vmWrapper.convertFromTimeToSteps(time);
        return (stepsSinceLastTransition) => {
            return !negated == (steps <= stepsSinceLastTransition);
        };
    }
}
