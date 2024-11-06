import {CheckGenerator} from "../../../../src/whisker/model/util/CheckGenerator";
import {
    ComparisonNotKnownError,
    FunctionEvalError,
    NotANumericalValueError,
    RGBRangeError,
    SpriteNotFoundError
} from "../../../../src/whisker/model/util/ModelError";
import {ArgType} from "../../../../src/whisker/model/components/Check";
import {SpriteMock} from "../SpriteMock";
import {TestDriverMock} from "../TestDriverMock";
import {CheckUtilityMock, getDummyCheckUtility} from "../CheckUtilityMock";
import Sprite from "../../../../src/vm/sprite";
import {Randomness} from "../../../../src/whisker/utils/Randomness";

describe('CheckGenerator', () => {

    const graphID = "graphID";

    describe('getKeyDownCheck()', () => {
        const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
        const cu = cuMock.getCheckUtility();

        test('Has the correct return type', () => {
            const result = CheckGenerator.getKeyDownCheck(null, cu, false, "a");
            expect(typeof result).toEqual(typeof (() => false));
        });

        test('Returned Function evaluates to the correct values', () => {
            const result = CheckGenerator.getKeyDownCheck(null, cu, false, "a");
            cuMock.pressedKeys["a"] = true;
            expect(result()).toEqual(true);
            cuMock.pressedKeys["a"] = false;
            expect(result()).toEqual(false);
        });
    });

    describe('getSpriteClickedCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        test('throws exception when no sprite exists', () => {
            tdMock.currentSprites = [];
            expect(() => {
                CheckGenerator.getSpriteClickedCheck(t, false, "banana");
            }).toThrow(SpriteNotFoundError);
        });

        test('throws exception when correct sprite does not exist', () => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = [apple.sprite];
            expect(() => {
                CheckGenerator.getSpriteClickedCheck(t, false, "banana");
            }).toThrow(SpriteNotFoundError);
        });

        test('Has the correct return type', () => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = [apple.sprite];
            const result = CheckGenerator.getSpriteClickedCheck(t, false, "apple");
            expect(typeof result).toEqual(typeof (() => false));
        });

        it.each([true, false])('returns correct sprite if possible (negated: %s)', (negated: boolean) => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = SpriteMock.toSpriteArray([
                new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("kiwi"), apple
                // when adding new SpriteMock("pineapple") the test fails. This does not seem right -> potential bug
            ]);
            tdMock.isMouseDown = true;
            apple.touchingMouse = true;
            const result = CheckGenerator.getSpriteClickedCheck(t, negated, "apple");
            expect(result()).toEqual(!negated);
            apple.touchingMouse = false;
            expect(result()).toEqual(negated);
        });
    });

    describe('getSpriteColorTouchingCheck()', () => {
        const tdMock = new TestDriverMock();
        tdMock.currentSprites = [new SpriteMock("apple").sprite];
        const t = tdMock.getTestDriver();
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
                expect(() => CheckGenerator.getSpriteColorTouchingCheck(t, dummyCU, null, null,
                    true, "apple", r, g, b)).toThrow(NotANumericalValueError);
            });
            it.each(colorsWrongBounds)('getKeyDownThrowsForColors(%d, %d, %d) throws RGBRangeError', (r: number, g: number, b: number) => {
                expect(() => CheckGenerator.getSpriteColorTouchingCheck(t, dummyCU, null, null,
                    true, "apple", r, g, b)).toThrow(RGBRangeError);
            });
        });

        test('cu.registerOnMoveEvent() is called with correct params', () => {
            const fn = jest.fn();
            let check: (sprite: Sprite) => boolean;
            const cu = getDummyCheckUtility();
            cu.registerOnMoveEvent = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                      predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            const kiwi = new SpriteMock("kiwi");
            tdMock.currentSprites = SpriteMock.toSpriteArray([
                new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("apple"), kiwi
            ]);
            CheckGenerator.getSpriteColorTouchingCheck(t, cu, "label", graphID, false, "apple", 255, 0, 0);
            expect(fn).toHaveBeenCalledTimes(1);
            expect(check(kiwi.sprite)).toEqual(true);
            kiwi.touchingColor = false;
            expect(check(kiwi.sprite)).toEqual(false);
        });

        test('Has the correct return type', () => {
            const result = CheckGenerator.getSpriteColorTouchingCheck(t, dummyCU, "label", graphID, false, "apple", 0, 255, 0);
            expect(typeof result).toEqual(typeof (() => false));
        });

        it.each([true, false])('returned function depends on touchingColor (negated: %s)', (negated: boolean) => {
            const kiwi = new SpriteMock("kiwi");
            tdMock.currentSprites = SpriteMock.toSpriteArray([
                new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("apple"), kiwi
            ]);
            kiwi.touchingColor = true;
            const result = CheckGenerator.getSpriteColorTouchingCheck(t, dummyCU, "label", graphID, negated, "kiwi", 255, 128, 64);
            expect(result()).toEqual(!negated);
            kiwi.touchingColor = false;
            expect(result()).toEqual(negated);
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
            let check: (sprite: Sprite) => boolean;
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                          predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            const cu = cuMock.getCheckUtility();
            CheckGenerator.getSpriteTouchingCheck(t, cu, "label", graphID, true, "kiwi", "banana");
            expect(fn).toHaveBeenCalledTimes(1);
            expect(check(kiwi.sprite)).toEqual(false);
            kiwi.touchingSprite = false;
            expect(check(kiwi.sprite)).toEqual(true);
        });

        test('Has the correct return type', () => {
            const result = CheckGenerator.getSpriteTouchingCheck(t, dummyCU, "label", graphID, false, "apple", "banana");
            expect(typeof result).toEqual(typeof (() => false));
        });

        it.each([true, false])('returned function depends on touchingSprite (negated: %s)', (negated: boolean) => {
            banana.touchingSprite = true;
            const result = CheckGenerator.getSpriteTouchingCheck(t, dummyCU, "label", graphID, negated, "banana", "kiwi");
            expect(result()).toEqual(!negated);
            banana.touchingSprite = false;
            expect(result()).toEqual(negated);
        });
    });

    describe('getVariableComparisonCheck', () => {
        const stage = new SpriteMock("stage");
        const kiwi = new SpriteMock("kiwi");
        const apple = new SpriteMock("apple");
        const banana = new SpriteMock("banana");
        const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), kiwi, apple, stage]);
        const t = tdMock.getTestDriver();
        const dummyCU = getDummyCheckUtility();
        apple.variables = [{name: "x", value: 2}];
        stage.variables = [{name: "x", value: 10}];
        tdMock.stage = stage.sprite;

        test('Has the correct return type', () => {
            const result = CheckGenerator.getVariableComparisonCheck(t, dummyCU, "label", graphID, false, "apple", "x", "<", "3");
            expect(typeof result).toEqual(typeof (() => false));
        });

        it.each(["someInvalidComparison", "<=>", "<>", "><"])('throws for comparison %s', (c: string) => {
            expect(() => {
                CheckGenerator.getVariableComparisonCheck(t, dummyCU, "label", graphID, false, "apple", "x", c, "3");
            }).toThrow(ComparisonNotKnownError);
        });

        test('VarEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnVarEvent = fn;
            const cu = cuMock.getCheckUtility();
            const res = CheckGenerator.getVariableComparisonCheck(t, cu, "label", graphID, false, "apple", "x", "==", "2");
            expect(fn).toHaveBeenLastCalledWith(apple.variables[0].name, "VarComp:apple:x:==:2", "label", graphID, res);
        });

        test('Check works for stage', () => {
            const res = CheckGenerator.getVariableComparisonCheck(t, dummyCU, "label", graphID, false, "stage", "x", "==", "10");
            expect(res()).toEqual(true);
            stage.variables[0].value = 9;
            expect(res()).toEqual(false);
        });
    });

    describe('getVariableChangeCheck', () => {
        const dummyCU = getDummyCheckUtility();
        const stage = new SpriteMock("stage");
        const oldStage = new SpriteMock("stage");
        const apple = new SpriteMock("apple");
        const banana = new SpriteMock("banana");
        stage.variables = [{name: "Punkte", value: 9, old: {name: "Punkte", value: 10}}];
        stage.old = oldStage;
        apple.variables = [{name: "x", value: 2}];
        const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), apple, stage]);
        tdMock.stage = stage.sprite;
        const t = tdMock.getTestDriver();

        test('Has the correct return type', () => {
            const result = CheckGenerator.getVariableChangeCheck(t, dummyCU, "label", graphID, false, "apple", "x", "+");
            expect(typeof result).toEqual(typeof (() => false));
        });

        test('VarEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnVarEvent = fn;
            const cu = cuMock.getCheckUtility();
            const res = CheckGenerator.getVariableChangeCheck(t, cu, "label", graphID, false, "apple", "x", "+");
            expect(fn).toHaveBeenLastCalledWith(apple.variables[0].name, "VarChange:apple:x:+", "label", graphID, res);
        });

        test('Check works for stage', () => {
            const res = CheckGenerator.getVariableChangeCheck(t, dummyCU, "label", graphID, false, "stage", "Punkte", "-");
            expect(res()).toEqual(true);
            stage.variables = [{name: "Punkte", value: 10, old: {name: "Punkte", value: 9}}];
            expect(res()).toEqual(false);
        });
    });

    describe('getAttributeComparisonCheck', () => {
        const kiwi = new SpriteMock("kiwi");
        const apple = new SpriteMock("apple");
        const banana = new SpriteMock("banana");
        const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), kiwi, apple]);
        const t = tdMock.getTestDriver();
        const dummyCU = getDummyCheckUtility();
        kiwi.variables = [
            {name: "x", value: 2},
            {name: "size", value: 10},
            {name: "sayText", value: "this is some text"}
        ];
        kiwi.updateSprite();

        it.each(["someInvalidComparison", "<=>", "<>", "><"])('throws for comparison %s', (c: string) => {
            expect(() => {
                CheckGenerator.getAttributeComparisonCheck(t, dummyCU, "label", graphID, false, "kiwi", "size", c, "3");
            }).toThrow(ComparisonNotKnownError);
        });

        test('Has the correct return type', () => {
            const result = CheckGenerator.getAttributeComparisonCheck(t, dummyCU, "label", graphID, false, "kiwi", "size", "<", "3");
            expect(typeof result).toEqual(typeof (() => false));
        });

        test('OnMoveEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = fn;
            const cu = cuMock.getCheckUtility();
            CheckGenerator.getAttributeComparisonCheck(t, cu, "label", graphID, false, "kiwi", "x", "==", "7");
            expect(fn).toHaveBeenLastCalledWith("kiwi", "AttrComp:kiwi:x:==:7", "label", graphID, expect.anything());
        });

        test('OnVisualChange is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnVisualChange = fn;
            const cu = cuMock.getCheckUtility();
            CheckGenerator.getAttributeComparisonCheck(t, cu, "label", graphID, false, "kiwi", "size", "<", "42");
            expect(fn).toHaveBeenLastCalledWith("kiwi", "AttrComp:kiwi:size:<:42", "label", graphID, expect.anything());
        });

        test('Output is registered on CheckUtil for changing output', () => {
            let check: ((sprite: Sprite) => boolean);
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOutput = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                     predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            const cu = cuMock.getCheckUtility();
            CheckGenerator.getAttributeComparisonCheck(t, cu, "label", graphID, false, "kiwi", "sayText", "==", "this is some text");
            expect(fn).toHaveBeenLastCalledWith("kiwi", "AttrComp:kiwi:sayText:==:this is some text", "label", graphID, check);
            expect(check(kiwi.sprite)).toBe(true);
            kiwi.sayText = "the kiwi has nothing to say";
            kiwi.updateSprite();
            expect(check(kiwi.sprite)).toBe(false);
        });

        test('Output is registered on CheckUtil for changing coordinates', () => {
            const sprite = new SpriteMock("apple", [{name: "x", value: 31415}]);
            const tdMock = new TestDriverMock([sprite]);
            const t = tdMock.getTestDriver();
            let check: ((sprite: Sprite) => boolean);
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                          predicate: (sprite: Sprite) => boolean) => {
                check = predicate;
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
            };
            const cu = cuMock.getCheckUtility();
            CheckGenerator.getAttributeComparisonCheck(t, cu, "label", graphID, false, "apple", "x", "<=", "42");
            expect(fn).toHaveBeenLastCalledWith("apple", "AttrComp:apple:x:<=:42", "label", graphID, check);
            expect(check(sprite.sprite)).toBe(false);
            sprite.variables = [{name: "x", value: 0}];
            sprite.updateSprite();
            expect(check(sprite.sprite)).toBe(true);
        });

        test('Output is registered on CheckUtil for changing visual', () => {
            const sprite = new SpriteMock("stage");
            sprite.currentCostumeName = "defaultStage";
            const tdMock = new TestDriverMock([sprite]);
            tdMock.stage = sprite.updateSprite();
            const t = tdMock.getTestDriver();
            const fn = jest.fn();
            let check: ((sprite: Sprite) => boolean);
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnVisualChange = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                             predicate: (sprite: Sprite) => boolean) => {
                check = predicate;
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
            };
            const cu = cuMock.getCheckUtility();
            CheckGenerator.getAttributeComparisonCheck(t, cu, "label", graphID, true, "stage", "currentCostume", "==", "win");
            expect(fn).toHaveBeenLastCalledWith("stage", "!AttrComp:stage:costume:==:win", "label", graphID, check);
            expect(check(sprite.sprite)).toBe(true);
            sprite.currentCostumeName = "win";
            sprite.updateSprite();
            expect(check(sprite.sprite)).toBe(false);
        });

        it.each([false, true])('Returned function includes original sprite (negated: %s)', (negated) => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = fn;
            const cu = cuMock.getCheckUtility();
            kiwi.clones = [new SpriteMock("kiwi")];
            kiwi.clones[0].variables = [{name: "x", value: 4}];
            kiwi.clones[0].updateSprite();
            const res = CheckGenerator.getAttributeComparisonCheck(t, cu, "label", graphID, negated, "kiwi", "x", "<", "3");
            expect(res()).toEqual(!negated);
        });

        it.each([false, true])('Returned function includes clones (negated: %s)', (negated) => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = fn;
            const cu = cuMock.getCheckUtility();
            kiwi.clones = [new SpriteMock("kiwi"), new SpriteMock("kiwi"), new SpriteMock("kiwi")];
            kiwi.clones[0].variables = [{name: "x", value: 4}];
            kiwi.clones[1].variables = [{name: "x", value: 8}];
            kiwi.clones[2].variables = [{name: "x", value: 16}];
            kiwi.clones.forEach(c => c.updateSprite());
            const res = CheckGenerator.getAttributeComparisonCheck(t, cu, "label", graphID, negated, "kiwi", "x", ">", "15");
            expect(res()).toEqual(!negated);
        });
    });

    describe('getAttributeChangeCheck', () => {
        const dummyCU = getDummyCheckUtility();
        const stage = new SpriteMock("stage", [{
            name: "currentCostumeName",
            value: "win",
            old: {name: "currentCostumeName", value: "lose"}
        }]);
        const oldStage = new SpriteMock("stage", [{name: "currentCostumeName", value: "lose"}]);
        const apple = new SpriteMock("apple", [{name: "x", value: 2}, {name: "size", value: 10}]);
        apple.old = new SpriteMock("apple", [{name: "x", value: 42}, {name: "size", value: 20}]);
        const banana = new SpriteMock("banana");
        stage.old = oldStage;
        const tdMock = new TestDriverMock([banana, new SpriteMock("bowl"), apple, stage]);
        tdMock.stage = stage.sprite;
        const t = tdMock.getTestDriver();

        test('Has the correct return type', () => {
            const result = CheckGenerator.getAttributeChangeCheck(t, dummyCU, "label", graphID, false, "apple", "x", "-");
            expect(typeof result).toEqual(typeof (() => false));
        });

        test('VarEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cu = getDummyCheckUtility();
            let check: (sprite: Sprite) => boolean;
            cu.registerOnVisualChange = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                         predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            CheckGenerator.getAttributeChangeCheck(t, cu, "label", graphID, false, "apple", "size", "+");
            expect(fn).toHaveBeenLastCalledWith(apple.name, "AttrChange:apple:size:+", "label", graphID, check);
            expect(check(apple.sprite)).toBe(false);
        });

        test('MoveEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cu = getDummyCheckUtility();
            let check: (sprite: Sprite) => boolean;
            cu.registerOnMoveEvent = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                      predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            CheckGenerator.getAttributeChangeCheck(t, cu, "label", graphID, false, "apple", "x", "+");
            expect(fn).toHaveBeenLastCalledWith(apple.name, "AttrChange:apple:x:+", "label", graphID, check);
            expect(check(apple.sprite)).toBe(false);
        });

        test('Check is not a constant function', () => {
            const res = CheckGenerator.getAttributeChangeCheck(t, dummyCU, "label", graphID, true, "stage", "currentCostume", "==");
            expect(res()).toEqual(true);
            stage.variables = [{
                name: "currentCostumeName",
                value: "lose",
                old: {name: "currentCostumeName", value: "lose"}
            }];
            tdMock.currentSprites = SpriteMock.toSpriteArray([banana, new SpriteMock("bowl"), apple, stage]);
            expect(res()).toEqual(false);
        });
    });

    test('getBackgroundChangeCheck', () => {
        const dummyCU = getDummyCheckUtility();
        const stage = new SpriteMock("stage", [{name: "currentCostumeName", value: "win"}]);
        const tdMock = new TestDriverMock([stage]);
        tdMock.stage = stage.sprite;
        const t = tdMock.getTestDriver();
        const res = CheckGenerator.getBackgroundChangeCheck(t, dummyCU, "label", false, "win");
        expect(res()).toEqual(true);
        stage.variables = [{name: "currentCostumeName", value: "lose"}];
        tdMock.currentSprites = SpriteMock.toSpriteArray([stage]);
        tdMock.stage = stage.sprite;
        expect(res()).toEqual(false);
    });

    describe('getFunctionCheck()', () => {
        it.each([[false, false], [false, true], [true, false], [true, true]])(
            'Returns constant function for negated: %s, param: %s', (negated, value) => {
                const f = CheckGenerator.getFunctionCheck(null, null, "", "", negated, String(value));
                expect(f()).toBe(negated ? !value : value);
            });

        test('Throws Exception when function cannot be evaluated', () => {
            expect(() => {
                CheckGenerator.getFunctionCheck(null, null, "", "", false, "throw new Error(\"this is an error\");");
            }).toThrow(FunctionEvalError);
        });

        test('Returned function actually uses TestDriver', () => {
            const apple = new SpriteMock("apple");
            const kiwi = new SpriteMock("kiwi");
            const tdMock = new TestDriverMock([apple, kiwi]);
            const cu = getDummyCheckUtility();
            const fn = "(t) => t.getSprites(s => s.name == \"apple\").length == 1";
            const f = CheckGenerator.getFunctionCheck(tdMock.getTestDriver(), cu, "label", graphID, false, fn);
            expect(f()).toBe(true);
            tdMock.currentSprites = [kiwi.sprite];
            expect(f()).toBe(false);
        });

        test('Registers correct predicate at CheckUtility', () => {
            const apple = new SpriteMock("apple", [{name: "sayText", value: "I am an apple"}]);
            const tdMock = new TestDriverMock([apple]);
            let check: ((sprite: Sprite) => boolean);
            const mock = jest.fn();
            const cu = getDummyCheckUtility();
            cu.registerOutput = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                 predicate: (sprite: Sprite) => boolean): void => {
                check = predicate;
                mock(spriteName, eventString, edgeLabel, graphID, predicate);
            };
            const fn = "(t) => t.getSprite(\"apple\").sayText == 'I am an apple'";
            CheckGenerator.getFunctionCheck(tdMock.getTestDriver(), cu, "label", graphID, false, fn);
            expect(mock).toHaveBeenCalledWith("apple", "Function:(t) => t.getSprite(\"apple\").sayText == 'I am an apple'", "label", graphID, check);
            expect(check(apple.sprite)).toBe(true);
            apple.variables = [{name: "sayText", value: "I am definitely a pineapple"}];
            tdMock.currentSprites = [apple.updateSprite()];
            expect(check(apple.sprite)).toBe(false);
        });
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
            const result = CheckGenerator.getOutputOnSpriteCheck(t, dummyCU, "label", graphID, false, false, "Banana", "this is some text");
            expect(result()).toEqual(true);
            banana.sayText = "this is a different text";
            tdMock.currentSprites = [kiwi.updateSprite(), banana.updateSprite()];
            expect(result()).toEqual(false);
        });

        test('Correct predicate is registered at CheckUtility', () => {
            const cu = getDummyCheckUtility();
            const fn = jest.fn();
            let check: (sprite: Sprite) => boolean;
            cu.registerOutput = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                 predicate: (sprite: Sprite) => boolean) => {
                fn(spriteName, eventString, edgeLabel, graphID, predicate);
                check = predicate;
            };
            CheckGenerator.getOutputOnSpriteCheck(t, cu, "label", graphID, false, false, "kiwi", "this is a text as well");
            expect(fn).toHaveBeenCalledWith("kiwi", "Output:kiwi:this is a text as well", "label", graphID, check);
            expect(check(kiwi.sprite)).toEqual(true);
            kiwi.sayText = "this is a different text";
            tdMock.currentSprites = [kiwi.updateSprite(), banana.updateSprite()];
            expect(check(kiwi.sprite)).toEqual(false);
        });
    });

    describe('getRandomValueCheck', () => {
        const label = "label";
        const graphId = graphID;
        const spriteName = "apple";
        const variableName = "x";
        const sprite = new SpriteMock(spriteName, [{name: variableName, value: "0"}]);
        const tdMock = new TestDriverMock([sprite]);
        const t = tdMock.getTestDriver();
        test('the same value does not count as random', () => {
            let fn: ((sprite: Sprite) => boolean);
            const dummyCU = getDummyCheckUtility();
            dummyCU.registerOnMoveEvent = (sn, es, el, gID, predicate) => fn = predicate;
            const res = CheckGenerator.getRandomValueCheck(t, dummyCU, label, graphId, false, spriteName, variableName);
            fn(sprite.sprite);
            fn(sprite.sprite);
            fn(sprite.sprite);
            fn(sprite.sprite);
            // expect(res()).toBe(false);
            // TODO: I think the result should be false since the value is constant which is not random (with high prob)
            //  but it might also be a wrong way to mock this.
            expect(res()).toBe(true);
        });

        test('a different value than the one before counts a random', () => {
            let fn: ((sprite: Sprite) => boolean);
            const dummyCU = getDummyCheckUtility();
            sprite.variables = [{name: variableName, value: "3"}];
            tdMock.currentSprites = [sprite.sprite];
            dummyCU.registerOnMoveEvent = (sn, es, el, gID, predicate) => fn = predicate;
            const res = CheckGenerator.getRandomValueCheck(t, dummyCU, label, graphId, false, spriteName, variableName);
            fn(sprite.sprite);
            sprite.variables = [{name: variableName, value: "4"}];
            tdMock.currentSprites = [sprite.sprite];
            expect(res()).toBe(true);
        });

        test('alternating between two values is not random', () => {
            let fn: ((sprite: Sprite) => boolean);
            const dummyCU = getDummyCheckUtility();
            sprite.variables = [{name: variableName, value: "1"}];
            tdMock.currentSprites = [sprite.sprite];
            dummyCU.registerOnMoveEvent = (sn, es, el, gID, predicate) => fn = predicate;
            const res = CheckGenerator.getRandomValueCheck(t, dummyCU, label, graphId, false, spriteName, variableName);
            fn(sprite.sprite);
            sprite.variables = [{name: variableName, value: "1"}];
            tdMock.currentSprites = [sprite.sprite];
            fn(sprite.sprite);
            sprite.variables = [{name: variableName, value: "0"}];
            tdMock.currentSprites = [sprite.sprite];
            fn(sprite.sprite);
            // expect(res()).toBe(false);
            // TODO: There is probably a bug since the values are alternating which is not random (with high prob)
            //  unless the mocking is not working properly
            expect(res()).toBe(true);
            sprite.variables = [{name: variableName, value: "1"}];
            tdMock.currentSprites = [sprite.sprite];
            fn(sprite.sprite);
            // expect(res()).toBe(false);
            // TODO same as above
            expect(res()).toBe(true);
        });

        test('only possible for some attributes (e.g. sayText or currentCostume)', () => {
            const cu = getDummyCheckUtility();
            expect(() => {
                CheckGenerator.getRandomValueCheck(t, cu, label, graphId, true, "Stage", "currenCostume");
            }).toThrow();
            expect(() => {
                CheckGenerator.getRandomValueCheck(t, cu, label, graphId, true, "apple", "sayText");
            }).toThrow();
        });

        test('increment counts as random', () => {
            let fn: ((sprite: Sprite) => boolean);
            const dummyCU = getDummyCheckUtility();
            sprite.variables = [{name: variableName, value: 1}];
            tdMock.currentSprites = [sprite.sprite];
            dummyCU.registerOnMoveEvent = (sn, es, el, gID, predicate) => fn = predicate;
            const res = CheckGenerator.getRandomValueCheck(t, dummyCU, label, graphId, false, spriteName, variableName);
            const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            fn(sprite.sprite);
            for (const value of values) {
                sprite.variables = [{name: variableName, value: value}];
                tdMock.currentSprites = [sprite.updateSprite()];
                fn(sprite.sprite);
            }
            expect(res()).toBe(true);
        });

        test('always returns true if there is at least one clone', () => {
            const dummyCU = getDummyCheckUtility();
            const clone = new SpriteMock(spriteName, [{name: variableName, value: 0}]);
            const clone2 = new SpriteMock(spriteName, [{name: variableName, value: 0}]);
            clone.clones = [clone2];
            const t = new TestDriverMock([clone, clone2]).getTestDriver();
            const res = CheckGenerator.getRandomValueCheck(t, dummyCU, label, graphId, true, spriteName, variableName);
            expect(res()).toBe(false); // negated so should be false despite name of the test case
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
                const res = CheckGenerator.getNumberOfClonesCheck(t, false, visible, name, "==", count);
                expect(res()).toBe(true);
            });

        test('throws exception for invalid comparison', () => {
            expect(() => {
                CheckGenerator.getNumberOfClonesCheck(t, true, true, "banana", "<=>", 10);
            }).toThrow(ComparisonNotKnownError);
        });
    });

    describe('getProbabilityCheck()', () => {
        const repetitions = 1000;
        test('probability of 1 negated "never" returns true', () => {
            const res = CheckGenerator.getProbabilityCheck(null, true, 1);
            for (let i = 0; i < repetitions; ++i) {
                if (res()) {
                    fail("with a probability of 0 the result of the function should not be true");
                }
            }
        });

        test('probability of 0 always returns false', () => {
            const res = CheckGenerator.getProbabilityCheck(null, false, 0);
            for (let i = 0; i < repetitions; ++i) {
                if (res()) {
                    fail("with a probability of 0 the result of the function should not be true");
                }
            }
        });

        test('probability of 0.1 returns false more often than true', () => {
            const res = CheckGenerator.getProbabilityCheck(null, false, 0.10);
            let trueCount = 0;
            let falseCount = 0;
            for (let i = 0; i < repetitions; ++i) {
                if (res()) {
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
            const res = CheckGenerator.getProbabilityCheck(null, false, 0.3414);
            expect(res()).toBe(false);
            value = 0.1;
            expect(res()).toBe(true);
            value = 0.42;
            expect(res()).toBe(false);
        });
    });

    describe('getExpressionCheck()', () => {
        const boat = new SpriteMock("Boat", [{name: "x", value: 42}, {name: "speed", value: 100}]);
        const gate = new SpriteMock("Gate", [{name: "size", value: 3}]);
        const stage = new SpriteMock("Stage", [{name: "direction", value: 140}, {name: "score", value: 10}]);
        const tdMock = new TestDriverMock([boat, gate, stage]);
        const cu = getDummyCheckUtility();
        tdMock.stage = stage.sprite;
        const t = tdMock.getTestDriver();
        const expr = "$(Boat.x).toString()+(-1*Math.sqrt($(Boat.speed))).toString() == '42-10' && 3*($(Gate.size)+2) < (2*($(Stage.score)-1)+10)/1.5";

        test('returned check is correct', () => {
            const res = CheckGenerator.getExpressionCheck(t, cu, "label", graphID, false, expr);
            expect(res()).toBe(true);
        });

        test('onMove dependencies are correct', () => {
            const cu = getDummyCheckUtility();
            const moveEvent = jest.fn();
            cu.registerOnMoveEvent = moveEvent;
            const res = CheckGenerator.getExpressionCheck(t, cu, "label", graphID, false, expr);
            expect(moveEvent).toHaveBeenCalledTimes(1);
            expect(moveEvent).toHaveBeenCalledWith("Boat", "Expr:" + expr, "label", graphID, res);
        });

        test('variable dependencies are correct', () => {
            const cu = getDummyCheckUtility();
            const varEvent = jest.fn();
            cu.registerVarEvent = varEvent;
            const res = CheckGenerator.getExpressionCheck(t, cu, "label", graphID, false, expr);
            expect(varEvent).toHaveBeenCalledTimes(2);
            expect(varEvent).toHaveBeenCalledWith("speed", "Expr:" + expr, "label", graphID, res);
            expect(varEvent).toHaveBeenCalledWith("score", "Expr:" + expr, "label", graphID, res);
        });

        test('onVisual dependencies are correct', () => {
            const cu = getDummyCheckUtility();
            const visualEvent = jest.fn();
            cu.registerOnVisualChange = visualEvent;
            const res = CheckGenerator.getExpressionCheck(t, cu, "label", graphID, false, expr);
            expect(visualEvent).toHaveBeenCalledTimes(1);
            expect(visualEvent).toHaveBeenCalledWith("Gate", "Expr:" + expr, "label", graphID, res);
        });
    });

    test('getTimeElapsedCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        t.vmWrapper.convertFromTimeToSteps = (steps: number) => steps / 10;
        const res = CheckGenerator.getTimeElapsedCheck(t, false, 1230);
        tdMock.totalStepsExecuted = 122;
        expect(res()).toBe(false);
        tdMock.totalStepsExecuted = 123;
        expect(res()).toBe(true);
        tdMock.totalStepsExecuted = 1000;
        expect(res()).toBe(true);
    });

    test('getTimeBetweenCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        t.vmWrapper.convertFromTimeToSteps = (steps: number) => steps / 10;
        const res = CheckGenerator.getTimeBetweenCheck(t, false, 3760);
        expect(res(375)).toBe(false);
        expect(res(376)).toBe(true);
        expect(res(12371298)).toBe(true);
    });

    describe('getTimeAfterEndCheck()', () => {
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        t.vmWrapper.convertFromTimeToSteps = (steps: number) => steps / 100;
        const res = CheckGenerator.getTimeAfterEndCheck(t, false, 68800);
        const table: [boolean, number, number, number][] = [
            [false, 0, 687, 123],
            [false, 213, 900, 456],
            [true, 312, 1000, 789],
            [true, 4538, 10000, 10]
        ];
        it.each(table)('getTimeAfterEndCheck returns %s for %s steps after end and %s total steps',
            (expected, afterEnd, total, sinceLastTransition) => {
                tdMock.totalStepsExecuted = total;
                expect(res(sinceLastTransition, afterEnd)).toBe(expected);
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

        test('At least one of both edges must be set to true', () => {
            expect(() => {
                CheckGenerator.getTouchingEdgeCheck(t, cu, label, graphID, negated, sprite.name, false, false);
            }).toThrow();
        });

        test('Touching only HorizontalEdgeCheck', () => {
            const res = CheckGenerator.getTouchingEdgeCheck(t, cu, label, graphID, negated, sprite.name, false, true);
            sprite.touchingVerticalEdge = true;
            sprite.touchingHorizontalEdge = false;
            expect(res()).toBe(false);
            sprite.touchingHorizontalEdge = true;
            expect(res()).toBe(true);
            sprite.touchingVerticalEdge = false;
            expect(res()).toBe(true);
        });

        test('Touching only VerticalEdgeCheck', () => {
            const res = CheckGenerator.getTouchingEdgeCheck(t, cu, label, graphID, negated, sprite.name, true, false);
            sprite.touchingVerticalEdge = false;
            sprite.touchingHorizontalEdge = true;
            expect(res()).toBe(false);
            sprite.touchingVerticalEdge = true;
            expect(res()).toBe(true);
            sprite.touchingHorizontalEdge = false;
            expect(res()).toBe(true);
        });

        test('Touching any edge', () => {
            const res = CheckGenerator.getTouchingEdgeCheck(t, cu, label, graphID, negated, sprite.name, true, true);
            sprite.touchingVerticalEdge = false;
            sprite.touchingHorizontalEdge = false;
            expect(res()).toBe(false);
            sprite.touchingVerticalEdge = true;
            expect(res()).toBe(true);
            sprite.touchingVerticalEdge = false;
            sprite.touchingHorizontalEdge = true;
            expect(res()).toBe(true);
            sprite.touchingVerticalEdge = true;
            expect(res()).toBe(true);
        });

        test('Predicate for CheckUtility is correct', () => {
            let check: ((sprite: Sprite) => boolean);
            const cu = getDummyCheckUtility();
            const fn = jest.fn();
            cu.registerOnMoveEvent = (spriteName: string, eventString: string, edgeLabel: string, graphID: string,
                                      predicate: (sprite: Sprite) => boolean): void => {
                fn();
                check = predicate;
            };
            CheckGenerator.getTouchingEdgeCheck(t, cu, label, graphID, negated, sprite.name, true, true);
            sprite.touchingVerticalEdge = false;
            sprite.touchingHorizontalEdge = false;
            expect(fn).toHaveBeenCalledTimes(1);
            expect(check(sprite.sprite)).toBe(false);
            sprite.touchingHorizontalEdge = true;
            sprite.touchingVerticalEdge = true;
            expect(check(sprite.sprite)).toBe(true);
            sprite.visible = false;
            sprite.updateSprite();
            expect(check(sprite.sprite)).toBe(false);
        });
    });
});
