import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {STAGE_NAME} from "../../../../src/assembler/utils/selectors";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {BackgroundChange} from "../../../../src/whisker/model/checks/BackgroundChange";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";

test('BackgroundChange test', () => {
    const graphID = "graphID";
    const dummyCU = getDummyCheckUtility();
    const expected = "win";
    const stage = new SpriteMock(STAGE_NAME, [{name: "currentCostumeName", value: expected}]);
    const tdMock = new TestDriverMock([stage]);
    tdMock.stage = stage.sprite;
    const t = tdMock.getTestDriver();
    const c = new BackgroundChange('label', {args: [expected]});
    c.registerComponents(t, dummyCU, graphID);
    expect(c.check()).toStrictEqual(pass());
    const actual = "lose";
    stage.variables = [{name: "currentCostumeName", value: actual}];
    tdMock.currentSprites = SpriteMock.toSpriteArray([stage]);
    tdMock.stage = stage.sprite;
    const reason = {"actual": "lose", "expected": "win"};
    tdMock.nextStep();
    expect(c.check()).toStrictEqual(fail(reason));
});
