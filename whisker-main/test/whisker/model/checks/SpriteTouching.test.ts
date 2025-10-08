import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {CheckUtilityMock, getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {SpriteTouching} from "../../../../src/whisker/model/checks/SpriteTouching";


describe('SpriteTouching tests', () => {
    const graphID = "graphID";
    const kiwi = new SpriteMock("kiwi");
    const apple = new SpriteMock("apple");
    const banana = new SpriteMock("banana");
    const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), kiwi, apple]);
    const t = tdMock.getTestDriver();
    const dummyCU = getDummyCheckUtility();

    test('cu.registerOnMoveEvent() is called with correct params', () => {
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnMoveEvent = fn;
        const cu = cuMock.getCheckUtility();
        const c = new SpriteTouching("label", {negated: true, args: ["kiwi", "banana"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it.each([true, false])('returned function depends on touchingSprite (negated: %s)', (negated: boolean) => {
        banana.touchingSprite = true;
        const c = new SpriteTouching("label", {negated: negated, args: ["banana", "kiwi"]});
        c.registerComponents(t, dummyCU, graphID);
        expect(c.check().passed).toEqual(!negated);
        banana.touchingSprite = false;
        tdMock.nextStep();
        expect(c.check().passed).toEqual(negated);
    });
});
