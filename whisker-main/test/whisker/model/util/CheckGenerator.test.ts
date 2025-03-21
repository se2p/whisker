import {SpriteNotFoundError} from "../../../../src/whisker/model/util/ModelError";
import {SpriteMock} from "../mocks/SpriteMock";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {CheckUtilityMock, getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import VMWrapper from "../../../../src/vm/vm-wrapper";
import Sprite from "../../../../src/vm/sprite";
import {ArgType} from "../../../../src/whisker/model/util/schema";
import {Key} from "../../../../src/whisker/model/checks/Key";
import {Click} from "../../../../src/whisker/model/checks/Click";
import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";
import {SpriteColor} from "../../../../src/whisker/model/checks/SpriteColor";
import {SpriteTouching} from "../../../../src/whisker/model/checks/SpriteTouching";
import {VarComp} from "../../../../src/whisker/model/checks/VarComp";
import {VarChange} from "../../../../src/whisker/model/checks/VarChange";
import {BackgroundChange} from "../../../../src/whisker/model/checks/BackgroundChange";
import {Output} from "../../../../src/whisker/model/checks/Output";
import {NbrOfClones, NbrOfVisibleClones} from "../../../../src/whisker/model/checks/NbrOfClones";
import {Probability} from "../../../../src/whisker/model/checks/Probability";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {Expr} from "../../../../src/whisker/model/checks/Expr";
import {TouchingEdge, TouchingHorizEdge, TouchingVerticalEdge} from "../../../../src/whisker/model/checks/TouchingEdge";
import {TimeAfterEnd, TimeBetween, TimeElapsed} from "../../../../src/whisker/model/checks/Time";
import {Check} from "../../../../src/whisker/model/checks/newCheck";

import {ComparisonOp} from "../../../../src/whisker/model/checks/Comparison";
import {CheckResult, fail, pass} from "../../../../src/whisker/model/checks/CheckResult";
import {STAGE_NAME} from "../../../../src/assembler/utils/selectors";

describe('CheckGenerator', () => {

    const graphID = "graphID";

    describe('getKeyDownCheck()', () => {
        const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
        const cu = cuMock.getCheckUtility();
        const keyCheck = new Key('label', {args: ['a']});
        keyCheck.registerComponents(null, cu, graphID);
        cuMock.pressedKeys["a"] = true;
        expect(keyCheck.check()).toStrictEqual(pass());
        cuMock.pressedKeys["a"] = false;
        expect(keyCheck.check()).toStrictEqual(fail({}));
    });

    describe('getSpriteClickedCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        const edgeLabel = 'edgeID';
        const clickCheck = new Click(edgeLabel, {args: ['banana']});
        const cu = {
            addErrorOutput: jest.fn(),
        } as unknown as CheckUtility;
        clickCheck.registerComponents(t, cu, graphID);

        test('throws exception when no sprite exists', () => {
            tdMock.currentSprites = [];
            clickCheck.check();
            expect(cu.addErrorOutput).toHaveBeenCalledWith(edgeLabel, graphID, new SpriteNotFoundError('banana'));
        });

        test('throws exception when correct sprite does not exist', () => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = [apple.sprite];
            clickCheck.check();
            expect(cu.addErrorOutput).toHaveBeenCalledWith(edgeLabel, graphID, new SpriteNotFoundError('banana'));
        });

        it.each([true, false])('returns correct sprite if possible (negated: %s)', (negated: boolean) => {
            const apple = new SpriteMock("apple");
            const tdMock = new TestDriverMock();
            tdMock.currentSprites = SpriteMock.toSpriteArray([
                new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("kiwi"), apple, new SpriteMock("pineapple")
            ]);

            const clickCheck = new Click(edgeLabel, {negated, args: ['apple']});
            const cu = {
                addErrorOutput: jest.fn(),
            } as unknown as CheckUtility;
            clickCheck.registerComponents(tdMock.getTestDriver(), cu, graphID);

            tdMock.isMouseDown = true;
            apple.touchingMouse = true;
            expect(clickCheck.check().passed).toEqual(!negated);
            apple.touchingMouse = false;
            expect(clickCheck.check().passed).toEqual(negated);
            expect(cu.addErrorOutput).not.toHaveBeenCalled();
        });
    });

    describe('getSpriteColorTouchingCheck()', () => {
        const tdMock = new TestDriverMock();
        tdMock.currentSprites = [new SpriteMock("apple").sprite];
        const dummyCU = getDummyCheckUtility();

        describe('Throws for wrong RGB values', () => {
            const colorsWrongBounds: [ArgType, ArgType, ArgType][] = [
                [-1, 10, 20], [10, -1, 20], [10, 20, -1],
                [256, 10, 42], [1, 1000, 13], [87, 128, 300],
            ];

            const colorsNaN: [ArgType, ArgType, ArgType][] = [
                [undefined, 1, 2], [1, undefined, 2], [3, 4, undefined],
                ["someString", 34, 123], [2, "test", 21], [12, 34, "fiftysix"]
            ];

            it.each(colorsNaN)('getKeyDownThrowsForColors(%d, %d, %d) throws NotANumericalValueError', (r: number, g: number, b: number) => {
                expect(() => new SpriteColor('label', {negated: true, args: ["apple", r, g, b]}))
                    .toThrowError();
            });

            it.each(colorsWrongBounds)('getKeyDownThrowsForColors(%d, %d, %d) throws RGBRangeError', (r: number, g: number, b: number) => {
                expect(() => new SpriteColor('label', {negated: true, args: ["apple", r, g, b]}))
                    .toThrowError();
            });
        });

        test('cu.registerOnMoveEvent() is called with correct params', () => {
            const fn = jest.fn();
            let check: (sprite: Sprite) => CheckResult;
            const cu = getDummyCheckUtility();
            cu.registerOnMoveEvent = (spriteName: string, c: Check, graphID: string,
                                      predicate: (sprite: Sprite) => CheckResult) => {
                fn(spriteName, c, graphID, predicate);
                check = predicate;
            };
            const kiwi = new SpriteMock("kiwi");
            tdMock.currentSprites = SpriteMock.toSpriteArray([
                new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("apple"), kiwi
            ]);
            const c = new SpriteColor('label', {args: ["apple", 255, 0, 0]});
            c.registerComponents(tdMock.getTestDriver(), cu, graphID);
            expect(fn).toHaveBeenCalledTimes(1);
            expect(check(kiwi.sprite)).toEqual(pass());
            kiwi.touchingColor = false;
            expect(check(kiwi.sprite)).toEqual(fail(expect.any(Object)));
        });

        it.each([true, false])('returned function depends on touchingColor (negated: %s)', (negated: boolean) => {
            const kiwi = new SpriteMock("kiwi");
            tdMock.currentSprites = SpriteMock.toSpriteArray([
                new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("apple"), kiwi
            ]);
            kiwi.touchingColor = true;
            const c = new SpriteColor('label', {negated: negated, args: ["kiwi", 255, 128, 64]});
            c.registerComponents(tdMock.getTestDriver(), dummyCU, graphID);
            expect(c.check().passed).toEqual(!negated);
            kiwi.touchingColor = false;
            expect(c.check().passed).toEqual(negated);
        });
    });

    describe('getSpriteTouchingCheck()', () => {
        const kiwi = new SpriteMock("kiwi");
        const apple = new SpriteMock("apple");
        const banana = new SpriteMock("banana");
        const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), kiwi, apple]);
        const t = tdMock.getTestDriver();
        const dummyCU = getDummyCheckUtility();

        test('cu.registerOnMoveEvent() is called with correct params', () => {
            const fn = jest.fn();
            let check: (sprite: Sprite) => CheckResult;
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = (spriteName: string, c: Check, graphID: string,
                                          predicate: (sprite: Sprite) => CheckResult) => {
                fn(spriteName, c, graphID, predicate);
                check = predicate;
            };
            const cu = cuMock.getCheckUtility();
            const c = new SpriteTouching("label", {negated: true, args: ["kiwi", "banana"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenCalledTimes(1);
            expect(check(kiwi.sprite)).toEqual(fail(expect.any(Object)));
            kiwi.touchingSprite = false;
            expect(check(kiwi.sprite)).toEqual(pass());
        });

        it.each([true, false])('returned function depends on touchingSprite (negated: %s)', (negated: boolean) => {
            banana.touchingSprite = true;
            const c = new SpriteTouching("label", {negated: negated, args: ["banana", "kiwi"]});
            c.registerComponents(t, dummyCU, graphID);
            expect(c.check().passed).toEqual(!negated);
            banana.touchingSprite = false;
            expect(c.check().passed).toEqual(negated);
        });
    });

    describe('getVariableComparisonCheck', () => {
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
            expect(() => new VarComp('label', {args: ["apple", "x", cmp, "3"]})).toThrowError();
        });

        test('VarEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnVarEvent = fn;
            const cu = cuMock.getCheckUtility();
            const c = new VarComp('label', {args: ["apple", "x", "==", "2"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenLastCalledWith(apple.variables[0].name, c, graphID, c.check);
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
            expect(res()).toStrictEqual(fail(reason));
        });
    });

    describe('getVariableChangeCheck', () => {
        const dummyCU = getDummyCheckUtility();
        const stage = new SpriteMock(STAGE_NAME);
        const oldStage = new SpriteMock(STAGE_NAME);
        const apple = new SpriteMock("apple");
        const banana = new SpriteMock("banana");
        stage.variables = [{name: "Punkte", value: 9, old: {name: "Punkte", value: 10}}];
        stage.old = oldStage;
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
            expect(fn).toHaveBeenLastCalledWith(apple.variables[0].name, c, graphID, c.check);
        });

        test('Check works for stage', () => {
            const c = new VarChange('label', {args: [STAGE_NAME, "Punkte", "-"]});
            c.registerComponents(t, dummyCU, graphID);
            expect(c.check()).toEqual(pass());
            stage.variables = [{name: "Punkte", value: 10, old: {name: "Punkte", value: 9}}];
            const reason = {"after": 10, "before": 9};
            expect(c.check()).toEqual(fail(reason));
        });
    });

    test('getBackgroundChangeCheck', () => {
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
        expect(c.check()).toStrictEqual(fail(reason));
    });

    describe('getOutputOnSpriteCheck()', () => {
        const dummyCU = getDummyCheckUtility();
        const banana = new SpriteMock("Banana");
        banana.sayText = "this is some text";
        const kiwi = new SpriteMock("kiwi");
        kiwi.sayText = "this is a text as well";
        const tdMock = new TestDriverMock([banana, kiwi]);
        const t = tdMock.getTestDriver();

        test('Generates check compares actual output correctly', () => {
            const spriteName = "Banana";
            const text = "this is some text";
            const c = new Output('label', {args: [spriteName, text]});
            c.registerComponents(t, dummyCU, graphID);
            expect(c.check()).toStrictEqual(pass());
            banana.sayText = "this is a different text";
            tdMock.currentSprites = [kiwi.updateSprite(), banana.updateSprite()];
            const reason = {"actual": "this is a different text", "expected": "this is some text"};
            expect(c.check()).toStrictEqual(fail(reason));
        });

        test('Correct predicate is registered at CheckUtility', () => {
            const cu = getDummyCheckUtility();
            const fn = jest.fn();
            let check: (sprite: Sprite) => CheckResult;
            cu.registerOutput = (spriteName: string, c: Check, graphID: string,
                                 predicate: (sprite: Sprite) => CheckResult) => {
                fn(spriteName, c, graphID, predicate);
                check = predicate;
            };
            const c = new Output('label', {args: ["kiwi", "this is a text as well"]});
            c.registerComponents(t, cu, graphID);
            expect(fn).toHaveBeenCalledWith("kiwi", c, graphID, check);
            expect(check(kiwi.sprite)).toStrictEqual(pass());
            kiwi.sayText = "this is a different text";
            tdMock.currentSprites = [kiwi.updateSprite(), banana.updateSprite()];
            expect(check(kiwi.sprite)).toStrictEqual(fail(expect.any(Object)));
        });
    });

    describe('getNumberOfClonesCheck', () => {
        const banana = new SpriteMock("banana");
        banana.clones = [new SpriteMock("banana"), new SpriteMock("banana"), new SpriteMock("banana")];
        const apple = new SpriteMock("apple");
        apple.clones = [
            new SpriteMock("apple"), new SpriteMock("apple"), new SpriteMock("apple"),
            new SpriteMock("apple"), new SpriteMock("apple")
        ];
        const bowl = new SpriteMock("bowl");
        apple.clones[1].visible = false;
        banana.clones[0].visible = false;
        banana.clones[2].visible = false;
        const tdMock = new TestDriverMock([apple, banana, bowl, ...apple.clones, ...banana.clones]);
        const t = tdMock.getTestDriver();
        const table: [string, boolean, number][] = [
            ["banana", true, 2], ["banana", false, 4], ["apple", true, 5], ["apple", false, 6], ["bowl", false, 1]
        ];
        it.each(table)('counts correct amount of %s with visible necessary == %s',
            (name, visible, count) => {
                const c = new (visible ? NbrOfVisibleClones : NbrOfClones)('label', {
                    negated: false,
                    args: [name, "==", count]
                });
                c.registerComponents(t, null, graphID);
                expect(c.check()).toStrictEqual(pass());
            });

        test('throws exception for invalid comparison', () => {
            expect(() => new NbrOfClones('label', {
                negated: true,
                args: ["banana", "<=>" as ComparisonOp, 10]
            })).toThrowError();
        });
    });

    describe('getProbabilityCheck()', () => {
        const repetitions = 1000;
        test('probability of 1 negated "never" returns true', () => {
            const c = new Probability('label', {negated: true, args: [1]});
            c.registerComponents(null, null, graphID);

            for (let i = 0; i < repetitions; ++i) {
                if (c.check().passed) {
                    throw new Error("with a probability of 0 the result of the function should not be true");
                }
            }
        });

        test('probability of 0 always returns false', () => {
            const c = new Probability('label', {args: [0]});
            c.registerComponents(null, null, graphID);

            for (let i = 0; i < repetitions; ++i) {
                if (c.check().passed) {
                    throw new Error("with a probability of 0 the result of the function should not be true");
                }
            }
        });

        test('probability of 0.1 returns false more often than true', () => {
            const c = new Probability('label', {args: [0.1]});
            c.registerComponents(null, null, graphID);

            let trueCount = 0;
            let falseCount = 0;
            for (let i = 0; i < repetitions; ++i) {
                if (c.check().passed) {
                    ++trueCount;
                } else {
                    ++falseCount;
                }
            }
            expect(trueCount).toBeGreaterThan(0);
            expect(trueCount).toBeLessThan(falseCount / 5);
        });

        test('Calls Randomness.getInstance().nextDouble()', () => {
            jest.mock('../../../../src/whisker/utils/Randomness');
            let value = 0.75;
            Randomness.getInstance = jest.fn().mockReturnValue({
                nextDouble: () => value
            });
            const p = 0.3414;
            const c = new Probability('label', {args: [p]});
            c.registerComponents(null, null, graphID);
            expect(c.check()).toStrictEqual(fail({}));
            value = 0.1;
            expect(c.check()).toStrictEqual(pass());
            value = 0.42;
            expect(c.check()).toStrictEqual(fail({}));
        });
    });

    describe('getExpressionCheck()', () => {
        const boat = new SpriteMock("Boat", [{name: "x", value: 42}, {name: "speed", value: 100}]);
        const gate = new SpriteMock("Gate", [{name: "size", value: 3}]);
        const stage = new SpriteMock(STAGE_NAME, [{name: "direction", value: 140}, {name: "score", value: 10}]);
        const tdMock = new TestDriverMock([boat, gate, stage]);
        const cu = getDummyCheckUtility();
        tdMock.stage = stage.sprite;
        const t = tdMock.getTestDriver();
        const expr = "$('Boat', 'x').toString()+(-1*Math.sqrt($('Boat', 'speed', true))).toString() == '42-10' && 3*($('Gate', 'size')+2) < (2*($('_stage_', 'score', true)-1)+10)/1.5";

        test('returned check is correct', () => {
            const c = new Expr('label', {args: [expr]});
            c.registerComponents(t, cu, graphID);
            expect(c.check()).toStrictEqual(pass());
        });

        test('onMove dependencies are correct', () => {
            const cu = getDummyCheckUtility();
            const moveEvent = jest.fn();
            cu.registerOnMoveEvent = moveEvent;
            const c = new Expr('label', {args: [expr]});
            c.registerComponents(t, cu, graphID);
            expect(moveEvent).toHaveBeenCalledTimes(1);
            expect(moveEvent).toHaveBeenCalledWith("Boat", c, graphID, c.check);
        });

        test('variable dependencies are correct', () => {
            const cu = getDummyCheckUtility();
            const varEvent = jest.fn();
            cu.registerVarEvent = varEvent;
            const c = new Expr('label', {args: [expr]});
            c.registerComponents(t, cu, graphID);
            expect(varEvent).toHaveBeenCalledTimes(2);
            expect(varEvent).toHaveBeenCalledWith("speed", c, graphID, c.check);
            expect(varEvent).toHaveBeenCalledWith("score", c, graphID, c.check);
        });

        test('onVisual dependencies are correct', () => {
            const cu = getDummyCheckUtility();
            const visualEvent = jest.fn();
            cu.registerOnVisualChange = visualEvent;
            const c = new Expr('label', {args: [expr]});
            c.registerComponents(t, cu, graphID);
            expect(visualEvent).toHaveBeenCalledTimes(1);
            expect(visualEvent).toHaveBeenCalledWith("Gate", c, graphID, c.check);
        });

        it.each([[false, false], [false, true], [true, false], [true, true]])(
            'Returns constant function for negated: %s, param: %s', (negated, value) => {
                const c = new Expr('label', {negated, args: [String(value)]});
                c.registerComponents(null, null, graphID);
                expect(c.check().passed).toBe(negated ? !value : value);
            });

        test('Can use TestDriver instead of $-function', () => {
            const apple = new SpriteMock("apple");
            const kiwi = new SpriteMock("kiwi");
            const tdMock = new TestDriverMock([apple, kiwi]);
            const cu = getDummyCheckUtility();
            const fn = "t.getSprites(s => s.name == 'apple').length == 1";
            const c = new Expr('label', {args: [fn]});
            c.registerComponents(tdMock.getTestDriver(), cu, graphID);
            expect(c.check()).toStrictEqual(pass());
            tdMock.currentSprites = [kiwi.sprite];
            expect(c.check()).toStrictEqual(fail({}));
        });

        test('Registers correct predicate at CheckUtility', () => {
            const apple = new SpriteMock("apple", [{name: "sayText", value: "I am an apple"}]);
            const tdMock = new TestDriverMock([apple]);
            let check: (sprite: Sprite) => CheckResult;
            const mock = jest.fn();
            const cu = getDummyCheckUtility();
            cu.registerOutput = (spriteName: string, c: Check, graphID: string,
                                 predicate: (sprite: Sprite) => CheckResult): void => {
                check = predicate;
                mock(spriteName, c, graphID, predicate);
            };
            const fn = "t.getSprite('apple').sayText == 'I am an apple'";
            const c = new Expr('label', {args: [fn]});
            c.registerComponents(tdMock.getTestDriver(), cu, graphID);
            expect(mock).toHaveBeenCalledWith("apple", c, graphID, check);
            expect(check(apple.sprite)).toStrictEqual(pass());
            apple.variables = [{name: "sayText", value: "I am definitely a pineapple"}];
            tdMock.currentSprites = [apple.updateSprite()];
            expect(check(apple.sprite)).toStrictEqual(fail({}));
        });
    });

    test('getTimeElapsedCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        VMWrapper.convertFromTimeToSteps = (steps: number) => steps / 10;
        const c = new TimeElapsed('label', {args: [1230]});
        c.registerComponents(t, null, graphID);
        tdMock.totalStepsExecuted = 122;
        const reason = {"actual": 122, "expected": 123};
        expect(c.check()).toStrictEqual(fail(reason));
        tdMock.totalStepsExecuted = 123;
        expect(c.check()).toStrictEqual(pass());
        tdMock.totalStepsExecuted = 1000;
        expect(c.check()).toStrictEqual(pass());
    });

    test('getTimeBetweenCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        VMWrapper.convertFromTimeToSteps = (steps: number) => steps / 10;
        const c = new TimeBetween('label', {args: [3760]});
        c.registerComponents(t, null, graphID);
        const reason = {"actual": 375, "expected": 376};
        expect(c.check(375)).toStrictEqual(fail(reason));
        expect(c.check(376)).toStrictEqual(pass());
        expect(c.check(12371298)).toStrictEqual(pass());
    });

    describe('getTimeAfterEndCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        VMWrapper.convertFromTimeToSteps = (steps: number) => steps / 100;
        const c = new TimeAfterEnd('label', {args: [68800]});
        c.registerComponents(t, null, graphID);
        const table: [CheckResult, number, number, number][] = [
            [fail({"actual": 687, "expected": 688, "stepsSinceEnd": 0, "total": 687}), 0, 687, 123],
            [fail({"actual": 687, "expected": 688, "stepsSinceEnd": 213, "total": 900}), 213, 900, 456],
            [pass(), 312, 1000, 789],
            [pass(), 4538, 10000, 10]
        ];
        it.each(table)('getTimeAfterEndCheck returns %s for %s steps after end and %s total steps',
            (expected, afterEnd, total, sinceLastTransition) => {
                tdMock.totalStepsExecuted = total;
                expect(c.check(sinceLastTransition, afterEnd)).toStrictEqual(expected);
            });
    });

    describe('getTouchingEdgeCheck()', () => {
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
});
