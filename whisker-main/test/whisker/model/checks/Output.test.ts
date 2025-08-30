import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {Output} from "../../../../src/whisker/model/checks/Output";
import {CheckResult, fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import Sprite from "../../../../src/vm/sprite";
import {Check} from "../../../../src/whisker/model/checks/newCheck";

describe('Output tests', () => {
    const graphID = "graphID";
    const dummyCU = getDummyCheckUtility();
    const banana = new SpriteMock("Banana");
    banana.sayText = "this is some text";
    const kiwi = new SpriteMock("kiwi");
    kiwi.sayText = "this is a text as well";
    const tdMock = new TestDriverMock([banana, kiwi]);
    const t = tdMock.getTestDriver();

    test('Generates check compares actual output correctly', () => {
        const spriteName = "Banana";
        const text = "this is some text";
        const c = new Output('label', {args: [spriteName, text]});
        c.registerComponents(t, dummyCU, graphID);
        expect(c.check()).toStrictEqual(pass());
        banana.sayText = "this is a different text";
        tdMock.currentSprites = [kiwi.updateSprite(), banana.updateSprite()];
        const reason = {"actual": "this is a different text", "expected": "this is some text"};
        expect(c.nonCachedCheck()).toStrictEqual(fail(reason));
    });

    test('Correct predicate is registered at CheckUtility', () => {
        const cu = getDummyCheckUtility();
        const fn = jest.fn();
        let check: (sprite: Sprite) => CheckResult;
        cu.registerOutput = (spriteName: string, c: Check, graphID: string,
                             predicate: (sprite: Sprite) => CheckResult) => {
            fn(spriteName, c, graphID, predicate);
            check = predicate;
        };
        const c = new Output('label', {args: ["kiwi", "this is a text as well"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenCalledWith("kiwi", c, graphID, check);
        expect(check(kiwi.sprite)).toStrictEqual(pass());
        kiwi.sayText = "this is a different text";
        tdMock.currentSprites = [kiwi.updateSprite(), banana.updateSprite()];
        tdMock.nextStep();
        expect(check(kiwi.sprite)).toStrictEqual(fail(expect.any(Object)));
    });
});
