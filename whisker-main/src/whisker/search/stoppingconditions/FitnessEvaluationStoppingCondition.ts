import {Chromosome} from "../Chromosome";
import {StoppingCondition} from "../StoppingCondition";
import {StatisticsCollector} from "../../utils/StatisticsCollector";

export class FitnessEvaluationStoppingCondition<T extends Chromosome> implements StoppingCondition<T> {

    /**
     * The number of fitness evaluations after which the search should be stopped
     */
    private readonly _maxEvaluations: number

    constructor(maxEvaluations: number) {
        this._maxEvaluations = maxEvaluations;
    }

    getProgress(): number {
        return StatisticsCollector.getInstance().numberFitnessEvaluations / this._maxEvaluations;
    }

    isFinished(): boolean {
        return StatisticsCollector.getInstance().numberFitnessEvaluations >= this._maxEvaluations;
    }

    get maxEvaluations(): number {
        return this._maxEvaluations;
    }
}
