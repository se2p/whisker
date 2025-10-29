import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {AttrChange} from "../../../../src/whisker/model/checks/AttrChange";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import {STAGE_NAME} from "../../../../src/assembler/utils/selectors";


describe('AttributeChange', () => {
    const graphID = "graphID";
    const dummyCU = getDummyCheckUtility();
    const stage = new SpriteMock(STAGE_NAME, [{
        name: "currentCostumeName",
        value: "win",
        old: {name: "currentCostumeName", value: "lose"}
    }]);
    const oldStage = new SpriteMock(STAGE_NAME, [{name: "currentCostumeName", value: "lose"}]);
    const apple = new SpriteMock("apple", [{name: "x", value: 2}, {name: "size", value: 10}]);
    apple._old = new SpriteMock("apple", [{name: "x", value: 42}, {name: "size", value: 20}]);
    const banana = new SpriteMock("banana");
    stage._old = oldStage;
    const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), apple, stage]);
    tdMock.stage = stage.sprite;
    const t = tdMock.getTestDriver();

    test('VarEvent is registered on CheckUtil', () => {
        const fn = jest.fn();
        const cu = getDummyCheckUtility();
        cu.registerOnVisualChange = fn;
        const c = new AttrChange('label', {args: ["apple", "size", "+"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith(apple._name, graphID);
    });

    test('MoveEvent is registered on CheckUtil', () => {
        const fn = jest.fn();
        const cu = getDummyCheckUtility();
        cu.registerOnMoveEvent = fn;
        const c = new AttrChange('label', {args: ["apple", "x", "+"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith(apple.name, graphID);
    });

    test('Check is not a constant function', () => {
        const c = new AttrChange('label', {negated: true, args: [STAGE_NAME, "currentCostumeName", "=="]});
        c.registerComponents(t, dummyCU, graphID);
        expect(c.check()).toStrictEqual(pass());
        stage.variables = [{
            name: "currentCostumeName",
            value: "lose",
            old: {name: "currentCostumeName", value: "lose"}
        }];
        tdMock.currentSprites = SpriteMock.toSpriteArray([banana, new SpriteMock("bowl"), apple, stage]);
        tdMock.nextStep();
        expect(c.check()).toStrictEqual(fail(expect.any(Object)));
    });

    test('Can check change of effects', () => {
        const effects: Record<string, number> = {color: 10};
        const bowl = new SpriteMock("bowl", [{name: "effects", value: effects}]);
        bowl._old = new SpriteMock("bowl", [{name: "effects", value: {color: 0}}]);
        const mock = new TestDriverMock([banana, bowl, apple, stage]);
        const c = new AttrChange('label', {negated: false, args: ["bowl", "color", 10]});
        c.registerComponents(mock.getTestDriver(), dummyCU, graphID);
        expect(c.check()).toStrictEqual(pass());
        effects["color"] = 20;
        mock.nextStep();
        expect(c.check()).toStrictEqual(fail(expect.any(Object)));
    });

    test('Direction can wrap around border', () => {
        const gate = new SpriteMock("gate", [{name: "direction", value: 177}]);
        gate._old = new SpriteMock("gate", [{name: "direction", value: -174}]);
        const mock = new TestDriverMock([gate]);
        const c = new AttrChange('label', {negated: false, args: ["gate", "direction", -9]});
        c.registerComponents(mock.getTestDriver(), dummyCU, graphID);
        expect(c.check()).toStrictEqual(pass());
    });
});
