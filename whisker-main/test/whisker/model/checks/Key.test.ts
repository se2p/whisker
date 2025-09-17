import {CheckUtilityMock} from "../mocks/CheckUtilityMock";
import {Key} from "../../../../src/whisker/model/checks/Key";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import {TestDriverMock} from "../mocks/TestDriverMock";

test("Key test", () => {
    const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
    const cu = cuMock.getCheckUtility();
    const keyCheck = new Key('label', {args: ['a']});
    const tdMock = new TestDriverMock();
    keyCheck.registerComponents(tdMock.getTestDriver(), cu, "graphID");
    cuMock.pressedKeys["a"] = true;
    expect(keyCheck.check()).toStrictEqual(pass());
    cuMock.pressedKeys["a"] = false;
    tdMock.nextStep();
    expect(keyCheck.check()).toStrictEqual(fail({}));
});
