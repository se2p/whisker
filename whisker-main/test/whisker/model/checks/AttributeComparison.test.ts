import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {AttrComp} from "../../../../src/whisker/model/checks/AttrComp";
import {CheckUtilityMock, getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import {ComparisonOp} from "../../../../src/whisker/model/checks/CheckTypes";
import {STAGE_NAME} from "../../../../src/assembler/utils/selectors";


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
        expect(fn).toHaveBeenLastCalledWith("kiwi", graphID);
    });

    test('OnVisualChange is registered on CheckUtil', () => {
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnVisualChange = fn;
        const cu = cuMock.getCheckUtility();
        const c = new AttrComp('label', {args: ["kiwi", "size", "<", 42]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith("kiwi", graphID);
    });

    test('Output is registered on CheckUtil for changing output', () => {
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOutput = fn;
        const cu = cuMock.getCheckUtility();
        const c = new AttrComp('label', {args: ["kiwi", "sayText", "==", "this is some text"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith("kiwi", graphID);
    });

    test('Output is registered on CheckUtil for changing coordinates', () => {
        const sprite = new SpriteMock("apple", [{name: "x", value: 31415}]);
        const tdMock = new TestDriverMock([sprite]);
        const t = tdMock.getTestDriver();
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnMoveEvent = fn;
        const cu = cuMock.getCheckUtility();
        const c = new AttrComp('label', {args: ["apple", "x", "<=", 42]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith("apple", graphID);
    });

    test('Output is registered on CheckUtil for changing visual', () => {
        const sprite = new SpriteMock(STAGE_NAME);
        sprite._currentCostumeName = "defaultStage";
        const tdMock = new TestDriverMock([sprite]);
        tdMock.stage = sprite.updateSprite();
        const t = tdMock.getTestDriver();
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnVisualChange = fn;
        const cu = cuMock.getCheckUtility();
        const c = new AttrComp('label', {negated: true, args: [STAGE_NAME, "currentCostumeName", "==", "win"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith(STAGE_NAME, graphID);
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
        expect(c.check()).toStrictEqual(negated ? pass() : fail(expect.any(Object)));
    });

    test('Can check value of effects', () => {
        const effects: Record<string, number> = {fisheye: 10};
        const bowl = new SpriteMock("bowl", [{name: "effects", value: effects}]);
        bowl._old = new SpriteMock("bowl", [{name: "effects", value: {fisheye: 0}}]);
        const mock = new TestDriverMock([banana, bowl, apple]);
        const c = new AttrComp('label', {negated: false, args: ["bowl", "fisheye", "==", 25]});
        c.registerComponents(mock.getTestDriver(), getDummyCheckUtility(), graphID);
        expect(c.check()).toStrictEqual(fail(expect.any(Object)));
        effects["fisheye"] = 25;
        expect(c.check()).toEqual(pass());
    });
});
