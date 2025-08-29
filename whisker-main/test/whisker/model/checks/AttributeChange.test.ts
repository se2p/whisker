import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import Sprite from "../../../../src/vm/sprite";
import {Check} from "../../../../src/whisker/model/checks/newCheck";
import {AttrChange} from "../../../../src/whisker/model/checks/AttrChange";
import {CheckResult, fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
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
    apple.old = new SpriteMock("apple", [{name: "x", value: 42}, {name: "size", value: 20}]);
    const banana = new SpriteMock("banana");
    stage.old = oldStage;
    const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), apple, stage]);
    tdMock.stage = stage.sprite;
    const t = tdMock.getTestDriver();

    test('VarEvent is registered on CheckUtil', () => {
        const fn = jest.fn();
        const cu = getDummyCheckUtility();
        let check: (sprite: Sprite) => CheckResult;
        cu.registerOnVisualChange = (spriteName: string, c: Check, graphID: string,
                                     predicate: (sprite: Sprite) => CheckResult) => {
            fn(spriteName, c, graphID, predicate);
            check = predicate;
        };
        const c = new AttrChange('label', {args: ["apple", "size", "+"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith(apple.name, c, graphID, check);
        expect(c.check()).toStrictEqual(fail(expect.any(Object)));
    });

    test('MoveEvent is registered on CheckUtil', () => {
        const fn = jest.fn();
        const cu = getDummyCheckUtility();
        let check: (sprite: Sprite) => CheckResult;
        cu.registerOnMoveEvent = (spriteName: string, c: Check, graphID: string,
                                  predicate: (sprite: Sprite) => CheckResult) => {
            fn(spriteName, c, graphID, predicate);
            check = predicate;
        };
        const c = new AttrChange('label', {args: ["apple", "x", "+"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith(apple.name, c, graphID, check);
        expect(c.check()).toStrictEqual(fail(expect.any(Object)));
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
        expect(c.nonCachedCheck()).toStrictEqual(fail(expect.any(Object)));
    });

    test('Can check change of effects', () => {
        const effects: Record<string, number> = {color: 10};
        const bowl = new SpriteMock("bowl", [{name: "effects", value: effects}]);
        bowl.old = new SpriteMock("bowl", [{name: "effects", value: {color: 0}}]);
        const mock = new TestDriverMock([banana, bowl, apple, stage]);
        const c = new AttrChange('label', {negated: false, args: ["bowl", "color", 10]});
        c.registerComponents(mock.getTestDriver(), dummyCU, graphID);
        expect(c.check()).toStrictEqual(pass());
        effects["color"] = 20;
        expect(c.nonCachedCheck()).toStrictEqual(fail(expect.any(Object)));
    });
});
