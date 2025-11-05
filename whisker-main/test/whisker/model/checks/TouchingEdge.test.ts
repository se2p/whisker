import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {TouchingEdge, TouchingHorizEdge, TouchingVerticalEdge} from "../../../../src/whisker/model/checks/TouchingEdge";
import {fail, pass} from "../../../../src/whisker/model/checks/CheckResult";

describe('TouchingEdge tests', () => {
    const graphID = "graphID";
    const sprite = new SpriteMock("apple");
    sprite.visible = true;
    const tdMock = new TestDriverMock([sprite]);
    const t = tdMock.getTestDriver();
    const cu = getDummyCheckUtility();
    const label = "label";
    const negated = false;

    test('Touching only HorizontalEdgeCheck', () => {
        const c = new TouchingHorizEdge(label, {negated, args: [sprite._name]});
        c.registerComponents(t, cu, graphID);
        sprite.touchingVerticalEdge = true;
        sprite.touchingHorizontalEdge = false;
        expect(c.check()).toStrictEqual(fail({}));
        sprite.touchingHorizontalEdge = true;
        expect(c.check()).toStrictEqual(pass());
        sprite.touchingVerticalEdge = false;
        expect(c.check()).toStrictEqual(pass());
    });

    test('Touching only VerticalEdgeCheck', () => {
        const c = new TouchingVerticalEdge(label, {negated, args: [sprite._name]});
        c.registerComponents(t, cu, graphID);
        sprite.touchingVerticalEdge = false;
        sprite.touchingHorizontalEdge = true;
        expect(c.check()).toStrictEqual(fail({}));
        sprite.touchingVerticalEdge = true;
        expect(c.check()).toStrictEqual(pass());
        sprite.touchingHorizontalEdge = false;
        expect(c.check()).toStrictEqual(pass());
    });

    test('Touching any edge', () => {
        const c = new TouchingEdge(label, {negated, args: [sprite._name]});
        c.registerComponents(t, cu, graphID);
        sprite.touchingVerticalEdge = false;
        sprite.touchingHorizontalEdge = false;
        expect(c.check()).toStrictEqual(fail({}));
        sprite.touchingVerticalEdge = true;
        expect(c.check()).toStrictEqual(pass());
        sprite.touchingVerticalEdge = false;
        sprite.touchingHorizontalEdge = true;
        expect(c.check()).toStrictEqual(pass());
        sprite.touchingVerticalEdge = true;
        expect(c.check()).toStrictEqual(pass());
    });
});
