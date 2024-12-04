import {Check, CHECK_NAMES, CheckName} from "../../../../src/whisker/model/components/Check";
import {CheckGenerator} from "../../../../src/whisker/model/util/CheckGenerator";
import {getDummyTestDriver} from "../TestDriverMock";
import {CheckUtilityMock, getDummyCheckUtility} from "../CheckUtilityMock";
import {ArgType, CheckJSON} from "../../../../src/whisker/model/util/schema";
import {Pair} from "../../../../src/whisker/utils/Pair";
import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";

describe('Check', () => {
    const backUp = [];
    beforeAll(() => {
        backUp[0] = CheckGenerator.getAttributeComparisonCheck;
        backUp[1] = CheckGenerator.getAttributeChangeCheck;
        backUp[2] = CheckGenerator.getBackgroundChangeCheck;
        backUp[3] = CheckGenerator.getOutputOnSpriteCheck;
        backUp[4] = CheckGenerator.getVariableChangeCheck;
        backUp[5] = CheckGenerator.getVariableComparisonCheck;
        backUp[6] = CheckGenerator.getSpriteTouchingCheck;
        backUp[7] = CheckGenerator.getSpriteColorTouchingCheck;
        backUp[8] = CheckGenerator.getKeyDownCheck;
        backUp[9] = CheckGenerator.getSpriteClickedCheck;
        backUp[10] = CheckGenerator.getExpressionCheck;
        backUp[11] = CheckGenerator.getProbabilityCheck;
        backUp[12] = CheckGenerator.getTimeElapsedCheck;
        backUp[13] = CheckGenerator.getTimeBetweenCheck;
        backUp[14] = CheckGenerator.getNumberOfClonesCheck;
        backUp[15] = CheckGenerator.getNumberOfClonesCheck;
        backUp[16] = CheckGenerator.getTouchingEdgeCheck;
        backUp[17] = CheckGenerator.getTouchingEdgeCheck;
        backUp[18] = CheckGenerator.getTouchingEdgeCheck;
        backUp[19] = CheckGenerator.getTimeAfterEndCheck;
    });
    afterEach(() => {
        CheckGenerator.getAttributeComparisonCheck = backUp[0];
        CheckGenerator.getAttributeChangeCheck = backUp[1];
        CheckGenerator.getBackgroundChangeCheck = backUp[2];
        CheckGenerator.getOutputOnSpriteCheck = backUp[3];
        CheckGenerator.getVariableChangeCheck = backUp[4];
        CheckGenerator.getVariableComparisonCheck = backUp[5];
        CheckGenerator.getSpriteTouchingCheck = backUp[6];
        CheckGenerator.getSpriteColorTouchingCheck = backUp[7];
        CheckGenerator.getKeyDownCheck = backUp[8];
        CheckGenerator.getSpriteClickedCheck = backUp[9];
        CheckGenerator.getExpressionCheck = backUp[10];
        CheckGenerator.getProbabilityCheck = backUp[11];
        CheckGenerator.getTimeElapsedCheck = backUp[12];
        CheckGenerator.getTimeBetweenCheck = backUp[13];
        CheckGenerator.getNumberOfClonesCheck = backUp[14];
        CheckGenerator.getNumberOfClonesCheck = backUp[15];
        CheckGenerator.getTouchingEdgeCheck = backUp[16];
        CheckGenerator.getTouchingEdgeCheck = backUp[17];
        CheckGenerator.getTouchingEdgeCheck = backUp[18];
        CheckGenerator.getTimeAfterEndCheck = backUp[19];
    });

    const t = getDummyTestDriver();
    const cu = getDummyCheckUtility();
    const graphID = "graphID";
    const negated = false;

    test('AttrComp', () => {
        const fn = jest.fn();
        CheckGenerator.getAttributeComparisonCheck = fn;
        const args: ArgType[] = ["apple", "x", "<", 5];
        const check = new Check("id", "label", "AttrComp", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('AttrChange', () => {
        const fn = jest.fn();
        CheckGenerator.getAttributeChangeCheck = fn;
        const args: ArgType[] = ["apple", "size", "-"];
        const check = new Check("id", "label", "AttrChange", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('BackgroundChange', () => {
        const fn = jest.fn();
        CheckGenerator.getBackgroundChangeCheck = fn;
        const args: ArgType[] = ["newBackground"];
        const check = new Check("id", "label", "BackgroundChange", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", negated, ...args);
    });

    test('Output', () => {
        const fn = jest.fn();
        CheckGenerator.getOutputOnSpriteCheck = fn;
        const args: ArgType[] = ["apple", "i have fallen down"];
        const check = new Check("id", "label", "Output", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('VarChange', () => {
        const fn = jest.fn();
        CheckGenerator.getVariableChangeCheck = fn;
        const args: ArgType[] = ["apple", "x", "+"];
        const check = new Check("id", "label", "VarChange", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('VarComp', () => {
        const fn = jest.fn();
        CheckGenerator.getVariableComparisonCheck = fn;
        const args: ArgType[] = ["apple", "x", ">=", "7"];
        const check = new Check("id", "label", "VarComp", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('SpriteTouching', () => {
        const fn = jest.fn();
        CheckGenerator.getSpriteTouchingCheck = fn;
        const args: ArgType[] = ["apple", "bowl"];
        const check = new Check("id", "label", "SpriteTouching", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('SpriteColor', () => {
        const fn = jest.fn();
        CheckGenerator.getSpriteColorTouchingCheck = fn;
        const args: ArgType[] = ["apple", 128, 128, 128];
        const check = new Check("id", "label", "SpriteColor", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('Key', () => {
        const fn = jest.fn();
        CheckGenerator.getKeyDownCheck = fn;
        const args: ArgType[] = ["a"];
        const check = new Check("id", "label", "Key", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, negated, ...args);
    });

    test('Click', () => {
        const fn = jest.fn();
        CheckGenerator.getSpriteClickedCheck = fn;
        const args: ArgType[] = ["banana"];
        const check = new Check("id", "label", "Click", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, ...args);
    });

    test('Expr', () => {
        const fn = jest.fn();
        CheckGenerator.getExpressionCheck = fn;
        const args: ArgType[] = ["$(Cat. x) > 25"];
        const check = new Check("id", "label", "Expr", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('Probability', () => {
        const fn = jest.fn();
        CheckGenerator.getProbabilityCheck = fn;
        const args: ArgType[] = [0.5];
        const check = new Check("id", "label", "Probability", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, ...args);
    });

    test('TimeElapsed', () => {
        const fn = jest.fn();
        CheckGenerator.getTimeElapsedCheck = fn;
        const args: ArgType[] = [1000];
        const check = new Check("id", "label", "TimeElapsed", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, ...args);
    });

    test('TimeBetween', () => {
        const fn = jest.fn();
        CheckGenerator.getTimeBetweenCheck = fn;
        const args: ArgType[] = [500];
        const check = new Check("id", "label", "TimeBetween", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, ...args);
    });

    test('NbrOfClones', () => {
        const fn = jest.fn();
        CheckGenerator.getNumberOfClonesCheck = fn;
        const args: ArgType[] = ["apple", ">=", "1"];
        const check = new Check("id", "label", "NbrOfClones", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, false, ...args);
    });

    test('NbrOfVisibleClones', () => {
        const fn = jest.fn();
        CheckGenerator.getNumberOfClonesCheck = fn;
        const args: ArgType[] = ["apple", "==", "1"];
        const check = new Check("id", "label", "NbrOfVisibleClones", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, true, ...args);
    });

    test('TouchingEdge', () => {
        const fn = jest.fn();
        CheckGenerator.getTouchingEdgeCheck = fn;
        const args: ArgType[] = ["apple"];
        const check = new Check("id", "label", "TouchingEdge", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, "apple");
    });

    test('TouchingHorizEdge', () => {
        const fn = jest.fn();
        CheckGenerator.getTouchingEdgeCheck = fn;
        const args: ArgType[] = ["apple"];
        const check = new Check("id", "label", "TouchingHorizEdge", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, "apple", false);
    });

    test('TouchingVerticalEdge', () => {
        const fn = jest.fn();
        CheckGenerator.getTouchingEdgeCheck = fn;
        const args: ArgType[] = ["apple"];
        const check = new Check("id", "label", "TouchingVerticalEdge", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, "apple", true, false);
    });

    test('TimeAfterEnd', () => {
        const fn = jest.fn();
        CheckGenerator.getTimeAfterEndCheck = fn;
        const args: ArgType[] = [200];
        const check = new Check("id", "label", "TimeAfterEnd", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, ...args);
    });

    test('Invalid comparison throws error', () => {
        expect(() => {
            const c1 = new Check("id", "label", "AttrComp", true, ["sprite", "var", "comp", "value"]);
            const c2 = new Check("id", "label", "AttrComp", true, ["sprite", "var", ">=", "value"]);
            c1.contradicts(c2);
        }).toThrow();
    });
});

describe('Condition', () => {

    function checkConstructorThrows(c: CheckName, n: boolean, args: ArgType[]) {
        expect(() => new Check("id", "edgeID", c, n, args)).toThrow();
    }

    describe('Constructor throws for empty args', () => {
        const constructorArguments: [CheckName, boolean, ArgType[]][] = CHECK_NAMES.map(c => [c, true, []]);
        it.each(constructorArguments)('throws for CheckName: %s', checkConstructorThrows);
    });

    test("constructor throws for undefined id", () => {
        expect(() => {
            new Check(undefined, undefined, "BackgroundChange", true, ["test"]);
        }).toThrow();
    });

    test("constructor does not throw for undefined edgeLabel", () => {
        expect(() => {
            new Check("test", undefined, "BackgroundChange", true, ["test"]);
        }).not.toThrow();
    });

    test("Getters work properly", () => {
        const c = new Check("test", undefined, "BackgroundChange", true, ["test"]);
        expect(c.id).toBe("test");
        expect(c.negated).toBe(true);
        expect(c.name).toBe("BackgroundChange");
        expect(c.args.length).toBe(1);
        expect(c.args[0]).toBe("test");
        expect(() => {
            c.check;
        }).not.toThrow();
    });

    test("toJSON", () => {
        const id = "id";
        const checkName = "BackgroundChange";
        const negated = true;
        const args: ArgType[] = ["test"];
        const condition = new Check(id, "edgeID", checkName, negated, args);
        const actual = condition.toJSON();
        const expected: CheckJSON = {
            id: id,
            name: checkName,
            negated: negated,
            args: args
        };
        expect(actual).toStrictEqual(expected);
    });

    describe("not enough arguments in args for constructor", () => {
        describe("not enough arguments: sprite color", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["SpriteColor", true, ["test"]],
                ["SpriteColor", true, ["test", "0"]],
                ["SpriteColor", true, ["test", "0", "1"]],
                ["SpriteColor", true, [undefined, undefined, "test", "0", "1"]],
                ["SpriteColor", true, ["test", undefined, undefined, "0", "1"]],
                ["SpriteColor", true, ["test", "0", undefined, undefined, "1"]],
                ["SpriteColor", true, ["test", "0", "2", undefined]]
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: sprite touching", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["SpriteTouching", true, ["test"]],
                ["SpriteTouching", true, ["test", undefined]],
                ["SpriteTouching", true, [undefined, undefined, "test"]]
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough argument: nbrofclones", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["NbrOfClones", true, ["spritename"]],
                ["NbrOfClones", true, ["spritename", "="]],
                ["NbrOfVisibleClones", true, ["spritename"]],
                ["NbrOfVisibleClones", true, ["spritename", "="]]
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: output", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["Output", true, ["test"]],
                ["Output", true, ["test", undefined]],
                ["Output", true, [undefined, "test"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: variable change", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["VarChange", true, ["test"]],
                ["VarChange", true, ["test", "test2"]],
                ["VarChange", true, ["test", "test2", undefined]],
                ["VarChange", true, [undefined, undefined, "test", "test2"]],
                ["VarChange", true, ["test", undefined, undefined, "test2"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: variable comparison", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["VarComp", true, ["test"]],
                ["VarComp", true, ["test", "test2"]],
                ["VarComp", true, ["test", "test2", ">"]],
                ["VarComp", true, ["test", "test2", ">", undefined]],
                ["VarComp", true, ["test", "test2", undefined]],
                ["VarComp", true, ["test", undefined, undefined, "test2"]],
                ["VarComp", true, [undefined, undefined, "test", "test2"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: attribute change", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["AttrChange", true, ["test"]],
                ["AttrChange", true, ["test", "test2"]],
                ["AttrChange", true, ["test", "test2", undefined]],
                ["AttrChange", true, ["test", undefined, undefined, "test2"]],
                ["AttrChange", true, [undefined, undefined, "test", "test2"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: attribute comparison", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["AttrComp", true, ["test"]],
                ["AttrComp", true, ["test", "test2"]],
                ["AttrComp", true, ["test", "test2", ">"]],
                ["AttrComp", true, ["test", "test2", ">", undefined]],
                ["AttrComp", true, ["test", "test2", undefined]],
                ["AttrComp", true, ["test", undefined, undefined, "test2"]],
                ["AttrComp", true, [undefined, undefined, "test", "test2"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });
    });

    describe('toString()', () => {
        const constructorArguments: [CheckName, boolean, ArgType[], string][] = [
            ["AttrChange", false, ["test", "attr", "-"], "AttrChange(test,attr,-)"],
            ["AttrComp", true, ["sprite", "attr", ">", "0"], "!AttrComp(sprite,attr,>,0)"],
            ["BackgroundChange", true, ["test"], "!BackgroundChange(test)"],
            ["Click", true, ["test"], "!Click(test)"],
            ["Key", true, ["test"], "!Key(test)"],
            ["Output", true, ["test", "hallo"], "!Output(test,hallo)"],
            ["SpriteColor", true, ["test", "0", "1", "2"], "!SpriteColor(test,0,1,2)"],
            ["SpriteTouching", true, ["test", "test2"], "!SpriteTouching(test,test2)"],
            ["VarComp", true, ["sprite", "var", ">", "0"], "!VarComp(sprite,var,>,0)"],
            ["VarChange", true, ["test", "var", "+"], "!VarChange(test,var,+)"],
            ["Expr", true, ["test"], "!Expr(test)"],
            ["Probability", true, ["0"], "!Probability(0)"],
            ["TimeElapsed", true, ["1000"], "!TimeElapsed(1000)"],
            ["TimeBetween", true, ["1000"], "!TimeBetween(1000)"],
            ["TimeAfterEnd", true, ["1000"], "!TimeAfterEnd(1000)"],
            ["NbrOfClones", true, ["sprite", "=", "1"], "!NbrOfClones(sprite,=,1)"],
            ["NbrOfVisibleClones", true, ["sprite", "=", "1"], "!NbrOfVisibleClones(sprite,=,1)"],
            ["TouchingEdge", true, ["sprite"], "!TouchingEdge(sprite)"]
        ];

        it.each(constructorArguments)('(%s, %s, %s) has the correct toString()', (c: CheckName, n: boolean, args: ArgType[], expected: string) => {
            expect(new Check("id", "edgeID", c, n, args).toString()).toBe(expected);
        });
    });

    test('Condition.check() returns false before registerComponent()', () => {
        const condition = new Check("id", "edgeID", "AttrChange", false, ["test", "attr", "-"]);
        expect(condition.check(1, 1)).toBe(false);
    });

    const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
    const cu = cuMock.getCheckUtility();

    test('registerComponent() calculates correct effect', () => {
        const effect = new Check("id", "edgeID", "Key", true, ["a"]);
        effect.registerComponents(null, cu, "graphID");
        const func = effect.check;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(true);
        cuMock.pressedKeys["a"] = true;
        expect(func(0, 0)).toEqual(false);
    });

    test('registerComponent() clears effect in error case', () => {
        const condition = new Check("id", "edgeID", "Key", true, ["a"]);
        const error = new Error("this is a message");
        condition.registerComponents(null, cu, "graphID");
        condition.checkArgsWithTestDriver = (t, cu, args) => {
            throw error;
        };
        const fn = jest.fn();
        cu.addErrorOutput = fn;
        condition.registerComponents(null, cu, "graphID");
        const func = condition.check;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(false);
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(false);
        expect(fn).toHaveBeenCalledWith("edgeID", "graphID", error);
    });
});

describe('Effect', () => {

    const id = "id";
    const edgeID = "edgeID";

    type TableEntry = [CheckName, boolean, ArgType[], CheckName, boolean, ArgType[], boolean];

    function assertSymmetricContradiction(effect1: Check, effect2: Check, expected: boolean) {
        expect(effect1.contradicts(effect2)).toBe(expected);
        expect(effect2.contradicts(effect1)).toBe(expected);
    }

    function assertSymmetricContradiction2(effect1: Check, checkName: CheckName, negated: boolean,
                                           args: ArgType[], expected: boolean) {
        assertSymmetricContradiction(effect1, new Check(id, edgeID, checkName, negated, args), expected);
    }

    function checkConstructorThrows(c: CheckName, n: boolean, args: ArgType[]) {
        expect(() => new Check(id, edgeID, c, n, args)).toThrow();
    }

    function mapToTwoEffects(checkName1: CheckName, negated1: boolean, args1: ArgType[],
                             checkName2: CheckName, negated2: boolean, args2: ArgType[], expected: boolean): [Check, Check, boolean] {
        return [
            new Check(id, edgeID, checkName1, negated1, args1),
            new Check(id, edgeID, checkName2, negated2, args2), expected
        ];
    }

    function mapToRightFormat(table: TableEntry[]): [Check, Check, boolean][] {
        return table.map((entry: TableEntry) => {
            return mapToTwoEffects(...entry);
        });
    }

    function getEffectsCombinationsFor(id: string, edgeLabel: string, first: CheckName, optionsFirst: string[],
                                       second: CheckName, optionsSecond: string[]): [Check, Check, boolean][] {
        const effects: [Check, Check, boolean][] = [];
        for (const option1 of optionsFirst) {
            const effect1 = new Check(id, edgeLabel, first, true, [id, edgeLabel, option1, "0"]);
            for (const option2 of optionsSecond) {
                const effect2 = new Check(id, edgeLabel, second, true, [id, edgeLabel, option2]);
                effects.push([effect1, effect2, false]);
            }
        }
        return effects;
    }

    const optionsFirst = [">", ">=", "=", "<=", "<"];
    const optionsSecond = ["+", "+=", "=", "-=", "-"];

    function getEffectComparisonChangeCombinations(first: CheckName, second: CheckName): [Check, Check, boolean][] {
        return getEffectsCombinationsFor("sprite", "var", first, optionsFirst, second, optionsSecond);
    }

    describe('Constructor throws exception vor invalid arguments', () => {

        describe('Constructor throws for empty args', () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = CHECK_NAMES.map(c => [c, true, []]);
            it.each(constructorArguments)('throws for CheckName: %s', checkConstructorThrows);
        });

        describe("constructor throws if not enough arguments in args", () => {

            describe("not enough arguments: sprite events", () => {
                const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                    ["SpriteColor", true, ["spritename"]],
                    ["SpriteColor", true, ["spritename", "1"]],
                    ["SpriteColor", true, ["spritename", "1", "2"]],
                    ["SpriteColor", true, ["spritename", "1", "2", undefined]],
                    ["SpriteColor", true, [undefined, "spritename", "1", "2"]],
                    ["SpriteColor", true, ["spritename", undefined, "1", "2"]],
                    ["SpriteColor", true, ["spritename", "1", undefined, "2"]],
                    ["SpriteTouching", true, ["spritename"]],
                    ["SpriteTouching", true, ["spritename", undefined]],
                    ["SpriteTouching", true, [undefined, "spritename"]]
                ];
                it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
            });

            describe("not enough argument: nbrofclones", () => {
                const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                    ["NbrOfClones", true, ["spritename"]],
                    ["NbrOfClones", true, ["spritename", "="]],
                    ["NbrOfVisibleClones", true, ["spritename"]],
                    ["NbrOfVisibleClones", true, ["spritename", "="]]
                ];
                it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
            });

            describe("not enough arguments: output", () => {
                const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                    ["Output", true, ["test"]],
                    ["Output", true, ["test", undefined]],
                    ["Output", true, [undefined, "test"]],
                ];
                it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
            });

            describe("not enough arguments: variable change", () => {
                const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                    ["VarChange", true, ["test"]],
                    ["VarChange", true, ["test", "test2"]],
                    ["VarChange", true, ["test", "test2", undefined]],
                    ["VarChange", true, [undefined, "test", "test2"]],
                    ["VarChange", true, ["test", undefined, "test2"]],
                ];
                it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
            });

            describe("not enough arguments: variable comparison", () => {
                const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                    ["VarComp", true, ["test"]],
                    ["VarComp", true, ["test", "test2"]],
                    ["VarComp", true, ["test", "test2", ">"]],
                    ["VarComp", true, ["test", "test2", ">", undefined]],
                    ["VarComp", true, ["test", "test2", undefined]],
                    ["VarComp", true, ["test", undefined, "test2"]],
                    ["VarComp", true, [undefined, "test", "test2"]],
                ];
                it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
            });

            describe("not enough arguments: attribute change", () => {
                const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                    ["AttrChange", true, ["test"]],
                    ["AttrChange", true, ["test", "test2"]],
                    ["AttrChange", true, ["test", "test2", undefined]],
                    ["AttrChange", true, ["test", undefined, "test2"]],
                    ["AttrChange", true, [undefined, "test", "test2"]],
                ];
                it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
            });

            describe("not enough arguments: attribute comparison", () => {
                const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                    ["AttrComp", true, ["test"]],
                    ["AttrComp", true, ["test", "test2"]],
                    ["AttrComp", true, ["test", "test2", ">"]],
                    ["AttrComp", true, ["test", "test2", ">", undefined]],
                    ["AttrComp", true, ["test", "test2", undefined]],
                    ["AttrComp", true, ["test", undefined, "test2"]],
                    ["AttrComp", true, [undefined, "test", "test2"]],
                ];
                it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
            });
        });
    });

    describe('toString()', () => {
        const toStrings: [CheckName, boolean, ArgType[], string][] = [
            ["AttrChange", true, ["test", "attr", "-"], "!AttrChange(test,attr,-)"],
            ["AttrComp", false, ["sprite", "attr", ">", "0"], "AttrComp(sprite,attr,>,0)"],
            ["BackgroundChange", true, ["test"], "!BackgroundChange(test)"],
            ["Click", true, ["sprite"], "!Click(sprite)"],
            ["Key", true, ["test"], "!Key(test)"],
            ["Output", true, ["test", "hallo"], "!Output(test,hallo)"],
            ["SpriteColor", true, ["sprite", "0", "0", "0"], "!SpriteColor(sprite,0,0,0)"],
            ["SpriteTouching", true, ["sprite1", "sprite2"], "!SpriteTouching(sprite1,sprite2)"],
            ["VarChange", true, ["test", "var", "+"], "!VarChange(test,var,+)"],
            ["VarComp", true, ["sprite", "var", ">", "0"], "!VarComp(sprite,var,>,0)"],
            ["Expr", true, ["test"], "!Expr(test)"],
            ["Probability", true, ["0"], "!Probability(0)"],
            ["TimeElapsed", true, ["1000"], "!TimeElapsed(1000)"],
            ["TimeBetween", true, ["1000"], "!TimeBetween(1000)"],
            ["TimeAfterEnd", true, ["1000"], "!TimeAfterEnd(1000)"],
            ["NbrOfClones", true, ["sprite", "=", "1"], "!NbrOfClones(sprite,=,1)"],
            ["NbrOfVisibleClones", true, ["sprite", "=", "1"], "!NbrOfVisibleClones(sprite,=,1)"],
            ["TouchingEdge", true, ["sprite"], "!TouchingEdge(sprite)"],
        ];
        it.each(toStrings)('toString() of (%s, %s, %s)',
            (checkName: CheckName, negated: boolean, args: ArgType[], expected: string) => {
                expect(new Check(id, edgeID, checkName, negated, args).toString()).toBe(expected);
            });
    });

    test("effect.contradicts() throws for null argument", () => {
        expect(() => {
            const effect = new Check(id, edgeID, "AttrComp", true, ["sprite", "attr", ">", "0"]);
            effect.contradicts(null);
        }).toThrow();
    });

    test("effect.check() returns false before calling registerComponents()", () => {
        const effect = new Check(id, edgeID, "AttrComp", true, ["sprite", "attr", ">", "0"]);
        expect(effect.check(0, 0)).toBe(false);
    });

    describe('Contradictions', () => {
        describe('Contradictions I', () => {

            function createAllPairs<A>(values: A[]): Pair<A>[] {
                const pairs: Pair<A>[] = [];
                for (let i = 0; i < values.length; i++) {
                    for (let j = i + 1; j < values.length; j++) {
                        pairs.push([values[i], values[j]]);
                    }
                }
                return pairs;
            }

            const effects: Check[] = [
                new Check(id, edgeID, "Output", true, ["sprite", "hi"]),
                new Check(id, edgeID, "VarChange", true, ["test", "var", "+"]),
                new Check(id, edgeID, "AttrChange", true, ["test", "attr", "-"]),
                new Check(id, edgeID, "BackgroundChange", true, ["test"]),
                new Check(id, edgeID, "VarComp", true, ["sprite", "var", ">", "0"]),
                new Check(id, edgeID, "AttrComp", true, ["sprite", "attr", ">", "0"]),
                new Check(id, edgeID, "Key", true, ["right arrow"]),
                new Check(id, edgeID, "Click", true, ["sprite"]),
                new Check(id, edgeID, "SpriteColor", true, ["sprite", 255, 0, 0]),
                new Check(id, edgeID, "SpriteTouching", true, ["sprite", "sprite1"]),
                new Check(id, edgeID, "TouchingEdge", true, ["sprite"]),
                new Check(id, edgeID, "NbrOfVisibleClones", true, ["sprite", "=", "1"]),
                new Check(id, edgeID, "NbrOfClones", true, ["sprite", "=", "1"]),
                new Check(id, edgeID, "TimeAfterEnd", true, ["1000"]),
                new Check(id, edgeID, "TimeBetween", true, ["1000"]),
                new Check(id, edgeID, "TimeElapsed", true, ["1000"]),
                new Check(id, edgeID, "Probability", true, ["0"]),
                new Check(id, edgeID, "Expr", true, ["test"]),
            ];

            it.each(createAllPairs(effects))('%s and %s do not contradict each other',
                (a, b) => assertSymmetricContradiction(a, b, false));
        });

        test("contradictions output", () => {
            const output = new Check(id, edgeID, "Output", true, ["sprite", "hi"]);
            assertSymmetricContradiction2(output, "Output", true, ["sprite1", "hi"], false);
            assertSymmetricContradiction2(output, "Output", true, ["sprite", "hi"], false);
            assertSymmetricContradiction2(output, "Output", true, ["sprite", "hi2"], true);
        });

        test("contradictions background", () => {
            const background = new Check(id, edgeID, "BackgroundChange", true, ["test"]);
            assertSymmetricContradiction2(background, "BackgroundChange", true, ["test"], false);
            assertSymmetricContradiction2(background, "BackgroundChange", true, ["test2"], true);
        });

        describe("contradiction: variable change and comparison", () => {
            test('not the same sprite', () => {
                const varChange = new Check(id, edgeID, "VarChange", true, ["test", "var", "+"]);
                const varComp = new Check(id, edgeID, "VarComp", true, ["sprite", "var", ">", "0"]);
                assertSymmetricContradiction(varChange, varComp, false);
            });

            test('not the same var', () => {
                const varChange = new Check(id, edgeID, "VarChange", true, ["sprite", "var", "+"]);
                const varComp = new Check(id, edgeID, "VarComp", true, ["sprite", "var2", ">", "0"]);
                assertSymmetricContradiction(varChange, varComp, false);
            });


            describe('VarComp and VarChange', () => {
                it.each(getEffectComparisonChangeCombinations("VarComp", "VarChange"))(
                    '%s does not contradict %s', assertSymmetricContradiction);
            });
        });

        describe("contradiction: attribute comparison and change", () => {
            test('not the same sprite', () => {
                const attrChange = new Check(id, edgeID, "AttrChange", true, ["test", "var", "+"]);
                const attrComp = new Check(id, edgeID, "AttrComp", true, ["sprite", "var", ">", "0"]);
                assertSymmetricContradiction(attrChange, attrComp, false);
            });

            test('not the same var', () => {
                const attrChange = new Check(id, edgeID, "AttrChange", true, ["sprite", "var", "+"]);
                const attrComp = new Check(id, edgeID, "AttrComp", true, ["sprite", "var2", ">", "0"]);
                assertSymmetricContradiction(attrChange, attrComp, false);
            });

            describe('AttrComp and AttrChange', () => {
                it.each(getEffectComparisonChangeCombinations("AttrComp", "AttrChange"))(
                    '%s does not contradict %s', assertSymmetricContradiction);
            });
        });

        describe("contradictions: var/attr change", () => {
            const table: TableEntry[] = [
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", true, ['sprite', 'var', '+'], false],
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", true, ['sprite', 'var', '-'], false],
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", true, ['sprite', 'var', '='], false],
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", true, ['sprite', 'var', '+='], false],
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", true, ['sprite', 'var', '-='], true],

                // other names
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", true, ['sprite2', 'var', '='], false],
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", true, ['sprite', 'var2', '='], false],

                ["VarChange", true, ['sprite', 'var', '-'], "VarChange", true, ['sprite', 'var', '+='], true],
                ["VarChange", true, ['sprite', 'var', '-'], "VarChange", true, ['sprite', 'var', '-='], false],

                //attrChange
                ["AttrChange", true, ['sprite', 'var', '+'], "AttrChange", true, ['sprite', 'var', '+'], false],
                ["AttrChange", true, ['sprite', 'var', '+'], "AttrChange", true, ['sprite', 'var', '-'], false],
                ["AttrChange", true, ['sprite', 'var', '+'], "AttrChange", true, ['sprite', 'var', '='], false],
                ["AttrChange", true, ['sprite', 'var', '+'], "AttrChange", true, ['sprite', 'var', '+='], false],
                ["AttrChange", true, ['sprite', 'var', '+'], "AttrChange", true, ['sprite', 'var', '-='], true],

                //other names
                ["AttrChange", true, ['sprite', 'var', '+'], "AttrChange", true, ['sprite2', 'var', '='], false],
                ["AttrChange", true, ['sprite', 'var', '+'], "AttrChange", true, ['sprite', 'var2', '='], false],

                ["AttrChange", true, ['sprite', 'var', '-'], "AttrChange", true, ['sprite', 'var', '+='], true],
                ["AttrChange", true, ['sprite', 'var', '-'], "AttrChange", true, ['sprite', 'var', '-='], false],

                // different values
                ["VarChange", true, ['sprite', 'var', '-5'], "VarChange", true, ['sprite', 'var', '-7'], true],
                ["VarChange", true, ['sprite', 'var', '+5'], "VarChange", true, ['sprite', 'var', '+7'], true],
                ["AttrChange", false, ['sprite', 'var', '-5'], "AttrChange", false, ['sprite', 'var', '-7'], true],
                ["AttrChange", false, ['sprite', 'var', '+5'], "AttrChange", false, ['sprite', 'var', '+7'], true],
            ];

            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        describe("varChange += -=", () => {
            const table: TableEntry[] = [
                ["VarChange", true, ['sprite', 'var', '+='], "VarChange", true, ['sprite', 'var', '+='], false],
                ["VarChange", false, ['sprite', 'var', '+='], "VarChange", false, ['sprite', 'var', '+='], false],
                ["VarChange", false, ['sprite', 'var', '+='], "VarChange", true, ['sprite', 'var', '+='], true],

                ["VarChange", true, ['sprite', 'var', '-='], "VarChange", true, ['sprite', 'var', '-='], false],
                ["VarChange", false, ['sprite', 'var', '-='], "VarChange", false, ['sprite', 'var', '-='], false],
                ["VarChange", false, ['sprite', 'var', '-='], "VarChange", true, ['sprite', 'var', '-='], true],

                ["VarChange", false, ['sprite', 'var', '+='], "VarChange", true, ['sprite', 'var', '-='], false],
                ["VarChange", true, ['sprite', 'var', '+='], "VarChange", true, ['sprite', 'var', '-='], true]
            ];

            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        describe('contradictions: variable comparison', () => {
            const table: TableEntry[] = [
                ["VarComp", true, ["sprite", "var", ">", "0"], "VarComp", true, ["sprite", "var", ">", "1"], false],
                ["VarComp", true, ["sprite", "var", ">", "0"], "VarComp", true, ["sprite", "var", ">=", "1"], false],
                ["VarComp", true, ["sprite", "var", ">=", "0"], "VarComp", true, ["sprite", "var", ">=", "1"], false],
                ["VarComp", true, ["sprite2", "var", ">=", "0"], "VarComp", true, ["sprite", "var", ">=", "1"], false],
                ["VarComp", true, ["sprite", "var2", ">=", "0"], "VarComp", true, ["sprite", "var", ">=", "1"], false],

                ["VarComp", true, ["sprite", "var", "<", "0"], "VarComp", true, ["sprite", "var", "<", "1"], false],
                ["VarComp", true, ["sprite", "var", "<", "0"], "VarComp", true, ["sprite", "var", "<=", "1"], false],
                ["VarComp", true, ["sprite", "var", "<=", "0"], "VarComp", true, ["sprite", "var", "<=", "1"], false],

                ["VarComp", false, ["sprite", "var", "=", "0"], "VarComp", false, ["sprite", "var", "=", "1"], true],
                ["VarComp", false, ["sprite", "var", "=", "0"], "VarComp", true, ["sprite", "var", "=", "0"], true],

                ["VarComp", true, ["sprite", "var", "=", "0"], "VarComp", true, ["sprite", "var", "=", "1"], false],
                ["VarComp", true, ["sprite", "var", "=", "0"], "VarComp", true, ["sprite", "var", "=", "0"], false],

                ["VarComp", true, ["sprite", "var", "<", "0"], "VarComp", true, ["sprite", "var", "=", "1"], false],
                ["VarComp", true, ["sprite", "var", "<", "0"], "VarComp", false, ["sprite", "var", "=", "-1"], true],
                ["VarComp", true, ["sprite", "var", "<", "2"], "VarComp", true, ["sprite", "var", "=", "1"], false],

                ["VarComp", true, ["sprite", "var", "<=", "0"], "VarComp", true, ["sprite", "var", "=", "1"], false],
                ["VarComp", true, ["sprite", "var", "<=", "2"], "VarComp", true, ["sprite", "var", "=", "1"], false],
                ["VarComp", true, ["sprite", "var", "<=", "2"], "VarComp", false, ["sprite", "var", "=", "-1"], true],
                ["VarComp", true, ["sprite", "var", "<=", "1"], "VarComp", true, ["sprite", "var", "=", "1"], false],

                ["VarComp", true, ["sprite", "var", ">", "1"], "VarComp", true, ["sprite", "var", "=", "1"], false],
                ["VarComp", true, ["sprite", "var", ">", "1"], "VarComp", false, ["sprite", "var", "=", "2"], true],
                ["VarComp", true, ["sprite", "var", ">", "0"], "VarComp", true, ["sprite", "var", "=", "1"], false],

                ["VarComp", true, ["sprite", "var", ">=", "2"], "VarComp", true, ["sprite", "var", "=", "1"], false],
                ["VarComp", true, ["sprite", "var", ">=", "2"], "VarComp", false, ["sprite", "var", "=", "3"], true],
                ["VarComp", true, ["sprite", "var", ">=", "0"], "VarComp", true, ["sprite", "var", "=", "1"], false],
                ["VarComp", true, ["sprite", "var", ">=", "1"], "VarComp", true, ["sprite", "var", "=", "1"], false],

                ["VarComp", false, ["sprite", "var", "<", "3"], "VarComp", false, ["sprite", "var", ">", "1"], false],
                ["VarComp", true, ["sprite", "var", "<", "1"], "VarComp", true, ["sprite", "var", ">", "1"], false],
                ["VarComp", true, ["sprite", "var", "<=", "1"], "VarComp", true, ["sprite", "var", ">=", "1"], true],
                ["VarComp", false, ["sprite", "var", "<", "1"], "VarComp", false, ["sprite", "var", ">", "1"], true],
                ["VarComp", true, ["sprite", "var", "<", "-1"], "VarComp", true, ["sprite", "var", ">", "1"], false],

                ["VarComp", true, ["sprite", "var", "<", "3"], "VarComp", true, ["sprite", "var", ">=", "1"], true],
                ["VarComp", false, ["sprite", "var", "<", "3"], "VarComp", false, ["sprite", "var", ">=", "1"], false],
                ["VarComp", true, ["sprite", "var", "<", "1"], "VarComp", true, ["sprite", "var", ">=", "1"], true],
                ["VarComp", false, ["sprite", "var", "<", "-1"], "VarComp", false, ["sprite", "var", ">=", "1"], true],

                ["VarComp", true, ["sprite", "var", "<=", "3"], "VarComp", true, ["sprite", "var", ">", "1"], true],
                ["VarComp", false, ["sprite", "var", "<=", "1"], "VarComp", false, ["sprite", "var", ">", "1"], true],
                ["VarComp", false, ["sprite", "var", "<=", "-1"], "VarComp", false, ["sprite", "var", ">", "1"], true],

                ["VarComp", false, ["sprite", "var", "<=", "3"], "VarComp", false, ["sprite", "var", ">=", "1"], false],
                ["VarComp", false, ["sprite", "var", "<=", "1"], "VarComp", false, ["sprite", "var", ">=", "1"], false],
                ["VarComp", false, ["sprite", "var", "<=", "-1"], "VarComp", false, ["sprite", "var", ">=", "1"], true],
            ];
            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        test("contradiction: click", () => {
            const effect1 = new Check(id, edgeID, "Click", true, ["sprite1"]);
            assertSymmetricContradiction2(effect1, "Click", true, ["sprite2"], true);
            assertSymmetricContradiction2(effect1, "Click", true, ["sprite1"], false);
        });

        test("contradiction: key", () => {
            const effect1 = new Check(id, edgeID, "Key", true, ["left"]);
            assertSymmetricContradiction2(effect1, "Key", true, ["right"], false);
            assertSymmetricContradiction2(effect1, "Key", true, ["left"], false);
        });

        test("contradiction: sprite color", () => {
            const effect1 = new Check(id, edgeID, "SpriteColor", true, ["sprite1", "0", "0", "0"]);
            assertSymmetricContradiction2(effect1, "SpriteColor", true, ["sprite2", "0", "0", "0"], false);
            // it can touch multiple colors at the same time
            assertSymmetricContradiction2(effect1, "SpriteColor", true, ["sprite1", "0", "0", "1"], false);
        });

        test("contradiction: sprite touching", () => {
            const effect1 = new Check(id, edgeID, "SpriteTouching", true, ["sprite1", "sprite2"]);
            assertSymmetricContradiction2(effect1, "SpriteTouching", true, ["sprite2", "sprite3"], false);
            assertSymmetricContradiction2(effect1, "SpriteTouching", true, ["sprite1", "sprite3"], false);
        });

        test("contradiction: expr", () => {
            const effect1 = new Check(id, edgeID, "Expr", true, ["whatever"]);
            assertSymmetricContradiction2(effect1, "Expr", true, ["whatever2"], false);
            assertSymmetricContradiction2(effect1, "Click", true, ["whatever"], false);
        });

        // actually an effect with probability result is quite dumb to have....
        test("contradiction: probability", () => {
            const effect1 = new Check(id, edgeID, "Probability", true, ["1"]);
            assertSymmetricContradiction2(effect1, "Probability", true, ["9"], false);
            assertSymmetricContradiction2(effect1, "Probability", true, ["1"], false);
        });

        describe("contradiction: time", () => {
            const table: TableEntry[] = [
                ["TimeElapsed", true, ["1000"], "TimeElapsed", true, ["2000"], false],
                ["TimeElapsed", true, ["1000"], "TimeElapsed", true, ["1000"], false],
                ["TimeBetween", true, ["1000"], "TimeBetween", true, ["2000"], false],
                ["TimeBetween", true, ["1000"], "TimeBetween", true, ["1000"], false],
                ["TimeAfterEnd", true, ["1000"], "TimeAfterEnd", true, ["2000"], false],
                ["TimeAfterEnd", true, ["1000"], "TimeAfterEnd", true, ["1000"], false],
            ];
            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        describe("contradiction: clones", () => {
            const table: TableEntry[] = [
                ["NbrOfClones", true, ["sprite", "=", "1"], "NbrOfClones", true, ["sprite2", "=", "2"], false],
                ["NbrOfClones", true, ["sprite", "=", "1"], "NbrOfClones", true, ["sprite", "=", "1"], false],
                ["NbrOfClones", true, ["sprite", "=", "1"], "NbrOfClones", true, ["sprite", "=", "2"], false],
                ["NbrOfClones", true, ["sprite", "=", "1"], "NbrOfClones", false, ["sprite", "=", "2"], false],

                ["NbrOfClones", true, ["sprite", "=", "1"], "NbrOfClones", false, ["sprite", "=", "1"], true],

                ["NbrOfVisibleClones", true, ["sprite", "=", "1"], "NbrOfVisibleClones", true, ["sprite2", "=", "2"], false],
                ["NbrOfVisibleClones", true, ["sprite", "=", "1"], "NbrOfVisibleClones", true, ["sprite", "=", "1"], false],
                ["NbrOfVisibleClones", true, ["sprite", "=", "1"], "NbrOfVisibleClones", true, ["sprite", "=", "2"], false],
            ];
            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);

            // other comparisons are valid as long as AttrComp and VarComp tests are ok (same comparison)
        });

        test("contradiction: expr", () => {
            const effect1 = new Check(id, edgeID, "TouchingEdge", true, ["sprite"]);
            assertSymmetricContradiction2(effect1, "TouchingEdge", true, ["sprite2"], false);
            assertSymmetricContradiction2(effect1, "TouchingEdge", true, ["sprite"], false);
        });

        test("contradiction negation", () => {
            const effect1 = new Check(id, edgeID, "TouchingEdge", true, ["sprite"]);
            assertSymmetricContradiction2(effect1, "TouchingEdge", true, ["sprite"], false);
            assertSymmetricContradiction2(effect1, "TouchingEdge", false, ["sprite2"], false);
            assertSymmetricContradiction2(effect1, "TouchingEdge", false, ["sprite"], true);
        });

        describe("contradiction negation attr/var change", () => {
            const table: TableEntry[] = [
                ["VarChange", true, ['sprite', 'var', '+5'], "VarChange", false, ['sprite', 'var', '+5'], true],

                // inverted
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", false, ['sprite', 'var', '+'], true],
                ["VarChange", true, ['sprite', 'var', '-'], "VarChange", false, ['sprite', 'var', '-'], true],
                ["VarChange", true, ['sprite', 'var', '='], "VarChange", false, ['sprite', 'var', '='], true],
                ["VarChange", true, ['sprite', 'var', '-'], "VarChange", false, ['sprite', 'var', '+='], false],
                ["VarChange", true, ['sprite', 'var', '-'], "VarChange", true, ['sprite', 'var', '+='], true],
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", false, ['sprite', 'var', '-='], false],
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", true, ['sprite', 'var', '-='], true],

                // NO increase
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", true, ['sprite', 'var', '-'], false],
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", false, ['sprite', 'var', '-'], false],
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", true, ['sprite', 'var', '='], false],
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", false, ['sprite', 'var', '='], false],
                ["VarChange", true, ['sprite', 'var', '+'], "VarChange", false, ['sprite', 'var', '-='], false],

                // increase
                ["VarChange", false, ['sprite', 'var', '+'], "VarChange", true, ['sprite', 'var', '-'], false],
                ["VarChange", false, ['sprite', 'var', '+'], "VarChange", false, ['sprite', 'var', '-'], true],
                ["VarChange", false, ['sprite', 'var', '+'], "VarChange", true, ['sprite', 'var', '='], false],
                ["VarChange", false, ['sprite', 'var', '+'], "VarChange", false, ['sprite', 'var', '='], true],
                ["VarChange", false, ['sprite', 'var', '+'], "VarChange", false, ['sprite', 'var', '+='], false],
                ["VarChange", false, ['sprite', 'var', '+'], "VarChange", false, ['sprite', 'var', '-='], true],
            ];
            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        describe("contradiction negation attr/var comparison", () => {
            const table: TableEntry[] = [
                ["AttrComp", true, ["sprite", "var", ">=", "0"], "AttrComp", true, ["sprite", "var", ">=", "0"], false],
                ["AttrComp", true, ["sprite", "var", ">=", "0"], "AttrComp", false, ["sprite", "var", "<", "0"], false],
                ["AttrComp", true, ["sprite", "var", ">=", "0"], "AttrComp", true, ["sprite", "var", "<", "0"], true],

                ["AttrComp", false, ["sprite", "var", ">=", "0"], "AttrComp", true, ["sprite", "var", "<", "0"], false],
                ["AttrComp", false, ["sprite", "var", ">=", "0"], "AttrComp", false, ["sprite", "var", "<", "0"], true],

                ["AttrComp", false, ["sprite", "var", ">", "0"], "AttrComp", true, ["sprite", "var", ">=", "0"], true],
                ["AttrComp", false, ["sprite", "var", ">", "0"], "AttrComp", false, ["sprite", "var", ">=", "0"], false],

                ["AttrComp", false, ["sprite", "var", "<", "0"], "AttrComp", true, ["sprite", "var", "<=", "0"], true],
                ["AttrComp", false, ["sprite", "var", "<", "0"], "AttrComp", false, ["sprite", "var", "<=", "0"], false],

                ["AttrComp", false, ["sprite", "var", "=", "0"], "AttrComp", true, ["sprite", "var", "<=", "0"], true],
                ["AttrComp", false, ["sprite", "var", "=", "0"], "AttrComp", false, ["sprite", "var", "<=", "0"], false],
                ["AttrComp", false, ["sprite", "var", "=", "0"], "AttrComp", true, ["sprite", "var", ">=", "0"], true],
                ["AttrComp", false, ["sprite", "var", "=", "0"], "AttrComp", false, ["sprite", "var", ">=", "0"], false],
                ["AttrComp", false, ["sprite", "var", "=", "0"], "AttrComp", false, ["sprite", "var", "<", "0"], true],
                ["AttrComp", false, ["sprite", "var", "=", "0"], "AttrComp", true, ["sprite", "var", "<", "0"], false],
                ["AttrComp", false, ["sprite", "var", "=", "0"], "AttrComp", false, ["sprite", "var", ">", "0"], true],
                ["AttrComp", false, ["sprite", "var", "=", "0"], "AttrComp", true, ["sprite", "var", ">", "0"], false],

                ["AttrComp", false, ["sprite", "var", "=", "0"], "AttrComp", true, ["sprite", "var", "<=", "2"], true],
                ["AttrComp", false, ["sprite", "var", "=", "0"], "AttrComp", false, ["sprite", "var", "<=", "2"], false],
            ];
            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        test('contradiction with event strings', () => {
            const attrComp = new Check(id, edgeID, "AttrComp", false, ["sprite", "var", "=", "0"]);
            expect(attrComp.testForContradictingWithEvents([CheckUtility.getEventString("AttrComp", true,
                "sprite", "var", "<=", "2")])).toBe(true);
            expect(attrComp.testForContradictingWithEvents([CheckUtility.getEventString("AttrComp", false,
                "sprite", "var", "<=", "2")])).toBe(false);
        });
    });

    const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
    const cu = cuMock.getCheckUtility();

    test('registerComponent() calculates correct effect', () => {
        const effect = new Check(id, edgeID, "Key", true, ["a"]);
        effect.registerComponents(null, cu, "graphID");
        const func = effect.check;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(true);
        cuMock.pressedKeys["a"] = true;
        expect(func(0, 0)).toEqual(false);
    });

    test('registerComponent() clears effect in error case', () => {
        const effect = new Check(id, edgeID, "Key", true, ["a"]);
        const error = new Error("this is a message");
        effect.registerComponents(null, cu, "graphID");
        effect.checkArgsWithTestDriver = (t, cu, args) => {
            throw error;
        };
        const fn = jest.fn();
        cu.addErrorOutput = fn;
        effect.registerComponents(null, cu, "graphID");
        const func = effect.check;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(false);
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(false);
        expect(fn).toHaveBeenCalledWith(edgeID, "graphID", error);
    });
});
