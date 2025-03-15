import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {ComparisonOp} from "../../../../src/whisker/model/checks/Comparison";
import {AttrComp} from "../../../../src/whisker/model/checks/AttrComp";
import {CheckUtilityMock, getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import Sprite from "../../../../src/vm/sprite";
import {Check} from "../../../../src/whisker/model/checks/newCheck";
import {CheckResult, fail, pass} from "../../../../src/whisker/model/checks/CheckResult";


describe('AttributeComparison', () => {
    const graphID = "graphID";
    const kiwi = new SpriteMock("kiwi");
    const apple = new SpriteMock("apple");
    const banana = new SpriteMock("banana");
    const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), kiwi, apple]);
    const t = tdMock.getTestDriver();
    kiwi.variables = [
        {name: "x", value: 2},
        {name: "size", value: 10},
        {name: "sayText", value: "this is some text"}
    ];
    kiwi.updateSprite();

    it.each(["someInvalidComparison", "<=>", "<>", "><"])('throws for comparison %s', (cmp: ComparisonOp) => {
        expect(() => new AttrComp('label', {args: ["kiwi", "size", cmp, 3]})).toThrowError();
    });

    test('OnMoveEvent is registered on CheckUtil', () => {
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnMoveEvent = fn;
        const cu = cuMock.getCheckUtility();
        const c = new AttrComp('label', {args: ["kiwi", "x", "==", 7]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith("kiwi", c, graphID, expect.anything());
    });

    test('OnVisualChange is registered on CheckUtil', () => {
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnVisualChange = fn;
        const cu = cuMock.getCheckUtility();
        const c = new AttrComp('label', {args: ["kiwi", "size", "<", 42]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith("kiwi", c, graphID, expect.anything());
    });

    test('Output is registered on CheckUtil for changing output', () => {
        let check: ((sprite: Sprite) => CheckResult);
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOutput = (spriteName: string, c: Check, graphID: string,
                                 predicate: (sprite: Sprite) => CheckResult) => {
            fn(spriteName, c, graphID, predicate);
            check = predicate;
        };
        const cu = cuMock.getCheckUtility();
        const c = new AttrComp('label', {args: ["kiwi", "sayText", "==", "this is some text"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith("kiwi", c, graphID, check);
        expect(check(kiwi.sprite)).toStrictEqual(pass());
        kiwi.sayText = "the kiwi has nothing to say";
        kiwi.updateSprite();
        expect(check(kiwi.sprite)).toStrictEqual(fail(expect.any(Object)));
    });

    test('Output is registered on CheckUtil for changing coordinates', () => {
        const sprite = new SpriteMock("apple", [{name: "x", value: 31415}]);
        const tdMock = new TestDriverMock([sprite]);
        const t = tdMock.getTestDriver();
        let check: ((sprite: Sprite) => CheckResult);
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnMoveEvent = (spriteName: string, c: Check, graphID: string,
                                      predicate: (sprite: Sprite) => CheckResult) => {
            check = predicate;
            fn(spriteName, c, graphID, predicate);
        };
        const cu = cuMock.getCheckUtility();
        const c = new AttrComp('label', {args: ["apple", "x", "<=", 42]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith("apple", c, graphID, check);
        expect(check(sprite.sprite)).toStrictEqual(fail(expect.any(Object)));
        sprite.variables = [{name: "x", value: 0}];
        sprite.updateSprite();
        expect(check(sprite.sprite)).toStrictEqual(pass());
    });

    test('Output is registered on CheckUtil for changing visual', () => {
        const sprite = new SpriteMock("_stage_");
        sprite.currentCostume = "defaultStage";
        const tdMock = new TestDriverMock([sprite]);
        tdMock.stage = sprite.updateSprite();
        const t = tdMock.getTestDriver();
        const fn = jest.fn();
        let check: ((sprite: Sprite) => CheckResult);
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnVisualChange = (spriteName: string, c: Check, graphID: string,
                                         predicate: (sprite: Sprite) => CheckResult) => {
            check = predicate;
            fn(spriteName, c, graphID, predicate);
        };
        const cu = cuMock.getCheckUtility();
        const c = new AttrComp('label', {negated: true, args: ["_stage_", "currentCostume", "==", "win"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith("_stage_", c, graphID, check);
        expect(check(sprite.sprite)).toStrictEqual(pass());
        sprite.currentCostume = "win";
        sprite.updateSprite();
        expect(check(sprite.sprite)).toStrictEqual(fail(expect.any(Object)));
    });

    it.each([false, true])('Returned function includes original sprite (negated: %s)', (negated) => {
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnMoveEvent = fn;
        const cu = cuMock.getCheckUtility();
        kiwi.clones = [new SpriteMock("kiwi")];
        kiwi.clones[0].variables = [{name: "x", value: 4}];
        kiwi.clones[0].updateSprite();
        const c = new AttrComp('label', {negated, args: ["kiwi", "x", "<", 3]});
        c.registerComponents(t, cu, graphID);
        expect(c.check()).toStrictEqual(negated ? fail(expect.any(Object)) : pass());
    });

    it.each([false, true])('Returned function includes clones (negated: %s)', (negated) => {
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnMoveEvent = fn;
        const cu = cuMock.getCheckUtility();
        kiwi.clones = [new SpriteMock("kiwi"), new SpriteMock("kiwi"), new SpriteMock("kiwi")];
        kiwi.clones[0].variables = [{name: "x", value: 4}];
        kiwi.clones[1].variables = [{name: "x", value: 8}];
        kiwi.clones[2].variables = [{name: "x", value: 16}];
        kiwi.clones.forEach(c => c.updateSprite());
        const c = new AttrComp('label', {negated, args: ["kiwi", "x", ">", 15]});
        c.registerComponents(t, cu, graphID);
        expect(c.check()).toStrictEqual(negated ? fail(expect.any(Object)) : pass());
    });

    test('Can check value of effects', () => {
        const effects: Record<string, number> = {fisheye: 10};
        const bowl = new SpriteMock("bowl", [{name: "effects", value: effects}]);
        bowl.old = new SpriteMock("bowl", [{name: "effects", value: {fisheye: 0}}]);
        const mock = new TestDriverMock([banana, bowl, apple]);
        const c = new AttrComp('label', {negated: false, args: ["bowl", "fisheye", "==", 25]});
        c.registerComponents(mock.getTestDriver(), getDummyCheckUtility(), graphID);
        expect(c.check()).toStrictEqual(fail(expect.any(Object)));
        effects["fisheye"] = 25;
        expect(c.check()).toEqual(pass());
    });
});
