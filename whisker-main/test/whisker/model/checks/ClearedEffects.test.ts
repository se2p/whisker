import {TestDriverMock} from "../mocks/TestDriverMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {ClearedEffect} from "../../../../src/whisker/model/checks/ClearedEffect";


describe('ClearedEffectsTest', () => {
    const graphID = "graphID";
    const edgeLabel = 'edgeID';
    const cu = getDummyCheckUtility();

    it.each([true, false])('Check for first layer works properly (negated: %s)', (negated: boolean) => {
        const effects: Record<string, number> = {color: 0, fisheye: 0};
        const banana = new SpriteMock("banana", [{name: "effects", value: effects}]);
        const tdMock = new TestDriverMock([banana]);
        const t = tdMock.getTestDriver();
        const check = new ClearedEffect(edgeLabel, {negated: negated, args: ['banana']});
        check.registerComponents(t, cu, graphID);
        expect(check.check()).toEqual(!negated);
    });


    test('Check is not a constant return value', () => {
        const effects: Record<string, number> = {color: 0, fisheye: 0};
        const banana = new SpriteMock("banana", [{name: "effects", value: effects}]);
        const tdMock = new TestDriverMock([banana]);
        const t = tdMock.getTestDriver();
        const check = new ClearedEffect(edgeLabel, {negated: false, args: ['banana']});
        check.registerComponents(t, cu, graphID);
        expect(check.check()).toEqual(true);
        effects["color"] = 10;
        expect(check.check()).toEqual(false);
    });
});
