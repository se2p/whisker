import {TestDriverMock} from "../mocks/TestDriverMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {PointsTo} from "../../../../src/whisker/model/checks/PointsTo";


describe('PointsToTest', () => {
    const graphID = "graphID";
    const edgeLabel = 'edgeID';
    const mocks = [
        new SpriteMock("banana", [{name: "x", value: 10}, {name: "y", value: 10}, {
            name: "direction",
            value: 135
        }, {name: "rotationStyle", value: "All round"}]),
        new SpriteMock("bowl", [{name: "x", value: 0}, {name: "y", value: 0}, {
            name: "direction",
            value: 45
        }, {name: "rotationStyle", value: "All round"}])
    ];
    const cu = getDummyCheckUtility();
    const tdMock = new TestDriverMock(mocks);
    const t = tdMock.getTestDriver();

    it.each([true, false])('Check for 2 sprites works properly (negated: %s)', (negated: boolean) => {
        const check = new PointsTo(edgeLabel, {negated: negated, args: ['bowl', 'banana']});
        check.registerComponents(t, cu, graphID);
        expect(check.check()).toEqual(!negated);
    });

    it.each([true, false])('Check for sprites points to mouse works properly (negated: %s)', (negated: boolean) => {
        const check = new PointsTo(edgeLabel, {negated: negated, args: ['banana', '_mouse_']});
        check.registerComponents(t, cu, graphID);
        tdMock.mousePos = {x: 20, y: 0};
        expect(check.check()).toEqual(!negated);
    });

    test('Check is not a constant return value', () => {
        const check = new PointsTo(edgeLabel, {negated: false, args: ['banana', '_mouse_']});
        check.registerComponents(t, cu, graphID);
        tdMock.mousePos = {x: 20, y: 0};
        expect(check.check()).toEqual(true);
        tdMock.mousePos = {x: -20, y: 100};
        expect(check.check()).toEqual(false);
    });
});
