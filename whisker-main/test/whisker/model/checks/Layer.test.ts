import {TestDriverMock} from "../mocks/TestDriverMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {Layer} from "../../../../src/whisker/model/checks/Layer";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";


describe('LayerTest', () => {
    const graphID = "graphID";
    const edgeLabel = 'edgeID';
    const mocks = [
        new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("kiwi"),
        new SpriteMock("apple"), new SpriteMock("pineapple")
    ];
    for (let i = 0; i < mocks.length; i++) {
        mocks[i].variables = [{name: "layerOrder", value: i + 1}];
    }
    const tdMock = new TestDriverMock(mocks);
    const t = tdMock.getTestDriver();
    const cu = getDummyCheckUtility();

    it.each([true, false])('Check for first layer works properly (negated: %s)', (negated: boolean) => {
        const check = new Layer(edgeLabel, {negated: negated, args: ['pineapple', 'First']});
        check.registerComponents(t, cu, graphID);
        expect(check.check()).toStrictEqual(negated ? fail(expect.any(Object)) : pass());
    });

    it.each([true, false])('Check for last layer works properly (negated: %s)', (negated: boolean) => {
        const check = new Layer(edgeLabel, {negated: negated, args: ['banana', 'Last']});
        check.registerComponents(t, cu, graphID);
        expect(check.check()).toStrictEqual(negated ? fail(expect.any(Object)) : pass());
    });

    test('Check is not a constant return value', () => {
        const tdm = new TestDriverMock(mocks);
        const td = tdm.getTestDriver();
        const check = new Layer(edgeLabel, {negated: false, args: ['pineapple', 'First']});
        check.registerComponents(td, cu, graphID);
        expect(check.check()).toStrictEqual(pass());
        const newSprite = new SpriteMock("firstSprite");
        newSprite.variables = [{name: "layerOrder", value: 100}];
        tdm.currentSprites = SpriteMock.toSpriteArray([...mocks, newSprite]);
        tdm.nextStep();
        expect(check.check()).toStrictEqual(fail(expect.any(Object)));
    });
});
