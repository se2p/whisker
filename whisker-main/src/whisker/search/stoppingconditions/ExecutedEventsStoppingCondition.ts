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

    async getProgress(): Promise<number> {
        return StatisticsCollector.getInstance().eventsCount / this._maxEvents;
    }

    async isFinished(): Promise<boolean> {
        return StatisticsCollector.getInstance().eventsCount >= this._maxEvents;
    }
}
