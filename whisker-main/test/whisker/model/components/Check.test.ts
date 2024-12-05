import {getDummyTestDriver} from "../TestDriverMock";
import {CheckUtilityMock, getDummyCheckUtility} from "../CheckUtilityMock";
import {AttrComp, AttrCompArgs} from "../../../../src/whisker/model/checks/AttrComp";
import {AttrChange, AttrChangeArgs} from "../../../../src/whisker/model/checks/AttrChange";
import {
    BackgroundChange,
    BackgroundChangeArgs,
    BackgroundChangeJSON
} from "../../../../src/whisker/model/checks/BackgroundChange";
import {Output, OutputArgs} from "../../../../src/whisker/model/checks/Output";
import {VarChange, VarChangeArgs} from "../../../../src/whisker/model/checks/VarChange";
import {VarComp, VarCompArgs} from "../../../../src/whisker/model/checks/VarComp";
import {SpriteTouching, SpriteTouchingArgs} from "../../../../src/whisker/model/checks/SpriteTouching";
import {SpriteColor, SpriteColorArgs} from "../../../../src/whisker/model/checks/SpriteColor";
import {Key, KeyArgs} from "../../../../src/whisker/model/checks/Key";
import {Click, ClickArgs} from "../../../../src/whisker/model/checks/Click";
import {Expr, ExprArgs} from "../../../../src/whisker/model/checks/Expr";
import {Probability, ProbabilityArgs} from "../../../../src/whisker/model/checks/Probability";
import {TimeElapsed, TimeElapsedArgs} from "../../../../src/whisker/model/checks/TimeElapsed";
import {TimeBetween, TimeBetweenArgs} from "../../../../src/whisker/model/checks/TimeBetween";
import {NbrOfClones, NbrOfClonesArgs, NbrOfVisibleClones} from "../../../../src/whisker/model/checks/NbrOfClones";
import {
    TouchingEdge,
    TouchingEdgeArgs,
    TouchingHorizEdge,
    TouchingVerticalEdge
} from "../../../../src/whisker/model/checks/TouchingEdge";
import {TimeAfterEnd, TimeAfterEndArgs} from "../../../../src/whisker/model/checks/TimeAfterEnd";
import {CHECK_NAMES, CheckName, newCheck} from "../../../../src/whisker/model/checks/newCheck";
import {ArgType} from "../../../../src/whisker/model/util/schema";
import {AbstractCheck} from "../../../../src/whisker/model/checks/AbstractCheck";
import {Pair} from "../../../../src/whisker/utils/Pair";
import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";

describe('Check', () => {
    const t = getDummyTestDriver();
    const cu = getDummyCheckUtility();
    const graphID = "graphID";
    const negated = false;

    test('AttrComp', () => {
        const args: AttrCompArgs = ["apple", "x", "<", 5];
        const fn = jest.spyOn(AttrComp.prototype, '_checkArgsWithTestDriver').mockImplementationOnce(() => void 0);
        const check = new AttrComp("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('AttrChange', () => {
        const args: AttrChangeArgs = ["apple", "size", "-"];
        const fn = jest.spyOn(AttrChange.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new AttrChange("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('BackgroundChange', () => {
        const args: BackgroundChangeArgs = ["newBackground"];
        const fn = jest.spyOn(BackgroundChange.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new BackgroundChange("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('Output', () => {
        const args: OutputArgs = ["apple", "i have fallen down"];
        const fn = jest.spyOn(Output.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new Output("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('VarChange', () => {
        const args: VarChangeArgs = ["apple", "x", "+"];
        const fn = jest.spyOn(VarChange.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new VarChange("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('VarComp', () => {
        const args: VarCompArgs = ["apple", "x", ">=", "7"];
        const fn = jest.spyOn(VarComp.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new VarComp("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('SpriteTouching', () => {
        const args: SpriteTouchingArgs = ["apple", "bowl"];
        const fn = jest.spyOn(SpriteTouching.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new SpriteTouching("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('SpriteColor', () => {
        const args: SpriteColorArgs = ["apple", 128, 128, 128];
        const fn = jest.spyOn(SpriteColor.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new SpriteColor("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('Key', () => {
        const args: KeyArgs = ["a"];
        const fn = jest.spyOn(Key.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new Key("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('Click', () => {
        const args: ClickArgs = ["banana"];
        const fn = jest.spyOn(Click.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new Click("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('Expr', () => {
        const args: ExprArgs = ["$(Cat. x) > 25"];
        const fn = jest.spyOn(Expr.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new Expr("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('Probability', () => {
        const args: ProbabilityArgs = [0.5];
        const fn = jest.spyOn(Probability.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new Probability("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('TimeElapsed', () => {
        const args: TimeElapsedArgs = [1000];
        const fn = jest.spyOn(TimeElapsed.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new TimeElapsed("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('TimeBetween', () => {
        const args: TimeBetweenArgs = [500];
        const fn = jest.spyOn(TimeBetween.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new TimeBetween("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('NbrOfClones', () => {
        const args: NbrOfClonesArgs = ["apple", ">=", 1];
        const fn = jest.spyOn(NbrOfClones.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new NbrOfClones("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('NbrOfVisibleClones', () => {
        const args: NbrOfClonesArgs = ["apple", "==", 1];
        const fn = jest.spyOn(NbrOfVisibleClones.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new NbrOfVisibleClones("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('TouchingEdge', () => {
        const args: TouchingEdgeArgs = ["apple"];
        const fn = jest.spyOn(TouchingEdge.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new TouchingEdge("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('TouchingHorizEdge', () => {
        const args: TouchingEdgeArgs = ["apple"];
        const fn = jest.spyOn(TouchingHorizEdge.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new TouchingHorizEdge("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('TouchingVerticalEdge', () => {
        const args: TouchingEdgeArgs = ["apple"];
        const fn = jest.spyOn(TouchingVerticalEdge.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new TouchingVerticalEdge("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('TimeAfterEnd', () => {
        const args: TimeAfterEndArgs = [200];
        const fn = jest.spyOn(TimeAfterEnd.prototype, "_checkArgsWithTestDriver").mockImplementationOnce(() => void 0);
        const check = new TimeAfterEnd("label", {id: "id", negated, args});
        check._checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, graphID);
    });

    test('Invalid comparison throws error', () => {
        const c1 = new AttrComp("label", {id: "id", negated: true, args: ["sprite", "var", "comp", "value"]});
        const c2 = new AttrComp("label", {id: "id", negated: true, args: ["sprite", "var", ">=", "value"]});
        expect(() => c1.contradicts(c2)).toThrow();
    });
});


describe('Condition', () => {
    function checkConstructorThrows(name: CheckName, negated: boolean, args) {
        expect(() => newCheck("edgeID", {name, id: "id", negated, args})).toThrow();
    }

    describe.skip('Constructor throws for empty args', () => {

        const constructorArguments: [CheckName, boolean, ArgType[]][] = CHECK_NAMES.map(c => [c, true, []]);
        it.each(constructorArguments)('throws for CheckName: %s', checkConstructorThrows);
    });

    test.skip("constructor throws for undefined id", () => {
        expect(() => {
            new BackgroundChange(undefined, {id: undefined, negated: true, args: ["test"]});
        }).toThrow();
    });

    test("constructor does not throw for undefined edgeLabel", () => {
        expect(() => {
            new BackgroundChange(undefined, {id: "test", negated: true, args: ["test"]});
        }).not.toThrow();
    });

    test("Getters work properly", () => {
        const c = new BackgroundChange(undefined, {id: "test", negated: true, args: ["test"]});
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
        const args: BackgroundChangeArgs = ["test"];
        const condition = new BackgroundChange("edgeID", {id, negated, args});
        const actual = condition.toJSON();
        const expected: BackgroundChangeJSON = {
            id: id,
            name: checkName,
            negated: negated,
            args: args
        };
        expect(actual).toStrictEqual(expected);
    });

    describe.skip("not enough arguments in args for constructor", () => {
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

        it.each(constructorArguments)('(%s, %s, %s) has the correct toString()', (name: CheckName, negated: boolean, args, expected: string) => {
            expect(newCheck("edgeID", {name, id: "id", negated, args: args as any}).toString()).toBe(expected);
        });
    });

    test('Condition.check() returns false before registerComponent()', () => {
        const condition = new AttrChange("edgeID", {id: "id", negated: false, args: ["test", "attr", "-"]});
        expect(condition.check(1, 1)).toBe(false);
    });

    const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
    const cu = cuMock.getCheckUtility();

    test('registerComponent() calculates correct effect', () => {
        const effect = new Key("edgeID", {id: "id", negated: true, args: ["a"]});
        effect.registerComponents(null, cu, "graphID");
        const func = effect.check;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(true);
        cuMock.pressedKeys["a"] = true;
        expect(func(0, 0)).toEqual(false);
    });

    test('registerComponent() clears effect in error case', () => {
        const condition = new Key("edgeID", {id: "id", negated: true, args: ["a"]});
        const error = new Error("this is a message");
        condition.registerComponents(null, cu, "graphID");
        condition._checkArgsWithTestDriver = (t, cu, args) => {
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

    function assertSymmetricContradiction(effect1: AbstractCheck, effect2: AbstractCheck, expected: boolean) {
        expect(effect1.contradicts(effect2)).toBe(expected);
        expect(effect2.contradicts(effect1)).toBe(expected);
    }

    function assertSymmetricContradiction2(effect1: AbstractCheck, name: CheckName, negated: boolean,
                                           args: ArgType[], expected: boolean) {
        assertSymmetricContradiction(effect1, newCheck(edgeID, {id, name, negated, args: args as any}), expected);
    }

    function checkConstructorThrows(name: CheckName, negated: boolean, args: ArgType[]) {
        expect(() => newCheck(edgeID, {id, name, negated, args: args as any})).toThrow();
    }

    function mapToTwoEffects(checkName1: CheckName, negated1: boolean, args1: ArgType[],
                             checkName2: CheckName, negated2: boolean, args2: ArgType[], expected: boolean): [AbstractCheck, AbstractCheck, boolean] {
        return [
            newCheck(edgeID, {id, name: checkName1, negated: negated1, args: args1 as any}),
            newCheck(edgeID, {id, name: checkName2, negated: negated2, args: args2 as any}), expected
        ];
    }

    function mapToRightFormat(table: TableEntry[]): [AbstractCheck, AbstractCheck, boolean][] {
        return table.map((entry: TableEntry) => {
            return mapToTwoEffects(...entry);
        });
    }

    function getEffectsCombinationsFor(id: string, edgeLabel: string, first: CheckName, optionsFirst: string[],
                                       second: CheckName, optionsSecond: string[]): [AbstractCheck, AbstractCheck, boolean][] {
        const effects: [AbstractCheck, AbstractCheck, boolean][] = [];
        for (const option1 of optionsFirst) {
            const effect1 = newCheck(edgeLabel, {
                id,
                name: first,
                negated: true,
                args: [id, edgeLabel, option1, "0"] as any
            });
            for (const option2 of optionsSecond) {
                const effect2 = newCheck(edgeLabel, {
                    id,
                    name: second,
                    negated: true,
                    args: [id, edgeLabel, option2] as any
                });
                effects.push([effect1, effect2, false]);
            }
        }
        return effects;
    }

    const optionsFirst = [">", ">=", "=", "<=", "<"];
    const optionsSecond = ["+", "+=", "=", "-=", "-"];

    function getEffectComparisonChangeCombinations(first: CheckName, second: CheckName): [AbstractCheck, AbstractCheck, boolean][] {
        return getEffectsCombinationsFor("sprite", "var", first, optionsFirst, second, optionsSecond);
    }

    describe.skip('Constructor throws exception vor invalid arguments', () => {

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
            (name: CheckName, negated: boolean, args: ArgType[], expected: string) => {
                expect(newCheck(edgeID, {id, name, negated, args: args as any}).toString()).toBe(expected);
            });
    });

    test("effect.contradicts() throws for null argument", () => {
        expect(() => {
            const effect = newCheck(edgeID, {id, name: "AttrComp", negated: true, args: ["sprite", "attr", ">", "0"]});
            effect.contradicts(null);
        }).toThrow();
    });

    test("effect.check() returns false before calling registerComponents()", () => {
        const effect = newCheck(edgeID, {id, name: "AttrComp", negated: true, args: ["sprite", "attr", ">", "0"]});
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

            const effects: AbstractCheck[] = [
                newCheck(edgeID, {id, name: "Output", negated: true, args: ["sprite", "hi"]}),
                newCheck(edgeID, {id, name: "VarChange", negated: true, args: ["test", "var", "+"]}),
                newCheck(edgeID, {id, name: "AttrChange", negated: true, args: ["test", "attr", "-"]}),
                newCheck(edgeID, {id, name: "BackgroundChange", negated: true, args: ["test"]}),
                newCheck(edgeID, {id, name: "VarComp", negated: true, args: ["sprite", "var", ">", "0"]}),
                newCheck(edgeID, {id, name: "AttrComp", negated: true, args: ["sprite", "attr", ">", "0"]}),
                newCheck(edgeID, {id, name: "Key", negated: true, args: ["right arrow"]}),
                newCheck(edgeID, {id, name: "Click", negated: true, args: ["sprite"]}),
                newCheck(edgeID, {id, name: "SpriteColor", negated: true, args: ["sprite", 255, 0, 0]}),
                newCheck(edgeID, {id, name: "SpriteTouching", negated: true, args: ["sprite", "sprite1"]}),
                newCheck(edgeID, {id, name: "TouchingEdge", negated: true, args: ["sprite"]}),
                newCheck(edgeID, {id, name: "NbrOfVisibleClones", negated: true, args: ["sprite", "=", 1]}),
                newCheck(edgeID, {id, name: "NbrOfClones", negated: true, args: ["sprite", "=", 1]}),
                newCheck(edgeID, {id, name: "TimeAfterEnd", negated: true, args: [1000]}),
                newCheck(edgeID, {id, name: "TimeBetween", negated: true, args: [1000]}),
                newCheck(edgeID, {id, name: "TimeElapsed", negated: true, args: [1000]}),
                newCheck(edgeID, {id, name: "Probability", negated: true, args: [0]}),
                newCheck(edgeID, {id, name: "Expr", negated: true, args: ["test"]}),
            ];

            it.each(createAllPairs(effects))('%s and %s do not contradict each other',
                (a, b) => assertSymmetricContradiction(a, b, false));
        });

        test("contradictions output", () => {
            const output = newCheck(edgeID, {id, name: "Output", negated: true, args: ["sprite", "hi"]});
            assertSymmetricContradiction2(output, "Output", true, ["sprite1", "hi"], false);
            assertSymmetricContradiction2(output, "Output", true, ["sprite", "hi"], false);
            assertSymmetricContradiction2(output, "Output", true, ["sprite", "hi2"], true);
        });

        test("contradictions background", () => {
            const background = newCheck(edgeID, {id, name: "BackgroundChange", negated: true, args: ["test"]});
            assertSymmetricContradiction2(background, "BackgroundChange", true, ["test"], false);
            assertSymmetricContradiction2(background, "BackgroundChange", true, ["test2"], true);
        });

        describe("contradiction: variable change and comparison", () => {
            test('not the same sprite', () => {
                const varChange = newCheck(edgeID, {id, name: "VarChange", negated: true, args: ["test", "var", "+"]});
                const varComp = newCheck(edgeID, {
                    id,
                    name: "VarComp",
                    negated: true,
                    args: ["sprite", "var", ">", "0"]
                });
                assertSymmetricContradiction(varChange, varComp, false);
            });

            test('not the same var', () => {
                const varChange = newCheck(edgeID, {
                    id,
                    name: "VarChange",
                    negated: true,
                    args: ["sprite", "var", "+"]
                });
                const varComp = newCheck(edgeID, {
                    id,
                    name: "VarComp",
                    negated: true,
                    args: ["sprite", "var2", ">", "0"]
                });
                assertSymmetricContradiction(varChange, varComp, false);
            });


            describe('VarComp and VarChange', () => {
                it.each(getEffectComparisonChangeCombinations("VarComp", "VarChange"))(
                    '%s does not contradict %s', assertSymmetricContradiction);
            });
        });

        describe("contradiction: attribute comparison and change", () => {
            test('not the same sprite', () => {
                const attrChange = newCheck(edgeID, {
                    id,
                    name: "AttrChange",
                    negated: true,
                    args: ["test", "var", "+"]
                });
                const attrComp = newCheck(edgeID, {
                    id,
                    name: "AttrComp",
                    negated: true,
                    args: ["sprite", "var", ">", "0"]
                });
                assertSymmetricContradiction(attrChange, attrComp, false);
            });

            test('not the same var', () => {
                const attrChange = newCheck(edgeID, {
                    id,
                    name: "AttrChange",
                    negated: true,
                    args: ["sprite", "var", "+"]
                });
                const attrComp = newCheck(edgeID, {
                    id,
                    name: "AttrComp",
                    negated: true,
                    args: ["sprite", "var2", ">", "0"]
                });
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
            const effect1 = newCheck(edgeID, {id, name: "Click", negated: true, args: ["sprite1"]});
            assertSymmetricContradiction2(effect1, "Click", true, ["sprite2"], true);
            assertSymmetricContradiction2(effect1, "Click", true, ["sprite1"], false);
        });

        test("contradiction: key", () => {
            const effect1 = newCheck(edgeID, {id, name: "Key", negated: true, args: ["left"]});
            assertSymmetricContradiction2(effect1, "Key", true, ["right"], false);
            assertSymmetricContradiction2(effect1, "Key", true, ["left"], false);
        });

        test("contradiction: sprite color", () => {
            const effect1 = newCheck(edgeID, {
                id,
                name: "SpriteColor",
                negated: true,
                args: ["sprite1", 0, 0, 0]
            });
            assertSymmetricContradiction2(effect1, "SpriteColor", true, ["sprite2", "0", "0", "0"], false);
            // it can touch multiple colors at the same time
            assertSymmetricContradiction2(effect1, "SpriteColor", true, ["sprite1", "0", "0", "1"], false);
        });

        test("contradiction: sprite touching", () => {
            const effect1 = newCheck(edgeID, {id, name: "SpriteTouching", negated: true, args: ["sprite1", "sprite2"]});
            assertSymmetricContradiction2(effect1, "SpriteTouching", true, ["sprite2", "sprite3"], false);
            assertSymmetricContradiction2(effect1, "SpriteTouching", true, ["sprite1", "sprite3"], false);
        });

        test("contradiction: expr", () => {
            const effect1 = newCheck(edgeID, {id, name: "Expr", negated: true, args: ["whatever"]});
            assertSymmetricContradiction2(effect1, "Expr", true, ["whatever2"], false);
            assertSymmetricContradiction2(effect1, "Click", true, ["whatever"], false);
        });

        // actually an effect with probability result is quite dumb to have....
        test("contradiction: probability", () => {
            const effect1 = newCheck(edgeID, {id, name: "Probability", negated: true, args: [1]});
            assertSymmetricContradiction2(effect1, "Probability", true, ["0"], false);
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
            const effect1 = newCheck(edgeID, {id, name: "TouchingEdge", negated: true, args: ["sprite"]});
            assertSymmetricContradiction2(effect1, "TouchingEdge", true, ["sprite2"], false);
            assertSymmetricContradiction2(effect1, "TouchingEdge", true, ["sprite"], false);
        });

        test("contradiction negation", () => {
            const effect1 = newCheck(edgeID, {id, name: "TouchingEdge", negated: true, args: ["sprite"]});
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
            const attrComp = newCheck(edgeID, {
                id,
                name: "AttrComp",
                negated: false,
                args: ["sprite", "var", "=", "0"]
            });

            const attrComp2 = new AttrComp(edgeID, {id, negated: true, args: ["sprite", "var", "<=", "2"]});
            const attrComp3 = new AttrComp(edgeID, {id, negated: false, args: ["sprite", "var", "<=", "2"]});

            expect(attrComp.testForContradictingWithEvents([attrComp2.getEventString()])).toBe(true);
            expect(attrComp.testForContradictingWithEvents([attrComp3.getEventString()])).toBe(false);
        });
    });

    const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
    const cu = cuMock.getCheckUtility();

    test('registerComponent() calculates correct effect', () => {
        const effect = newCheck(edgeID, {id, name: "Key", negated: true, args: ["a"]});
        effect.registerComponents(null, cu, "graphID");
        const func = effect.check;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(true);
        cuMock.pressedKeys["a"] = true;
        expect(func(0, 0)).toEqual(false);
    });

    test('registerComponent() clears effect in error case', () => {
        const effect = newCheck(edgeID, {id, name: "Key", negated: true, args: ["a"]});
        const error = new Error("this is a message");
        effect.registerComponents(null, cu, "graphID");
        (effect as any)._checkArgsWithTestDriver = (t, cu, args) => {
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
