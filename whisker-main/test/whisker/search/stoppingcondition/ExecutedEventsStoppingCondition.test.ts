import {StatisticsCollector} from "../../../../src/whisker/utils/StatisticsCollector";
import {ExecutedEventsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/ExecutedEventsStoppingCondition";

describe('Test ExecutedEventsStoppingCondition', () => {

    test('Stopping condition reached', async () => {
        const maxEvents = 100;
        StatisticsCollector.getInstance().eventsCount = 101;
        const stoppingCondition = new ExecutedEventsStoppingCondition(maxEvents);
        expect(await stoppingCondition.isFinished()).toBeTruthy();
    });

    test('Stopping condition not reached', async () => {
        const maxEvents = 200;
        StatisticsCollector.getInstance().eventsCount = 101;
        const stoppingCondition = new ExecutedEventsStoppingCondition(maxEvents);
        expect(await stoppingCondition.isFinished()).toBeFalsy();
    });

    test('Test progress of stopping condition', async () => {
        const maxEvents = 200;
        StatisticsCollector.getInstance().eventsCount = 101;
        const progress = 101 / 200;
        const stoppingCondition = new ExecutedEventsStoppingCondition(maxEvents);
        expect(await stoppingCondition.getProgress()).toBe(progress);
    });
});
