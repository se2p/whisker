import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {CheckUtilityMock, getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import Sprite from "../../../../src/vm/sprite";
import {CheckResult, fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import {Check} from "../../../../src/whisker/model/checks/newCheck";
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
        let check: (sprite: Sprite) => CheckResult;
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnMoveEvent = (spriteName: string, c: Check, graphID: string,
                                      predicate: (sprite: Sprite) => CheckResult) => {
            fn(spriteName, c, graphID, predicate);
            check = predicate;
        };
        const cu = cuMock.getCheckUtility();
        const c = new SpriteTouching("label", {negated: true, args: ["kiwi", "banana"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(check(kiwi.sprite)).toEqual(fail(expect.any(Object)));
        kiwi.touchingSprite = false;
        expect(check(kiwi.sprite)).toEqual(pass());
    });

    it.each([true, false])('returned function depends on touchingSprite (negated: %s)', (negated: boolean) => {
        banana.touchingSprite = true;
        const c = new SpriteTouching("label", {negated: negated, args: ["banana", "kiwi"]});
        c.registerComponents(t, dummyCU, graphID);
        expect(c.check().passed).toEqual(!negated);
        banana.touchingSprite = false;
        expect(c.check().passed).toEqual(negated);
    });
});
