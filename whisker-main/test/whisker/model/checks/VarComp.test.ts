import {SpriteMock} from "../mocks/SpriteMock";
import {STAGE_NAME} from "../../../../src/assembler/utils/selectors";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {CheckUtilityMock, getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {ComparisonOp} from "../../../../src/whisker/model/checks/CheckTypes";
import {VarComp} from "../../../../src/whisker/model/checks/VarComp";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import {expect} from "@jest/globals";


describe('VarComp tests', () => {
    const graphID = "graphID";
    const stage = new SpriteMock(STAGE_NAME);
    const kiwi = new SpriteMock("kiwi");
    const apple = new SpriteMock("apple");
    const banana = new SpriteMock("banana");
    const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), kiwi, apple, stage]);
    const t = tdMock.getTestDriver();
    const dummyCU = getDummyCheckUtility();
    apple.variables = [{name: "x", value: 2}];
    stage.variables = [{name: "x", value: 10}];
    tdMock.stage = stage.sprite;

    it.each(["someInvalidComparison", "<=>", "<>", "><"])('throws for comparison %s', (cmp: ComparisonOp) => {
        expect(() => new VarComp('label', {args: ["apple", "x", cmp, 3]})).toThrowError();
    });

    test('VarEvent is registered on CheckUtil', () => {
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnVarEvent = fn;
        const cu = cuMock.getCheckUtility();
        const c = new VarComp('label', {args: ["apple", "x", "==", "2"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith(apple.variables[0].name, graphID);
    });

    test('Check works for stage', () => {
        const expected = "10";
        const c = new VarComp('label', {args: [STAGE_NAME, "x", "==", expected]});
        c.registerComponents(t, dummyCU, graphID);
        const res = c.check;
        expect(res()).toStrictEqual(pass());
        const actual = 9;
        stage.variables[0].value = actual;
        const reason = {actual, expected};
        tdMock.nextStep();
        expect(res()).toStrictEqual(fail(reason));
    });
});
