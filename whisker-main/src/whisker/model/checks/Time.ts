import {z} from "zod";
import {AbstractCheck, CheckFun, ICheckJSON, Optional, SlimCheckJSON} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";

export type TimeArgs = [

    /**
     * Time in milliseconds.
     */
    timeInMS: number,
];

const TimeArgs = z.tuple([
    z.coerce.number().nonnegative(),
]);

interface ITimeJSON extends ICheckJSON {
    args: TimeArgs;
}

const ITimeJSON = ICheckJSON.extend({
    args: TimeArgs,
});

type TTimeJSON =
    | TimeAfterEndJSON
    | TimeElapsedJSON
    | TimeBetweenJSON
    ;

abstract class AbstractTime<J extends TTimeJSON = TTimeJSON> extends AbstractCheck<J> {
    protected readonly _steps: number;

    protected constructor(edgeLabel: string, json: Optional<J, "negated">) {
        super(edgeLabel, json);
    }

    public get millis(): number {
        return this._args[0];
    }

    protected _convertFromTimeToSteps(t): number {
        const time = ModelUtil.testNumber(this.millis);
        return t.vmWrapper.convertFromTimeToSteps(time);
    }

    protected override _contradicts(_that: AbstractTime): boolean {
        return false; // Time is not mutually exclusive.
    }

    override get dependsOnSayText(): boolean {
        return false;
    }
}

const nameTimeAfterEnd = "TimeAfterEnd" as const;

export interface TimeAfterEndJSON extends ITimeJSON {
    name: typeof nameTimeAfterEnd;
}

export const TimeAfterEndJSON = ITimeJSON.extend({
    name: z.literal(nameTimeAfterEnd),
});

export class TimeAfterEnd extends AbstractTime<TimeAfterEndJSON> {
    constructor(edgeLabel: string, json: SlimCheckJSON<TimeAfterEndJSON>) {
        super(edgeLabel, {...json, name: nameTimeAfterEnd});
    }

    protected _validate(checkJSON: TimeAfterEndJSON): TimeAfterEndJSON {
        return TimeAfterEndJSON.parse(checkJSON) as TimeAfterEndJSON;
    }

    /**
     * Get a method that checks whether enough time has elapsed since the program ended.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): CheckFun {
        const steps = this._convertFromTimeToSteps(t);
        return (_, stepsSinceEnd) => {
            return !this._negated == (steps <= (t.getTotalStepsExecuted() - stepsSinceEnd));
        };
    }
}

const nameTimeBetween = "TimeBetween" as const;

export interface TimeBetweenJSON extends ITimeJSON {
    name: typeof nameTimeBetween;
}

export const TimeBetweenJSON = ITimeJSON.extend({
    name: z.literal(nameTimeBetween),
});

export class TimeBetween extends AbstractTime<TimeBetweenJSON> {
    constructor(edgeLabel: string, json: SlimCheckJSON<TimeBetweenJSON>) {
        super(edgeLabel, {...json, name: nameTimeBetween});
    }

    protected _validate(checkJSON: TimeBetweenJSON): TimeBetweenJSON {
        return TimeBetweenJSON.parse(checkJSON) as TimeBetweenJSON;
    }

    /**
     * Get a method that checks whether enough time has elapsed since the last edge transition in the current model.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): CheckFun {
        const steps = this._convertFromTimeToSteps(t);
        return (stepsSinceLastTransition) => {
            return !this._negated == (steps <= stepsSinceLastTransition);
        };
    }
}

const nameTimeElapsed = "TimeElapsed" as const;

export interface TimeElapsedJSON extends ITimeJSON {
    name: typeof nameTimeElapsed;
}

export const TimeElapsedJSON = ITimeJSON.extend({
    name: z.literal(nameTimeElapsed),
});

export class TimeElapsed extends AbstractTime<TimeElapsedJSON> {
    constructor(edgeLabel: string, json: SlimCheckJSON<TimeElapsedJSON>) {
        super(edgeLabel, {...json, name: nameTimeElapsed});
    }

    protected _validate(checkJSON: TimeElapsedJSON): TimeElapsedJSON {
        return TimeElapsedJSON.parse(checkJSON) as TimeElapsedJSON;
    }

    /**
     * Get a method that checks whether enough time has elapsed since the test runner started the test.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): CheckFun {
        const steps = this._convertFromTimeToSteps(t);
        return () => {
            return !this._negated == (steps <= t.getTotalStepsExecuted());
        };
    }
}
