import {z} from "zod";
import {AbstractCheck, CheckFun, CheckFun0, CheckFun1, CheckFun2, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import VMWrapper from "../../../vm/vm-wrapper";
import {Optional} from "../../utils/Optional";
import {result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";

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

abstract class AbstractTime<J extends TTimeJSON = TTimeJSON, C extends CheckFun = CheckFun> extends AbstractCheck<J, C> {
    protected readonly _steps: number;

    protected constructor(edgeLabel: string, json: Optional<J, "negated">) {
        super(edgeLabel, json);
        this._steps = this._convertFromTimeToSteps();
    }

    public get millis(): number {
        return this._args[0];
    }

    private _convertFromTimeToSteps(): number {
        const time = ModelUtil.testNumber(this.millis);
        return VMWrapper.convertFromTimeToSteps(time);
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

export class TimeAfterEnd extends AbstractTime<TimeAfterEndJSON, CheckFun2> {
    constructor(edgeLabel: string, json: SlimCheckJSON<TimeAfterEndJSON>) {
        super(edgeLabel, {...json, name: nameTimeAfterEnd});
    }

    protected _validate(checkJSON: TimeAfterEndJSON): TimeAfterEndJSON {
        return TimeAfterEndJSON.parse(checkJSON) as TimeAfterEndJSON;
    }

    /**
     * Get a method that checks whether enough time has elapsed since the program ended.
     * @param t Instance of the test driver for retrieving the total number of steps executed.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun2 {
        return (_, stepsSinceEnd) => {
            const steps = t.getTotalStepsExecuted() - stepsSinceEnd;
            const reason =
                `Expected ${this.negated ? "no more than" : "at least"} ${this._steps} steps ` +
                `since the program ended, but got ${steps}`;
            return result(this._steps <= steps, reason, this.negated);
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

export class TimeBetween extends AbstractTime<TimeBetweenJSON, CheckFun1> {
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
    override _checkArgsWithTestDriver(t: TestDriver, _cu: CheckUtility, _graphID: string): CheckFun1 {
        return (stepsSinceLastTransition) => {
            const reason =
                `Expected ${this.negated ? "no more than" : "at least"} ${this._steps} steps ` +
                `since the last transition in the model, but got ${stepsSinceLastTransition}`;
            return result(this._steps <= stepsSinceLastTransition, reason, this.negated);
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

export class TimeElapsed extends AbstractTime<TimeElapsedJSON, CheckFun0> {
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
    override _checkArgsWithTestDriver(t: TestDriver, _cu: CheckUtility, _graphID: string): CheckFun0 {
        return () => {
            const steps = t.getTotalStepsExecuted();
            const reason =
                `Expected ${this.negated ? "no more than" : "at least"} ${this._steps} steps ` +
                `since the program started, but got ${steps}`;
            return result(this._steps <= steps, reason, this.negated);
        };
    }
}
