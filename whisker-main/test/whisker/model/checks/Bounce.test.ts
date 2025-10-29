import {Bounce} from "../../../../src/whisker/model/checks/Bounce";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {SpriteMock} from "../mocks/SpriteMock";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {expect} from "@jest/globals";

describe('Bounce tests', () => {

    const table: [string, number, number, boolean, boolean, boolean][] = [
        ["bounce on vertical with direction 35", 35, -35, true, false, true],
        ["bounce on vertical with direction -35", -35, 35, true, false, true],
        ["bounce on vertical with direction -35 (2)", -35, 145, true, false, false],
        ["bounce on horizontal with direction 35", 35, 145, false, true, true],
        ["bounce on horizontal with direction -115", -115, -65, false, true, true],
    ];

    it.each(table)('%s', (name, oldDir, dir, vertical, horizontal, expected) => {
        const oldSprite = new SpriteMock("s1", [{name: "direction", value: oldDir}]);
        const sprite = new SpriteMock("s1", [{name: "direction", value: dir}]);
        sprite._old = oldSprite;
        sprite.touchingVerticalEdge = vertical;
        sprite.touchingHorizontalEdge = horizontal;
        const tdMock = new TestDriverMock([sprite]);
        const check = new Bounce("label", {args: [sprite._name]});
        check.registerComponents(tdMock.getTestDriver(), getDummyCheckUtility(), "graphID");
        const res = check.check();
        if (res.passed !== expected) {
            // at this point, the test should fail
            if (res.passed === false) {
                // there are insights on the test failure, so use those.
                expect(res.reason).toBe({direction: dir, oldDirection: oldDir});
            }
            expect(res.passed).toBe(expected);// no insights so use the normal way to make the test fail
        }
    });
});
