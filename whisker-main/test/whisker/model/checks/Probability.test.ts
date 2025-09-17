import {Probability} from "../../../../src/whisker/model/checks/Probability";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import {getDummyTestDriver, TestDriverMock} from "../mocks/TestDriverMock";

describe('Probability tests', () => {
    const graphID = "graphID";
    const repetitions = 1000;
    test('probability of 1 negated "never" returns true', () => {
        const c = new Probability('label', {negated: true, args: [1]});
        c.registerComponents(getDummyTestDriver(), null, graphID);

        for (let i = 0; i < repetitions; ++i) {
            if (c.check().passed) {
                throw new Error("with a probability of 0 the result of the function should not be true");
            }
        }
    });

    test('probability of 0 always returns false', () => {
        const c = new Probability('label', {args: [0]});
        c.registerComponents(getDummyTestDriver(), null, graphID);

        for (let i = 0; i < repetitions; ++i) {
            if (c.check().passed) {
                throw new Error("with a probability of 0 the result of the function should not be true");
            }
        }
    });

    test('probability of 0.1 returns false more often than true', () => {
        const c = new Probability('label', {args: [0.1]});
        const tdMock = new TestDriverMock();
        c.registerComponents(tdMock.getTestDriver(), null, graphID);

        let trueCount = 0;
        let falseCount = 0;
        for (let i = 0; i < repetitions; ++i) {
            tdMock.nextStep();
            if (c.check().passed) {
                ++trueCount;
            } else {
                ++falseCount;
            }
        }
        expect(trueCount).toBeGreaterThan(0);
        expect(trueCount).toBeLessThan(falseCount / 5);
    });

    test('Calls Randomness.getInstance().nextDouble()', () => {
        jest.mock('../../../../src/whisker/utils/Randomness');
        let value = 0.75;
        Randomness.getInstance = jest.fn().mockReturnValue({
            nextDouble: () => value
        });
        const p = 0.3414;
        const c = new Probability('label', {args: [p]});
        const tdMock = new TestDriverMock();
        c.registerComponents(tdMock.getTestDriver(), null, graphID);
        expect(c.check()).toStrictEqual(fail({}));
        value = 0.1;
        expect(c.check()).toStrictEqual(pass());
        value = 0.42;
        tdMock.nextStep();
        expect(c.check()).toStrictEqual(fail({}));
    });
});
