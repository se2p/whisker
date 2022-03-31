import {StatisticsCollector} from "../../../../src/whisker/utils/StatisticsCollector";
import {FitnessEvaluationStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FitnessEvaluationStoppingCondition";

describe('Test FitnessEvaluationStoppingCondition', () => {

    test('Stopping condition reached', async () => {
        const maxEvaluations = 100;
        StatisticsCollector.getInstance().numberFitnessEvaluations = 101;
        const stoppingCondition = new FitnessEvaluationStoppingCondition(maxEvaluations);
        expect(await stoppingCondition.isFinished()).toBeTruthy();
    });

    test('Stopping condition not reached', async () => {
        const maxEvents = 200;
        StatisticsCollector.getInstance().numberFitnessEvaluations = 101;
        const stoppingCondition = new FitnessEvaluationStoppingCondition(maxEvents);
        expect(await stoppingCondition.isFinished()).toBeFalsy();
    });

    test('Test progress of stopping condition', async () => {
        const maxEvents = 200;
        StatisticsCollector.getInstance().numberFitnessEvaluations = 101;
        const progress = 101 / 200;
        const stoppingCondition = new FitnessEvaluationStoppingCondition(maxEvents);
        expect(await stoppingCondition.getProgress()).toBe(progress);
    });
});
