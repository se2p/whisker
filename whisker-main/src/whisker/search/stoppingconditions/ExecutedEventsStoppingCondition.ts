import {Chromosome} from "../Chromosome";
import {StoppingCondition} from "../StoppingCondition";
import {StatisticsCollector} from "../../utils/StatisticsCollector";

export class ExecutedEventsStoppingCondition<T extends Chromosome> implements StoppingCondition<T> {

    /**
     * The number of executed events after which the search should be stopped
     */
    private readonly _maxEvents: number

    constructor(maxEvents: number) {
        this._maxEvents = maxEvents;
    }

    getProgress(): number {
        return StatisticsCollector.getInstance().eventsCount / this._maxEvents;
    }

    isFinished(): boolean {
        return StatisticsCollector.getInstance().eventsCount >= this._maxEvents;
    }
}
