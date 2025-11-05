import {TestDriverMock} from "../mocks/TestDriverMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {expect} from "@jest/globals";
import {MoveSteps} from "../../../../src/whisker/model/checks/MoveSteps";

describe('Move steps tests', () => {

    const table: [number, number, number, number, number, number, boolean][] = [
        [10, 0, 0, 0, 0, 10, true],
        [10, 0, 0, 0, 5, 10, false], // also 5 steps in y direction so absolute distance > 5+epsilon
        [20, 180, -12, 23, -12, 3, true],
        [20, 180, -12, 23, -12, 4, false], // only 19 steps in y direction so less than 20-epsilon = 19.1
        [-30, 122, 10, -12, -15, 4, true],
        [87, 39, -120, -69, -66, -1, true],
    ];

    it.each(table)('move %s steps', (steps, dir, oldX, oldY, x, y, expected) => {
        const oldSprite = new SpriteMock("s1", [
            {name: "x", value: oldX}, {name: "y", value: oldY}, {name: "direction", value: dir}
        ]);
        const sprite = new SpriteMock(oldSprite._name, [
            {name: "x", value: x}, {name: "y", value: y}, {name: "direction", value: dir}
        ]);
        sprite._old = oldSprite;
        const tdMock = new TestDriverMock([sprite]);
        const check = new MoveSteps("label", {args: [sprite._name, steps]});
        check.registerComponents(tdMock.getTestDriver(), getDummyCheckUtility(), "graphID");
        const res = check.check();
        if (res.passed !== expected) {
            // at this point, the test should fail
            if (res.passed === false) {
                // there are insights on the test failure, so use those.
                expect(res.reason).toBe({expectedDistance: steps, oldDirection: dir});
            }
            expect(res.passed).toBe(expected);// no insights so use the normal way to make the test fail
        }
    });
});
