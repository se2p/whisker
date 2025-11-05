import {TestDriverMock} from "../mocks/TestDriverMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {PointsTo} from "../../../../src/whisker/model/checks/PointsTo";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";


describe('PointsToTest', () => {
    const graphID = "graphID";
    const edgeLabel = 'edgeID';
    const mocks = [
        new SpriteMock("banana", [{name: "x", value: 10}, {name: "y", value: 10}, {
            name: "direction",
            value: 135
        }, {name: "rotationStyle", value: "All round"}]),
        new SpriteMock("banana", [{name: "x", value: 10}, {name: "y", value: 10}, {
            name: "direction",
            value: 135
        }, {name: "rotationStyle", value: "All round"}]),
        new SpriteMock("bowl", [{name: "x", value: 0}, {name: "y", value: 0}, {
            name: "direction",
            value: 45
        }, {name: "rotationStyle", value: "All round"}]),
        new SpriteMock("bowl", [{name: "x", value: 0}, {name: "y", value: 0}, {
            name: "direction",
            value: 45
        }, {name: "rotationStyle", value: "All round"}])
    ];
    mocks[0]._old = mocks[1];
    mocks[1]._original = false;
    mocks[2]._old = mocks[3];
    mocks[3]._original = false;
    const cu = getDummyCheckUtility();
    const tdMock = new TestDriverMock(mocks);
    const t = tdMock.getTestDriver();

    it.each([true, false])('Check for 2 sprites works properly (negated: %s)', (negated: boolean) => {
        const check = new PointsTo(edgeLabel, {negated: negated, args: ['bowl', 'banana']});
        check.registerComponents(t, cu, graphID);
        expect(check.check()).toStrictEqual(negated ? fail(expect.any(Object)) : pass());
    });

    it.each([true, false])('Check for sprites points to mouse works properly (negated: %s)', (negated: boolean) => {
        const check = new PointsTo(edgeLabel, {negated: negated, args: ['banana', '_mouse_']});
        check.registerComponents(t, cu, graphID);
        tdMock.mousePos = {x: 20, y: 0};
        expect(check.check()).toStrictEqual(negated ? fail(expect.any(Object)) : pass());
    });

    test('Check is not a constant return value', () => {
        const check = new PointsTo(edgeLabel, {negated: false, args: ['banana', '_mouse_']});
        check.registerComponents(t, cu, graphID);
        tdMock.mousePos = {x: 20, y: 0};
        expect(check.check()).toStrictEqual(pass());
        tdMock.mousePos = {x: -20, y: 100};
        tdMock.nextStep();
        expect(check.check()).toStrictEqual(fail(expect.any(Object)));
    });
});
