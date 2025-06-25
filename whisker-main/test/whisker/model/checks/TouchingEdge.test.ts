import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {TouchingEdge, TouchingHorizEdge, TouchingVerticalEdge} from "../../../../src/whisker/model/checks/TouchingEdge";
import {CheckResult, fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import Sprite from "../../../../src/vm/sprite";
import {Check} from "../../../../src/whisker/model/checks/newCheck";

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
        const c = new TouchingHorizEdge(label, {negated, args: [sprite.name]});
        c.registerComponents(t, cu, graphID);
        sprite.touchingVerticalEdge = true;
        sprite.touchingHorizontalEdge = false;
        const reason = {message: `Expected sprite "${sprite.name}" to touch a horizontal edge`};
        expect(c.check()).toStrictEqual(fail(reason));
        sprite.touchingHorizontalEdge = true;
        expect(c.check()).toStrictEqual(pass());
        sprite.touchingVerticalEdge = false;
        expect(c.check()).toStrictEqual(pass());
    });

    test('Touching only VerticalEdgeCheck', () => {
        const c = new TouchingVerticalEdge(label, {negated, args: [sprite.name]});
        c.registerComponents(t, cu, graphID);
        sprite.touchingVerticalEdge = false;
        sprite.touchingHorizontalEdge = true;
        const reason = {message: `Expected sprite "${sprite.name}" to touch a vertical edge`};
        expect(c.check()).toStrictEqual(fail(reason));
        sprite.touchingVerticalEdge = true;
        expect(c.check()).toStrictEqual(pass());
        sprite.touchingHorizontalEdge = false;
        expect(c.check()).toStrictEqual(pass());
    });

    test('Touching any edge', () => {
        const c = new TouchingEdge(label, {negated, args: [sprite.name]});
        c.registerComponents(t, cu, graphID);
        sprite.touchingVerticalEdge = false;
        sprite.touchingHorizontalEdge = false;
        const reason = {message: `Expected sprite "${sprite.name}" to touch an edge`};
        expect(c.check()).toStrictEqual(fail(reason));
        sprite.touchingVerticalEdge = true;
        expect(c.check()).toStrictEqual(pass());
        sprite.touchingVerticalEdge = false;
        sprite.touchingHorizontalEdge = true;
        expect(c.check()).toStrictEqual(pass());
        sprite.touchingVerticalEdge = true;
        expect(c.check()).toStrictEqual(pass());
    });

    test('Predicate for CheckUtility is correct', () => {
        let check: (sprite: Sprite) => CheckResult;
        const cu = getDummyCheckUtility();
        const fn = jest.fn();
        cu.registerOnMoveEvent = (spriteName: string, c: Check, graphID: string,
                                  predicate: (sprite: Sprite) => CheckResult): void => {
            fn();
            check = predicate;
        };
        const c = new TouchingEdge(label, {negated, args: [sprite.name]});
        c.registerComponents(t, cu, graphID);
        sprite.touchingVerticalEdge = false;
        sprite.touchingHorizontalEdge = false;
        expect(fn).toHaveBeenCalledTimes(1);
        expect(check(sprite.sprite)).toStrictEqual(fail(expect.any(Object)));
        sprite.touchingHorizontalEdge = true;
        sprite.touchingVerticalEdge = true;
        expect(check(sprite.sprite)).toStrictEqual(pass());
        sprite.visible = false;
        sprite.updateSprite();
        expect(check(sprite.sprite)).toStrictEqual(fail(expect.any(Object)));
    });
});
