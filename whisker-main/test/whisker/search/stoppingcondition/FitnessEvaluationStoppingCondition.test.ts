import {StatisticsCollector} from "../../../../src/whisker/utils/StatisticsCollector";
import {FitnessEvaluationStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FitnessEvaluationStoppingCondition";

describe('Test FitnessEvaluationStoppingCondition', () => {

    test('Stopping condition reached', async () => {
        const maxEvaluations = 100;
        StatisticsCollector.getInstance().numberFitnessEvaluations = 101;
        const stoppingCondition = new FitnessEvaluationStoppingCondition(maxEvaluations);
        expect(await stoppingCondition.isFinishedAsync()).toBeTruthy();
    });

    test('Stopping condition not reached', async () => {
        const maxEvents = 200;
        StatisticsCollector.getInstance().numberFitnessEvaluations = 101;
        const stoppingCondition = new FitnessEvaluationStoppingCondition(maxEvents);
        expect(await stoppingCondition.isFinishedAsync()).toBeFalsy();
    });

    test('Test progress of stopping condition', async () => {
        const maxEvents = 200;
        StatisticsCollector.getInstance().numberFitnessEvaluations = 101;
        const progress = 101 / 200;
        const stoppingCondition = new FitnessEvaluationStoppingCondition(maxEvents);
        expect(await stoppingCondition.getProgressAsync()).toBe(progress);
    });
});
