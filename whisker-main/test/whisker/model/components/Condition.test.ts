import {Condition} from "../../../../src/whisker/model/components/Condition";
import {ArgType, CheckName, SimpleCheck} from "../../../../src/whisker/model/components/Check";
import {CheckUtilityMock} from "../CheckUtilityMock";

describe('Condition', () => {

    function checkConstructorThrows(c: CheckName, n: boolean, args: ArgType[]) {
        expect(() => new Condition("id", "edgeID", c, n, args)).toThrow();
    }

    describe('Constructor throws for empty args', () => {
        const constructorArguments: [CheckName, boolean, ArgType[]][] = Object.values(CheckName).map(c => [c, true, []]);
        it.each(constructorArguments)('throws for CheckName: %s', checkConstructorThrows);
    });

    test("constructor throws for undefined id", () => {
        expect(() => {
            new Condition(undefined, undefined, CheckName.BackgroundChange, true, ["test"]);
        }).toThrow();
    });

    test("constructor does not throw for undefined edgeLabel", () => {
        expect(() => {
            new Condition("test", undefined, CheckName.BackgroundChange, true, ["test"]);
        }).not.toThrow();
    });

    test("Getters work properly", () => {
        const c = new Condition("test", undefined, CheckName.BackgroundChange, true, ["test"]);
        expect(c.id).toBe("test");
        expect(c.negated).toBe(true);
        expect(c.name).toBe(CheckName.BackgroundChange);
        expect(c.args.length).toBe(1);
        expect(c.args[0]).toBe("test");
        expect(() => {
            c.condition;
        }).not.toThrow();
    });

    test("toJSON", () => {
        const id = "id";
        const checkName = CheckName.BackgroundChange;
        const negated = true;
        const args: ArgType[] = ["test"];
        const condition = new Condition(id, "edgeID", checkName, negated, args);
        const actual = condition.toJSON();
        const expected: SimpleCheck = {
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
                [CheckName.SpriteColor, true, ["test"]],
                [CheckName.SpriteColor, true, ["test", "0"]],
                [CheckName.SpriteColor, true, ["test", "0", "1"]],
                [CheckName.SpriteColor, true, [undefined, undefined, "test", "0", "1"]],
                [CheckName.SpriteColor, true, ["test", undefined, undefined, "0", "1"]],
                [CheckName.SpriteColor, true, ["test", "0", undefined, undefined, "1"]],
                [CheckName.SpriteColor, true, ["test", "0", "2", undefined]]
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: sprite touching", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                [CheckName.SpriteTouching, true, ["test"]],
                [CheckName.SpriteTouching, true, ["test", undefined]],
                [CheckName.SpriteTouching, true, [undefined, undefined, "test"]]
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough argument: nbrofclones", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                [CheckName.NbrOfClones, true, ["spritename"]],
                [CheckName.NbrOfClones, true, ["spritename", "="]],
                [CheckName.NbrOfVisibleClones, true, ["spritename"]],
                [CheckName.NbrOfVisibleClones, true, ["spritename", "="]]
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: output", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                [CheckName.Output, true, ["test"]],
                [CheckName.Output, true, ["test", undefined]],
                [CheckName.Output, true, [undefined, "test"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: variable change", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                [CheckName.VarChange, true, ["test"]],
                [CheckName.VarChange, true, ["test", "test2"]],
                [CheckName.VarChange, true, ["test", "test2", undefined]],
                [CheckName.VarChange, true, [undefined, undefined, "test", "test2"]],
                [CheckName.VarChange, true, ["test", undefined, undefined, "test2"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: variable comparison", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                [CheckName.VarComp, true, ["test"]],
                [CheckName.VarComp, true, ["test", "test2"]],
                [CheckName.VarComp, true, ["test", "test2", ">"]],
                [CheckName.VarComp, true, ["test", "test2", ">", undefined]],
                [CheckName.VarComp, true, ["test", "test2", undefined]],
                [CheckName.VarComp, true, ["test", undefined, undefined, "test2"]],
                [CheckName.VarComp, true, [undefined, undefined, "test", "test2"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: attribute change", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                [CheckName.AttrChange, true, ["test"]],
                [CheckName.AttrChange, true, ["test", "test2"]],
                [CheckName.AttrChange, true, ["test", "test2", undefined]],
                [CheckName.AttrChange, true, ["test", undefined, undefined, "test2"]],
                [CheckName.AttrChange, true, [undefined, undefined, "test", "test2"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: attribute comparison", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                [CheckName.AttrComp, true, ["test"]],
                [CheckName.AttrComp, true, ["test", "test2"]],
                [CheckName.AttrComp, true, ["test", "test2", ">"]],
                [CheckName.AttrComp, true, ["test", "test2", ">", undefined]],
                [CheckName.AttrComp, true, ["test", "test2", undefined]],
                [CheckName.AttrComp, true, ["test", undefined, undefined, "test2"]],
                [CheckName.AttrComp, true, [undefined, undefined, "test", "test2"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });
    });

    describe('toString()', () => {
        const constructorArguments: [CheckName, boolean, ArgType[], string][] = [
            [CheckName.AttrChange, false, ["test", "attr", "-"], "AttrChange(test,attr,-)"],
            [CheckName.AttrComp, true, ["sprite", "attr", ">", "0"], "!AttrComp(sprite,attr,>,0)"],
            [CheckName.BackgroundChange, true, ["test"], "!BackgroundChange(test)"],
            [CheckName.Click, true, ["test"], "!Click(test)"],
            [CheckName.Function, true, ["()=>{return null;}"], "!Function(()=>{return null;})"],
            [CheckName.Key, true, ["test"], "!Key(test)"],
            [CheckName.Output, true, ["test", "hallo"], "!Output(test,hallo)"],
            [CheckName.SpriteColor, true, ["test", "0", "1", "2"], "!SpriteColor(test,0,1,2)"],
            [CheckName.SpriteTouching, true, ["test", "test2"], "!SpriteTouching(test,test2)"],
            [CheckName.VarComp, true, ["sprite", "var", ">", "0"], "!VarComp(sprite,var,>,0)"],
            [CheckName.VarChange, true, ["test", "var", "+"], "!VarChange(test,var,+)"],
            [CheckName.Expr, true, ["test"], "!Expr(test)"],
            [CheckName.Probability, true, ["0"], "!Probability(0)"],
            [CheckName.TimeElapsed, true, ["1000"], "!TimeElapsed(1000)"],
            [CheckName.TimeBetween, true, ["1000"], "!TimeBetween(1000)"],
            [CheckName.TimeAfterEnd, true, ["1000"], "!TimeAfterEnd(1000)"],
            [CheckName.NbrOfClones, true, ["sprite", "=", "1"], "!NbrOfClones(sprite,=,1)"],
            [CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"], "!NbrOfVisibleClones(sprite,=,1)"],
            [CheckName.TouchingEdge, true, ["sprite"], "!TouchingEdge(sprite)"]
        ];

        it.each(constructorArguments)('(%s, %s, %s) has the correct toString()', (c: CheckName, n: boolean, args: ArgType[], expected: string) => {
            expect(new Condition("id", "edgeID", c, n, args).toString()).toBe(expected);
        });
    });

    test('Condition.check() returns false before registerComponent()', () => {
        const condition = new Condition("id", "edgeID", CheckName.AttrChange, false, ["test", "attr", "-"]);
        expect(condition.check(1, 1)).toBe(false);
    });

    const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
    const cu = cuMock.getCheckUtility();

    test('registerComponent() calculates correct effect', () => {
        const effect = new Condition("id", "edgeID", CheckName.Key, true, ["a"]);
        effect.registerComponents(cu, null, "graphID");
        const func = effect.condition;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(true);
        cuMock.pressedKeys["a"] = true;
        expect(func(0, 0)).toEqual(false);
    });

    test('registerComponent() clears effect in error case', () => {
        const condition = new Condition("id", "edgeID", CheckName.Key, true, ["a"]);
        const error = new Error("this is a message");
        condition.registerComponents(cu, null, "graphID");
        condition.checkArgsWithTestDriver = (t, cu, args) => {
            throw error;
        };
        const fn = jest.fn();
        cu.addErrorOutput = fn;
        condition.registerComponents(cu, null, "graphID");
        const func = condition.condition;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(false);
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(false);
        expect(fn).toHaveBeenCalledWith("edgeID", "graphID", error);
    });
});
