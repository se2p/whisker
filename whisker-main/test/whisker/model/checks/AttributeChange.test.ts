import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import Sprite from "../../../../src/vm/sprite";
import {Check} from "../../../../src/whisker/model/checks/newCheck";
import {AttrChange} from "../../../../src/whisker/model/checks/AttrChange";


describe('AttributeChange', () => {
    const graphID = "graphID";
    const dummyCU = getDummyCheckUtility();
    const stage = new SpriteMock("_stage_", [{
        name: "currentCostumeName",
        value: "win",
        old: {name: "currentCostumeName", value: "lose"}
    }]);
    const oldStage = new SpriteMock("_stage_", [{name: "currentCostumeName", value: "lose"}]);
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
        let check: (sprite: Sprite) => boolean;
        cu.registerOnVisualChange = (spriteName: string, c: Check, graphID: string,
                                     predicate: (sprite: Sprite) => boolean) => {
            fn(spriteName, c, graphID, predicate);
            check = predicate;
        };
        const c = new AttrChange('label', {args: ["apple", "size", "+"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith(apple.name, c, graphID, check);
        expect(check(apple.sprite)).toBe(false);
    });

    test('MoveEvent is registered on CheckUtil', () => {
        const fn = jest.fn();
        const cu = getDummyCheckUtility();
        let check: (sprite: Sprite) => boolean;
        cu.registerOnMoveEvent = (spriteName: string, c: Check, graphID: string,
                                  predicate: (sprite: Sprite) => boolean) => {
            fn(spriteName, c, graphID, predicate);
            check = predicate;
        };
        const c = new AttrChange('label', {args: ["apple", "x", "+"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith(apple.name, c, graphID, check);
        expect(check(apple.sprite)).toBe(false);
    });

    test('Check is not a constant function', () => {
        const c = new AttrChange('label', {negated: true, args: ["_stage_", "currentCostume", "="]});
        c.registerComponents(t, dummyCU, graphID);
        expect(c.check()).toEqual(true);
        stage.variables = [{
            name: "currentCostumeName",
            value: "lose",
            old: {name: "currentCostumeName", value: "lose"}
        }];
        tdMock.currentSprites = SpriteMock.toSpriteArray([banana, new SpriteMock("bowl"), apple, stage]);
        expect(c.check()).toEqual(false);
    });
});
