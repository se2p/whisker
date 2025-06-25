import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {NbrOfClones, NbrOfVisibleClones} from "../../../../src/whisker/model/checks/NbrOfClones";
import {pass} from "../../../../src/whisker/model/checks/CheckResult";
import {ComparisonOp} from "../../../../src/whisker/model/checks/CheckTypes";

describe('NbrOfClones test', () => {
    const graphID = "graphID";
    const banana = new SpriteMock("banana");
    banana.clones = [new SpriteMock("banana"), new SpriteMock("banana"), new SpriteMock("banana")];
    const apple = new SpriteMock("apple");
    apple.clones = [
        new SpriteMock("apple"), new SpriteMock("apple"), new SpriteMock("apple"),
        new SpriteMock("apple"), new SpriteMock("apple")
    ];
    const bowl = new SpriteMock("bowl");
    apple.clones[1].visible = false;
    banana.clones[0].visible = false;
    banana.clones[2].visible = false;
    const tdMock = new TestDriverMock([apple, banana, bowl, ...apple.clones, ...banana.clones]);
    const t = tdMock.getTestDriver();
    const table: [string, boolean, number][] = [
        ["banana", true, 2], ["banana", false, 4], ["apple", true, 5], ["apple", false, 6], ["bowl", false, 1]
    ];
    it.each(table)('counts correct amount of %s with visible necessary == %s',
        (name, visible, count) => {
            const c = new (visible ? NbrOfVisibleClones : NbrOfClones)('label', {
                negated: false,
                args: [name, "==", count]
            });
            c.registerComponents(t, null, graphID);
            expect(c.check()).toStrictEqual(pass());
        });

    test('throws exception for invalid comparison', () => {
        expect(() => new NbrOfClones('label', {
            negated: true,
            args: ["banana", "<=>" as ComparisonOp, 10]
        })).toThrowError();
    });
});
