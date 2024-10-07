import {CheckGenerator} from "../../../../src/whisker/model/util/CheckGenerator";
import {
    ComparisonNotKnownError, FunctionEvalError, NotANumericalValueError,
    RGBRangeError,
    SpriteNotFoundError
} from "../../../../src/whisker/model/util/ModelError";
import {ArgType} from "../../../../src/whisker/model/components/Check";
import {SpriteMock} from "../SpriteMock";
import {TestDriverMock} from "../TestDriverMock";
import {CheckUtilityMock, getDummyCheckUtility} from "../CheckUtilityMock";

describe('CheckGenerator', () => {
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
            tdMock.currentSprites = {};
            expect(() => {
                CheckGenerator.getSpriteClickedCheck(t, false, false, "banana");
            }).toThrow(SpriteNotFoundError);
        });

        test('throws exception when correct sprite does not exist', () => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = {"apple": apple.sprite};
            expect(() => {
                CheckGenerator.getSpriteClickedCheck(t, false, false, "banana");
            }).toThrow(SpriteNotFoundError);
        });

        test('Has the correct return type', () => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = {"apple": apple.sprite};
            const result = CheckGenerator.getSpriteClickedCheck(t, false, false, "apple");
            expect(typeof result).toEqual(typeof (() => false));
        });

        it.each([true, false])('returns correct sprite if possible (negated: %s)', (negated: boolean) => {
            const apple = new SpriteMock("apple");
            tdMock.currentSprites = SpriteMock.toSpriteMockMap([
                new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("kiwi"), apple
                // when adding new SpriteMock("pineapple") the test fails. This does not seem right -> potential bug
            ]);
            tdMock.isMouseDown = true;
            apple.touchingMouse = true;
            const result = CheckGenerator.getSpriteClickedCheck(t, negated, false, "(Apfel|Apple)");
            expect(result()).toEqual(!negated);
            apple.touchingMouse = false;
            expect(result()).toEqual(negated);
        });
    });

    describe('getSpriteColorTouchingCheck()', () => {
        const tdMock = new TestDriverMock();
        tdMock.currentSprites = {"apple": new SpriteMock("apple").sprite};
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
                    true, true, "(apple)", r, g, b)).toThrow(NotANumericalValueError);
            });
            it.each(colorsWrongBounds)('getKeyDownThrowsForColors(%d, %d, %d) throws RGBRangeError', (r: number, g: number, b: number) => {
                expect(() => CheckGenerator.getSpriteColorTouchingCheck(t, dummyCU, null, null,
                    true, true, "(apple)", r, g, b)).toThrow(RGBRangeError);
            });
        });

        test('cu.registerOnMoveEvent() is called with correct params', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = fn();
            const cu = getDummyCheckUtility();
            CheckGenerator.getSpriteColorTouchingCheck(t, cu, "label", "graphID", false, false, "(apple)", 255, 0, 0);
            expect(fn).toHaveBeenCalledTimes(1);
        });

        test('Has the correct return type', () => {
            const result = CheckGenerator.getSpriteColorTouchingCheck(t, dummyCU, "label", "graphId", false, false, "(apple)", 0, 255, 0);
            expect(typeof result).toEqual(typeof (() => false));
        });

        it.each([true, false])('returned function depends on touchingColor (negated: %s)', (negated: boolean) => {
            const kiwi = new SpriteMock("kiwi");
            tdMock.currentSprites = SpriteMock.toSpriteMockMap([
                new SpriteMock("banana"), new SpriteMock("bowl"), new SpriteMock("apple"), kiwi
            ]);
            kiwi.touchingColor = true;
            const result = CheckGenerator.getSpriteColorTouchingCheck(t, dummyCU, "label", "graphID", negated, false, "(kiwi)", 255, 128, 64);
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
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = fn;
            const cu = cuMock.getCheckUtility();
            CheckGenerator.getSpriteTouchingCheck(t, cu, "label", "graphID", false, false, "(kiwi)", "(banana)");
            expect(fn).toHaveBeenCalledTimes(1);
        });

        test('Has the correct return type', () => {
            const result = CheckGenerator.getSpriteTouchingCheck(t, dummyCU, "label", "graphId", false, false, "(apple)", "(banana)");
            expect(typeof result).toEqual(typeof (() => false));
        });

        it.each([true, false])('returned function depends on touchingSprite (negated: %s)', (negated: boolean) => {
            banana.touchingSprite = true;
            const result = CheckGenerator.getSpriteTouchingCheck(t, dummyCU, "label", "graphID", negated, false, "(banana)", "(kiwi)");
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
            const result = CheckGenerator.getVariableComparisonCheck(t, dummyCU, "label", "graphId", false, false, "(apple)", "(x)", "<", "3");
            expect(typeof result).toEqual(typeof (() => false));
        });

        it.each(["someInvalidComparison", "<=>", "<>", "><"])('throws for comparison %s', (c: string) => {
            expect(() => {
                CheckGenerator.getVariableComparisonCheck(t, dummyCU, "label", "graphId", false, false, "(apple)", "(x)", c, "3");
            }).toThrow(ComparisonNotKnownError);
        });

        test('VarEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnVarEvent = fn;
            const cu = cuMock.getCheckUtility();
            const res = CheckGenerator.getVariableComparisonCheck(t, cu, "label", "graphId", false, false, "(apple)", "(x)", "==", "2");
            expect(fn).toHaveBeenLastCalledWith(apple.variables[0].name, "VarComp:(apple):(x):==:2", "label", "graphId", res);
        });

        test('Check works for stage', () => {
            const res = CheckGenerator.getVariableComparisonCheck(t, dummyCU, "label", "graphId", false, false, "stage", "x", "==", "10");
            expect(res()).toEqual(true);
            stage.variables[0].value = 9;
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
                CheckGenerator.getAttributeComparisonCheck(t, dummyCU, "label", "graphId", false, false, "kiwi", "size", c, "3");
            }).toThrow(ComparisonNotKnownError);
        });

        test('Has the correct return type', () => {
            const result = CheckGenerator.getAttributeComparisonCheck(t, dummyCU, "label", "graphId", false, false, "kiwi", "size", "<", "3");
            expect(typeof result).toEqual(typeof (() => false));
        });

        test('OnMoveEvent is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = fn;
            const cu = cuMock.getCheckUtility();
            CheckGenerator.getAttributeComparisonCheck(t, cu, "label", "graphId", false, false, "kiwi", "x", "==", "7");
            expect(fn).toHaveBeenLastCalledWith("kiwi", "AttrComp:kiwi:x:==:7", "label", "graphId", expect.anything());
        });

        test('OnVisualChange is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnVisualChange = fn;
            const cu = cuMock.getCheckUtility();
            CheckGenerator.getAttributeComparisonCheck(t, cu, "label", "graphId", false, false, "kiwi", "size", "<", "42");
            expect(fn).toHaveBeenLastCalledWith("kiwi", "AttrComp:kiwi:size:<:42", "label", "graphId", expect.anything());
        });

        test('Output is registered on CheckUtil', () => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOutput = fn;
            const cu = cuMock.getCheckUtility();
            CheckGenerator.getAttributeComparisonCheck(t, cu, "label", "graphId", false, false, "kiwi", "sayText", "==", "some other text");
            expect(fn).toHaveBeenLastCalledWith("kiwi", "AttrComp:kiwi:sayText:==:some other text", "label", "graphId", expect.anything());
        });

        it.each([false, true])('Returned function includes original sprite (negated: %s)', (negated) => {
            const fn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.registerOnMoveEvent = fn;
            const cu = cuMock.getCheckUtility();
            kiwi.clones = [new SpriteMock("kiwi")];
            kiwi.clones[0].variables = [{name: "x", value: 4}];
            kiwi.clones[0].updateSprite();
            const res = CheckGenerator.getAttributeComparisonCheck(t, cu, "label", "graphId", negated, false, "kiwi", "x", "<", "3");
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
            const res = CheckGenerator.getAttributeComparisonCheck(t, cu, "label", "graphId", negated, false, "kiwi", "x", ">", "15");
            expect(res()).toEqual(!negated);
        });
    });

    describe('getFunctionCheck()', () => {
        it.each([[false, false], [false, true], [true, false], [true, true]])(
            'Returns constant function for negated: %s, param: %s', (negated, value) => {
                const f = CheckGenerator.getFunctionCheck(null, null, "", "", negated, false, String(value));
                expect(f()).toBe(negated ? !value : value);
            });

        test('Throws Exception when function cannot be evaluated', () => {
            expect(() => {
                CheckGenerator.getFunctionCheck(null, null, "", "", false, true, "throw new Error(\"this is an error\");");
            }).toThrow(FunctionEvalError);
        });

        test('Returned function actually uses TestDriver', () => {
            const apple = new SpriteMock("apple");
            const kiwi = new SpriteMock("kiwi");
            const tdMock = new TestDriverMock([apple, kiwi]);
            const cu = getDummyCheckUtility();
            const fn = "(t) => t.getSprites(s => s.name == \"apple\").length == 1";
            const f = CheckGenerator.getFunctionCheck(tdMock.getTestDriver(), cu, "label", "graphID", false, true, fn);
            expect(f()).toBe(true);
            tdMock.currentSprites = {"kiwi": kiwi.sprite};
            expect(f()).toBe(false);
        });
    });
});
