import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {Output} from "../../../../src/whisker/model/checks/Output";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";

describe('Output tests', () => {
    const graphID = "graphID";
    const dummyCU = getDummyCheckUtility();
    const banana = new SpriteMock("Banana");
    banana._sayText = "this is some text";
    const kiwi = new SpriteMock("kiwi");
    kiwi._sayText = "this is a text as well";
    const tdMock = new TestDriverMock([banana, kiwi]);
    const t = tdMock.getTestDriver();

    test('Generates check compares actual output correctly', () => {
        const spriteName = "Banana";
        const text = "this is some text";
        const c = new Output('label', {args: [spriteName, text]});
        c.registerComponents(t, dummyCU, graphID);
        expect(c.check()).toStrictEqual(pass());
        banana._sayText = "this is a different text";
        tdMock.currentSprites = [kiwi.updateSprite(), banana.updateSprite()];
        const reason = {"actual": "this is a different text", "expected": "this is some text"};
        tdMock.nextStep();
        expect(c.check()).toStrictEqual(fail(reason));
    });

    test('Is registered at CheckUtility', () => {
        const cu = getDummyCheckUtility();
        const fn = jest.fn();
        cu.registerOutput = fn;
        const c = new Output('label', {args: ["kiwi", "this is a text as well"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenCalledWith("kiwi", graphID);
    });
});
