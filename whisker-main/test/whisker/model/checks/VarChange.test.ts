import {CheckUtilityMock, getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {STAGE_NAME} from "../../../../src/assembler/utils/selectors";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {VarChange} from "../../../../src/whisker/model/checks/VarChange";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import {expect} from "@jest/globals";


describe('VarChange tests', () => {
    const graphID = "graphID";
    const dummyCU = getDummyCheckUtility();
    const stage = new SpriteMock(STAGE_NAME);
    const oldStage = new SpriteMock(STAGE_NAME);
    const apple = new SpriteMock("apple");
    const banana = new SpriteMock("banana");
    stage.variables = [{name: "Punkte", value: 9, old: {name: "Punkte", value: 10}}];
    stage._old = oldStage;
    apple.variables = [{name: "x", value: 2}];
    const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), apple, stage]);
    tdMock.stage = stage.sprite;
    const t = tdMock.getTestDriver();

    test('VarEvent is registered on CheckUtil', () => {
        const fn = jest.fn();
        const cuMock = new CheckUtilityMock();
        cuMock.registerOnVarEvent = fn;
        const cu = cuMock.getCheckUtility();
        const c = new VarChange('label', {args: ["apple", "x", "+"]});
        c.registerComponents(t, cu, graphID);
        expect(fn).toHaveBeenLastCalledWith(apple.variables[0].name, graphID);
    });

    test('Check works for stage', () => {
        const c = new VarChange('label', {args: [STAGE_NAME, "Punkte", "-"]});
        c.registerComponents(t, dummyCU, graphID);
        expect(c.check()).toEqual(pass());
        stage.variables = [{name: "Punkte", value: 10, old: {name: "Punkte", value: 9}}];
        const reason = {"after": 10, "before": 9};
        tdMock.nextStep();
        expect(c.check()).toEqual(fail(reason));
    });
});
