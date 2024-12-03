import {Condition} from "../../../../src/whisker/model/components/Condition";
import {CHECK_NAMES, CheckName} from "../../../../src/whisker/model/components/Check";
import {CheckUtilityMock} from "../CheckUtilityMock";
import {ArgType, CheckJSON} from "../../../../src/whisker/model/util/schema";

describe('Condition', () => {

    function checkConstructorThrows(c: CheckName, n: boolean, args: ArgType[]) {
        expect(() => new Condition("id", "edgeID", c, n, args)).toThrow();
    }

    describe('Constructor throws for empty args', () => {
        const constructorArguments: [CheckName, boolean, ArgType[]][] = CHECK_NAMES.map(c => [c, true, []]);
        it.each(constructorArguments)('throws for CheckName: %s', checkConstructorThrows);
    });

    test("constructor throws for undefined id", () => {
        expect(() => {
            new Condition(undefined, undefined, "BackgroundChange", true, ["test"]);
        }).toThrow();
    });

    test("constructor does not throw for undefined edgeLabel", () => {
        expect(() => {
            new Condition("test", undefined, "BackgroundChange", true, ["test"]);
        }).not.toThrow();
    });

    test("Getters work properly", () => {
        const c = new Condition("test", undefined, "BackgroundChange", true, ["test"]);
        expect(c.id).toBe("test");
        expect(c.negated).toBe(true);
        expect(c.name).toBe("BackgroundChange");
        expect(c.args.length).toBe(1);
        expect(c.args[0]).toBe("test");
        expect(() => {
            c.condition;
        }).not.toThrow();
    });

    test("toJSON", () => {
        const id = "id";
        const checkName = "BackgroundChange";
        const negated = true;
        const args: ArgType[] = ["test"];
        const condition = new Condition(id, "edgeID", checkName, negated, args);
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
            ["Function", true, ["()=>{return null;}"], "!Function(()=>{return null;})"],
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
            expect(new Condition("id", "edgeID", c, n, args).toString()).toBe(expected);
        });
    });

    test('Condition.check() returns false before registerComponent()', () => {
        const condition = new Condition("id", "edgeID", "AttrChange", false, ["test", "attr", "-"]);
        expect(condition.check(1, 1)).toBe(false);
    });

    const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
    const cu = cuMock.getCheckUtility();

    test('registerComponent() calculates correct effect', () => {
        const effect = new Condition("id", "edgeID", "Key", true, ["a"]);
        effect.registerComponents(null, cu, "graphID");
        const func = effect.condition;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(true);
        cuMock.pressedKeys["a"] = true;
        expect(func(0, 0)).toEqual(false);
    });

    test('registerComponent() clears effect in error case', () => {
        const condition = new Condition("id", "edgeID", "Key", true, ["a"]);
        const error = new Error("this is a message");
        condition.registerComponents(null, cu, "graphID");
        condition.checkArgsWithTestDriver = (t, cu, args) => {
            throw error;
        };
        const fn = jest.fn();
        cu.addErrorOutput = fn;
        condition.registerComponents(null, cu, "graphID");
        const func = condition.condition;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(false);
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(false);
        expect(fn).toHaveBeenCalledWith("edgeID", "graphID", error);
    });
});
