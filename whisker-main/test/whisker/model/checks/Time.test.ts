import {TestDriverMock} from "../mocks/TestDriverMock";
import VMWrapper from "../../../../src/vm/vm-wrapper";
import {TimeAfterEnd, TimeBetween, TimeElapsed} from "../../../../src/whisker/model/checks/Time";
import {CheckResult, fail, pass} from "../../../../src/whisker/model/checks/CheckResult";

test('TimeElapsed test', () => {
    const graphID = "graphID";
    const tdMock = new TestDriverMock();
    const t = tdMock.getTestDriver();
    VMWrapper.convertFromTimeToSteps = (steps: number) => steps / 10;
    const c = new TimeElapsed('label', {args: [1230]});
    c.registerComponents(t, null, graphID);
    tdMock.totalStepsExecuted = 122;
    const reason = {"actual": 122, "expected": 123};
    expect(c.check()).toStrictEqual(fail(reason));
    tdMock.totalStepsExecuted = 123;
    expect(c.check()).toStrictEqual(pass());
    tdMock.totalStepsExecuted = 1000;
    expect(c.check()).toStrictEqual(pass());
});

test('TimeBetween test', () => {
    const graphID = "graphID";
    const tdMock = new TestDriverMock();
    const t = tdMock.getTestDriver();
    VMWrapper.convertFromTimeToSteps = (steps: number) => steps / 10;
    const c = new TimeBetween('label', {args: [3760]});
    c.registerComponents(t, null, graphID);
    const reason = {"actual": 375, "expected": 376};
    expect(c.check(375)).toStrictEqual(fail(reason));
    expect(c.check(376)).toStrictEqual(pass());
    expect(c.check(12371298)).toStrictEqual(pass());
});

describe('TimeAfterEnd tests', () => {
    const graphID = "graphID";
    const tdMock = new TestDriverMock();
    const t = tdMock.getTestDriver();
    VMWrapper.convertFromTimeToSteps = (steps: number) => steps / 100;
    const c = new TimeAfterEnd('label', {args: [68800]});
    c.registerComponents(t, null, graphID);
    const table: [CheckResult, number, number, number][] = [
        [fail({"actual": 687, "expected": 688, "stepsSinceEnd": 0, "total": 687}), 0, 687, 123],
        [fail({"actual": 687, "expected": 688, "stepsSinceEnd": 213, "total": 900}), 213, 900, 456],
        [pass(), 312, 1000, 789],
        [pass(), 4538, 10000, 10]
    ];
    it.each(table)('getTimeAfterEndCheck returns %s for %s steps after end and %s total steps',
        (expected, afterEnd, total, sinceLastTransition) => {
            tdMock.totalStepsExecuted = total;
            expect(c.check(sinceLastTransition, afterEnd)).toStrictEqual(expected);
        });
});
