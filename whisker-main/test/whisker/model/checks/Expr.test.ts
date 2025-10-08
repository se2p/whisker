import {SpriteMock} from "../mocks/SpriteMock";
import {STAGE_NAME} from "../../../../src/assembler/utils/selectors";
import {getDummyTestDriver, TestDriverMock} from "../mocks/TestDriverMock";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {Expr} from "../../../../src/whisker/model/checks/Expr";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import {expect} from "@jest/globals";
import {getStorageValue, initialiseStorage, setStorageValue} from "../../../../src/whisker/model/util/ModelUtil";

describe('Expr tests', () => {
    const graphID = "graphID";
    const boat = new SpriteMock("Boat", [{name: "x", value: 42}, {name: "speed", value: 100}]);
    const gate = new SpriteMock("Gate", [{name: "size", value: 3}]);
    const stage = new SpriteMock(STAGE_NAME, [{name: "direction", value: 140}, {name: "score", value: 10}]);
    const tdMock = new TestDriverMock([boat, gate, stage]);
    const cu = getDummyCheckUtility();
    tdMock.stage = stage.sprite;
    const t = tdMock.getTestDriver();
    const expr = "$('Boat', 'x').toString()+(-1*Math.sqrt($('Boat', 'speed', true))).toString() == '42-10' && 3*($('Gate', 'size')+2) < (2*($('_stage_', 'score', true)-1)+10)/1.5";

    test('returned check is correct', () => {
        const c = new Expr('label', {args: [expr]});
        c.registerComponents(t, cu, graphID);
        expect(c.check()).toStrictEqual(pass());
    });

    test('onMove dependencies are correct', () => {
        const cu = getDummyCheckUtility();
        const moveEvent = jest.fn();
        cu.registerOnMoveEvent = moveEvent;
        const c = new Expr('label', {args: [expr]});
        c.registerComponents(t, cu, graphID);
        expect(moveEvent).toHaveBeenCalledTimes(1);
        expect(moveEvent).toHaveBeenCalledWith("Boat", graphID);
    });

    test('variable dependencies are correct', () => {
        const cu = getDummyCheckUtility();
        const varEvent = jest.fn();
        cu.registerVarEvent = varEvent;
        const c = new Expr('label', {args: [expr]});
        c.registerComponents(t, cu, graphID);
        expect(varEvent).toHaveBeenCalledTimes(2);
        expect(varEvent).toHaveBeenCalledWith("speed", graphID);
        expect(varEvent).toHaveBeenCalledWith("score", graphID);
    });

    test('onVisual dependencies are correct', () => {
        const cu = getDummyCheckUtility();
        const visualEvent = jest.fn();
        cu.registerOnVisualChange = visualEvent;
        const c = new Expr('label', {args: [expr]});
        c.registerComponents(t, cu, graphID);
        expect(visualEvent).toHaveBeenCalledTimes(1);
        expect(visualEvent).toHaveBeenCalledWith("Gate", graphID);
    });

    it.each([[false, false], [false, true], [true, false], [true, true]])(
        'Returns constant function for negated: %s, param: %s', (negated, value) => {
            const c = new Expr('label', {negated, args: [String(value)]});
            c.registerComponents(getDummyTestDriver(), null, graphID);
            expect(c.check().passed).toBe(negated ? !value : value);
        });

    test('Can use TestDriver instead of $-function', () => {
        const apple = new SpriteMock("apple");
        const kiwi = new SpriteMock("kiwi");
        const tdMock = new TestDriverMock([apple, kiwi]);
        const cu = getDummyCheckUtility();
        const fn = "t.getSprites(s => s.name == 'apple').length == 1";
        const c = new Expr('label', {args: [fn]});
        c.registerComponents(tdMock.getTestDriver(), cu, graphID);
        expect(c.check()).toStrictEqual(pass());
        tdMock.currentSprites = [kiwi.sprite];
        tdMock.nextStep();
        expect(c.check()).toStrictEqual(fail({}));
    });

    test('Registers correct predicate at CheckUtility', () => {
        const apple = new SpriteMock("apple", [{name: "sayText", value: "I am an apple"}]);
        const tdMock = new TestDriverMock([apple]);
        const mock = jest.fn();
        const cu = getDummyCheckUtility();
        cu.registerOutput = mock;
        const fn = "t.getSprite('apple').sayText == 'I am an apple'";
        const c = new Expr('label', {args: [fn]});
        c.registerComponents(tdMock.getTestDriver(), cu, graphID);
        expect(mock).toHaveBeenCalledWith("apple", graphID);
    });

    test('Can write with $$-function', () => {
        const graphID = "someGraphID1232103i123";
        const key = "someKey";
        const expectedValue = "someValue";
        initialiseStorage(graphID, new Map<string, unknown>());
        setStorageValue(graphID, key, "someOtherValue");
        expect(getStorageValue(graphID, key)).toBe("someOtherValue");
        const c = new Expr('label', {args: [`$$('${key}', '${expectedValue}')`]});
        c.registerComponents(t, cu, graphID);
        c.check();
        expect(getStorageValue(graphID, key)).toBe(expectedValue);
    });

    test('Can read with $$-function', () => {
        const graphID = "someGraphID122394239423";
        const key = "someKey";
        const expectedValue = "someValue";
        initialiseStorage(graphID, new Map<string, unknown>());
        setStorageValue(graphID, key, expectedValue);
        const c = new Expr('label', {args: [`$$('${key}')==='${expectedValue}'`]});
        c.registerComponents(t, cu, graphID);
        let res = c.check();
        expect(res).toStrictEqual(pass());
        setStorageValue(graphID, key, "someOtherValue");
        tdMock.nextStep();
        res = c.check();
        expect(res).toStrictEqual(fail({someKey: "someOtherValue"}));
    });

    test('Can use ModelUtil functions', () => {
        let c = new Expr('label', {args: ["checkCyclicValueWithinDelta(120, 122, -180, 180, 3)"]});
        c.registerComponents(t, cu, graphID);
        expect(c.check()).toStrictEqual(pass());
        c = new Expr('label', {args: ["checkCyclicValueWithinDelta(120, 124, -180, 180, 3)"]});
        c.registerComponents(t, cu, graphID);
        expect(c.check()).toStrictEqual(fail({}));
    });
});
