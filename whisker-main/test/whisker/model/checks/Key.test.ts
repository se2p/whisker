import {CheckUtilityMock} from "../mocks/CheckUtilityMock";
import {Key} from "../../../../src/whisker/model/checks/Key";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";

test("Key test", () => {
    const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
    const cu = cuMock.getCheckUtility();
    const keyCheck = new Key('label', {args: ['a']});
    keyCheck.registerComponents(null, cu, "graphID");
    cuMock.pressedKeys["a"] = true;
    expect(keyCheck.check()).toStrictEqual(pass());
    cuMock.pressedKeys["a"] = false;
    expect(keyCheck.check()).toStrictEqual(fail({}));
});
