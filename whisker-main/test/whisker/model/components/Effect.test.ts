import {Effect} from "../../../../src/whisker/model/components/Effect";
import {ArgType, Check, CheckName} from "../../../../src/whisker/model/components/Check";
import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";
import {Pair} from "../../../../src/whisker/utils/Pair";
import {CheckUtilityMock} from "../CheckUtilityMock";

describe('Effect', () => {

    const id = "id";
    const edgeID = "edgeID";

    type TableEntry = [CheckName, boolean, ArgType[], CheckName, boolean, ArgType[], boolean];

    function assertSymmetricContradiction(effect1: Effect, effect2: Effect, expected: boolean) {
        expect(effect1.contradicts(effect2)).toBe(expected);
        expect(effect2.contradicts(effect1)).toBe(expected);
    }

    function assertSymmetricContradiction2(effect1: Effect, checkName: CheckName, negated: boolean,
                                           args: ArgType[], expected: boolean) {
        assertSymmetricContradiction(effect1, new Effect(id, edgeID, checkName, negated, args), expected);
    }

    function checkConstructorThrows(c: CheckName, n: boolean, args: ArgType[]) {
        expect(() => new Effect(id, edgeID, c, n, args)).toThrow();
    }

    function mapToTwoEffects(checkName1: CheckName, negated1: boolean, args1: ArgType[],
                             checkName2: CheckName, negated2: boolean, args2: ArgType[], expected: boolean): [Effect, Effect, boolean] {
        return [
            new Effect(id, edgeID, checkName1, negated1, args1),
            new Effect(id, edgeID, checkName2, negated2, args2), expected
        ];
    }

    function mapToRightFormat(table: TableEntry[]): [Effect, Effect, boolean][] {
        return table.map((entry: TableEntry) => {
            return mapToTwoEffects(...entry);
        });
    }

    function getEffectsCombinationsFor(id: string, edgeLabel: string, first: CheckName, optionsFirst: string[],
                                       second: CheckName, optionsSecond: string[]): [Effect, Effect, boolean][] {
        const effects: [Effect, Effect, boolean][] = [];
        for (const option1 of optionsFirst) {
            const effect1 = new Effect(id, edgeLabel, first, true, [id, edgeLabel, option1, "0"]);
            for (const option2 of optionsSecond) {
                const effect2 = new Effect(id, edgeLabel, second, true, [id, edgeLabel, option2]);
                effects.push([effect1, effect2, false]);
            }
        }
        return effects;
    }

    const optionsFirst = [">", ">=", "=", "<=", "<"];
    const optionsSecond = ["+", "+=", "=", "-=", "-"];

    function getEffectComparisonChangeCombinations(first: CheckName, second: CheckName): [Effect, Effect, boolean][] {
        return getEffectsCombinationsFor("sprite", "var", first, optionsFirst, second, optionsSecond);
    }

    describe('Constructor throws exception vor invalid arguments', () => {

        describe('Constructor throws for empty args', () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = Object.values(CheckName).map(c => [c, true, []]);
            it.each(constructorArguments)('throws for CheckName: %s', checkConstructorThrows);
        });

        describe("constructor throws if not enough arguments in args", () => {

            describe("not enough arguments: sprite events", () => {
                const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                    [CheckName.SpriteColor, true, ["spritename"]],
                    [CheckName.SpriteColor, true, ["spritename", "1"]],
                    [CheckName.SpriteColor, true, ["spritename", "1", "2"]],
                    [CheckName.SpriteColor, true, ["spritename", "1", "2", undefined]],
                    [CheckName.SpriteColor, true, [undefined, "spritename", "1", "2"]],
                    [CheckName.SpriteColor, true, ["spritename", undefined, "1", "2"]],
                    [CheckName.SpriteColor, true, ["spritename", "1", undefined, "2"]],
                    [CheckName.SpriteTouching, true, ["spritename"]],
                    [CheckName.SpriteTouching, true, ["spritename", undefined]],
                    [CheckName.SpriteTouching, true, [undefined, "spritename"]]
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
                    [CheckName.VarChange, true, [undefined, "test", "test2"]],
                    [CheckName.VarChange, true, ["test", undefined, "test2"]],
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
                    [CheckName.VarComp, true, ["test", undefined, "test2"]],
                    [CheckName.VarComp, true, [undefined, "test", "test2"]],
                ];
                it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
            });

            describe("not enough arguments: attribute change", () => {
                const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                    [CheckName.AttrChange, true, ["test"]],
                    [CheckName.AttrChange, true, ["test", "test2"]],
                    [CheckName.AttrChange, true, ["test", "test2", undefined]],
                    [CheckName.AttrChange, true, ["test", undefined, "test2"]],
                    [CheckName.AttrChange, true, [undefined, "test", "test2"]],
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
                    [CheckName.AttrComp, true, ["test", undefined, "test2"]],
                    [CheckName.AttrComp, true, [undefined, "test", "test2"]],
                ];
                it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
            });
        });
    });

    describe('toString()', () => {
        const toStrings: [CheckName, boolean, ArgType[], string][] = [
            [CheckName.AttrChange, true, ["test", "attr", "-"], "!AttrChange(test,attr,-)"],
            [CheckName.AttrComp, false, ["sprite", "attr", ">", "0"], "AttrComp(sprite,attr,>,0)"],
            [CheckName.BackgroundChange, true, ["test"], "!BackgroundChange(test)"],
            [CheckName.Click, true, ["sprite"], "!Click(sprite)"],
            [CheckName.Function, true, ["test"], "!Function(test)"],
            [CheckName.Key, true, ["test"], "!Key(test)"],
            [CheckName.Output, true, ["test", "hallo"], "!Output(test,hallo)"],
            [CheckName.SpriteColor, true, ["sprite", "0", "0", "0"], "!SpriteColor(sprite,0,0,0)"],
            [CheckName.SpriteTouching, true, ["sprite1", "sprite2"], "!SpriteTouching(sprite1,sprite2)"],
            [CheckName.VarChange, true, ["test", "var", "+"], "!VarChange(test,var,+)"],
            [CheckName.VarComp, true, ["sprite", "var", ">", "0"], "!VarComp(sprite,var,>,0)"],
            [CheckName.Expr, true, ["test"], "!Expr(test)"],
            [CheckName.Probability, true, ["0"], "!Probability(0)"],
            [CheckName.TimeElapsed, true, ["1000"], "!TimeElapsed(1000)"],
            [CheckName.TimeBetween, true, ["1000"], "!TimeBetween(1000)"],
            [CheckName.TimeAfterEnd, true, ["1000"], "!TimeAfterEnd(1000)"],
            [CheckName.NbrOfClones, true, ["sprite", "=", "1"], "!NbrOfClones(sprite,=,1)"],
            [CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"], "!NbrOfVisibleClones(sprite,=,1)"],
            [CheckName.TouchingEdge, true, ["sprite"], "!TouchingEdge(sprite)"],
        ];
        it.each(toStrings)('toString() of (%s, %s, %s)',
            (checkName: CheckName, negated: boolean, args: ArgType[], expected: string) => {
                expect(new Effect(id, edgeID, checkName, negated, args).toString()).toBe(expected);
            });
    });

    test("effect.contradicts() throws for null argument", () => {
        expect(() => {
            const effect = new Effect(id, edgeID, CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]);
            effect.contradicts(null);
        }).toThrow();
    });

    test("effect.check() returns false before calling registerComponents()", () => {
        const effect = new Effect(id, edgeID, CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]);
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

            const effects: Effect[] = [
                new Effect(id, edgeID, CheckName.Output, true, ["sprite", "hi"]),
                new Effect(id, edgeID, CheckName.VarChange, true, ["test", "var", "+"]),
                new Effect(id, edgeID, CheckName.AttrChange, true, ["test", "attr", "-"]),
                new Effect(id, edgeID, CheckName.BackgroundChange, true, ["test"]),
                new Effect(id, edgeID, CheckName.Function, true, ["test"]),
                new Effect(id, edgeID, CheckName.VarComp, true, ["sprite", "var", ">", "0"]),
                new Effect(id, edgeID, CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]),
                new Effect(id, edgeID, CheckName.Key, true, ["right arrow"]),
                new Effect(id, edgeID, CheckName.Click, true, ["sprite"]),
                new Effect(id, edgeID, CheckName.SpriteColor, true, ["sprite", 255, 0, 0]),
                new Effect(id, edgeID, CheckName.SpriteTouching, true, ["sprite", "sprite1"]),
                new Effect(id, edgeID, CheckName.TouchingEdge, true, ["sprite"]),
                new Effect(id, edgeID, CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"]),
                new Effect(id, edgeID, CheckName.NbrOfClones, true, ["sprite", "=", "1"]),
                new Effect(id, edgeID, CheckName.TimeAfterEnd, true, ["1000"]),
                new Effect(id, edgeID, CheckName.TimeBetween, true, ["1000"]),
                new Effect(id, edgeID, CheckName.TimeElapsed, true, ["1000"]),
                new Effect(id, edgeID, CheckName.Probability, true, ["0"]),
                new Effect(id, edgeID, CheckName.Expr, true, ["test"]),
            ];

            it.each(createAllPairs(effects))('%s and %s do not contradict each other',
                (a, b) => assertSymmetricContradiction(a, b, false));
        });

        test("contradictions random value", () => {
            const randomValue = new Effect(id, edgeID, CheckName.RandomValue, false, ["sprite", "x"]);
            assertSymmetricContradiction2(randomValue, CheckName.AttrChange, false, ["sprite", "x", "+"], false);
            assertSymmetricContradiction2(randomValue, CheckName.RandomValue, false, ["sprite", "x"], false);
            assertSymmetricContradiction2(randomValue, CheckName.RandomValue, false, ["sprite", "y"], false);
            assertSymmetricContradiction2(randomValue, CheckName.RandomValue, false, ["sprite2", "x"], false);
        });

        test("contradictions output", () => {
            const output = new Effect(id, edgeID, CheckName.Output, true, ["sprite", "hi"]);
            assertSymmetricContradiction2(output, CheckName.Output, true, ["sprite1", "hi"], false);
            assertSymmetricContradiction2(output, CheckName.Output, true, ["sprite", "hi"], false);
            assertSymmetricContradiction2(output, CheckName.Output, true, ["sprite", "hi2"], true);
        });

        test("contradictions function", () => {
            const functionE = new Effect(id, edgeID, CheckName.Function, true, ["test"]);
            assertSymmetricContradiction2(functionE, CheckName.Function, true, ["testblabla"], false);
            assertSymmetricContradiction2(functionE, CheckName.Function, true, ["test"], false);
        });

        test("contradictions background", () => {
            const background = new Effect(id, edgeID, CheckName.BackgroundChange, true, ["test"]);
            assertSymmetricContradiction2(background, CheckName.BackgroundChange, true, ["test"], false);
            assertSymmetricContradiction2(background, CheckName.BackgroundChange, true, ["test2"], true);
        });

        describe("contradiction: variable change and comparison", () => {
            test('not the same sprite', () => {
                const varChange = new Effect(id, edgeID, CheckName.VarChange, true, ["test", "var", "+"]);
                const varComp = new Effect(id, edgeID, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
                assertSymmetricContradiction(varChange, varComp, false);
            });

            test('not the same var', () => {
                const varChange = new Effect(id, edgeID, CheckName.VarChange, true, ["sprite", "var", "+"]);
                const varComp = new Effect(id, edgeID, CheckName.VarComp, true, ["sprite", "var2", ">", "0"]);
                assertSymmetricContradiction(varChange, varComp, false);
            });


            describe('VarComp and VarChange', () => {
                it.each(getEffectComparisonChangeCombinations(CheckName.VarComp, CheckName.VarChange))(
                    '%s does not contradict %s', assertSymmetricContradiction);
            });
        });

        describe("contradiction: attribute comparison and change", () => {
            test('not the same sprite', () => {
                const attrChange = new Effect(id, edgeID, CheckName.AttrChange, true, ["test", "var", "+"]);
                const attrComp = new Effect(id, edgeID, CheckName.AttrComp, true, ["sprite", "var", ">", "0"]);
                assertSymmetricContradiction(attrChange, attrComp, false);
            });

            test('not the same var', () => {
                const attrChange = new Effect(id, edgeID, CheckName.AttrChange, true, ["sprite", "var", "+"]);
                const attrComp = new Effect(id, edgeID, CheckName.AttrComp, true, ["sprite", "var2", ">", "0"]);
                assertSymmetricContradiction(attrChange, attrComp, false);
            });

            describe('AttrComp and AttrChange', () => {
                it.each(getEffectComparisonChangeCombinations(CheckName.AttrComp, CheckName.AttrChange))(
                    '%s does not contradict %s', assertSymmetricContradiction);
            });
        });

        describe("contradictions: var/attr change", () => {
            const table: TableEntry[] = [
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite', 'var', '+'], false],
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite', 'var', '-'], false],
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite', 'var', '='], false],
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite', 'var', '+='], false],
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite', 'var', '-='], true],

                // other names
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite2', 'var', '='], false],
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite', 'var2', '='], false],

                [CheckName.VarChange, true, ['sprite', 'var', '-'], CheckName.VarChange, true, ['sprite', 'var', '+='], true],
                [CheckName.VarChange, true, ['sprite', 'var', '-'], CheckName.VarChange, true, ['sprite', 'var', '-='], false],

                //attrChange
                [CheckName.AttrChange, true, ['sprite', 'var', '+'], CheckName.AttrChange, true, ['sprite', 'var', '+'], false],
                [CheckName.AttrChange, true, ['sprite', 'var', '+'], CheckName.AttrChange, true, ['sprite', 'var', '-'], false],
                [CheckName.AttrChange, true, ['sprite', 'var', '+'], CheckName.AttrChange, true, ['sprite', 'var', '='], false],
                [CheckName.AttrChange, true, ['sprite', 'var', '+'], CheckName.AttrChange, true, ['sprite', 'var', '+='], false],
                [CheckName.AttrChange, true, ['sprite', 'var', '+'], CheckName.AttrChange, true, ['sprite', 'var', '-='], true],

                //other names
                [CheckName.AttrChange, true, ['sprite', 'var', '+'], CheckName.AttrChange, true, ['sprite2', 'var', '='], false],
                [CheckName.AttrChange, true, ['sprite', 'var', '+'], CheckName.AttrChange, true, ['sprite', 'var2', '='], false],

                [CheckName.AttrChange, true, ['sprite', 'var', '-'], CheckName.AttrChange, true, ['sprite', 'var', '+='], true],
                [CheckName.AttrChange, true, ['sprite', 'var', '-'], CheckName.AttrChange, true, ['sprite', 'var', '-='], false],

                // different values
                [CheckName.VarChange, true, ['sprite', 'var', '-5'], CheckName.VarChange, true, ['sprite', 'var', '-7'], true],
                [CheckName.VarChange, true, ['sprite', 'var', '+5'], CheckName.VarChange, true, ['sprite', 'var', '+7'], true],
                [CheckName.AttrChange, false, ['sprite', 'var', '-5'], CheckName.AttrChange, false, ['sprite', 'var', '-7'], true],
                [CheckName.AttrChange, false, ['sprite', 'var', '+5'], CheckName.AttrChange, false, ['sprite', 'var', '+7'], true],
            ];

            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        describe("varChange += -=", () => {
            const table: TableEntry[] = [
                [CheckName.VarChange, true, ['sprite', 'var', '+='], CheckName.VarChange, true, ['sprite', 'var', '+='], false],
                [CheckName.VarChange, false, ['sprite', 'var', '+='], CheckName.VarChange, false, ['sprite', 'var', '+='], false],
                [CheckName.VarChange, false, ['sprite', 'var', '+='], CheckName.VarChange, true, ['sprite', 'var', '+='], true],

                [CheckName.VarChange, true, ['sprite', 'var', '-='], CheckName.VarChange, true, ['sprite', 'var', '-='], false],
                [CheckName.VarChange, false, ['sprite', 'var', '-='], CheckName.VarChange, false, ['sprite', 'var', '-='], false],
                [CheckName.VarChange, false, ['sprite', 'var', '-='], CheckName.VarChange, true, ['sprite', 'var', '-='], true],

                [CheckName.VarChange, false, ['sprite', 'var', '+='], CheckName.VarChange, true, ['sprite', 'var', '-='], false],
                [CheckName.VarChange, true, ['sprite', 'var', '+='], CheckName.VarChange, true, ['sprite', 'var', '-='], true]
            ];

            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        describe('contradictions: variable comparison', () => {
            const table: TableEntry[] = [
                [CheckName.VarComp, true, ["sprite", "var", ">", "0"], CheckName.VarComp, true, ["sprite", "var", ">", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", ">", "0"], CheckName.VarComp, true, ["sprite", "var", ">=", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", ">=", "0"], CheckName.VarComp, true, ["sprite", "var", ">=", "1"], false],
                [CheckName.VarComp, true, ["sprite2", "var", ">=", "0"], CheckName.VarComp, true, ["sprite", "var", ">=", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var2", ">=", "0"], CheckName.VarComp, true, ["sprite", "var", ">=", "1"], false],

                [CheckName.VarComp, true, ["sprite", "var", "<", "0"], CheckName.VarComp, true, ["sprite", "var", "<", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", "<", "0"], CheckName.VarComp, true, ["sprite", "var", "<=", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", "<=", "0"], CheckName.VarComp, true, ["sprite", "var", "<=", "1"], false],

                [CheckName.VarComp, false, ["sprite", "var", "=", "0"], CheckName.VarComp, false, ["sprite", "var", "=", "1"], true],
                [CheckName.VarComp, false, ["sprite", "var", "=", "0"], CheckName.VarComp, true, ["sprite", "var", "=", "0"], true],

                [CheckName.VarComp, true, ["sprite", "var", "=", "0"], CheckName.VarComp, true, ["sprite", "var", "=", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", "=", "0"], CheckName.VarComp, true, ["sprite", "var", "=", "0"], false],

                [CheckName.VarComp, true, ["sprite", "var", "<", "0"], CheckName.VarComp, true, ["sprite", "var", "=", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", "<", "0"], CheckName.VarComp, false, ["sprite", "var", "=", "-1"], true],
                [CheckName.VarComp, true, ["sprite", "var", "<", "2"], CheckName.VarComp, true, ["sprite", "var", "=", "1"], false],

                [CheckName.VarComp, true, ["sprite", "var", "<=", "0"], CheckName.VarComp, true, ["sprite", "var", "=", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", "<=", "2"], CheckName.VarComp, true, ["sprite", "var", "=", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", "<=", "2"], CheckName.VarComp, false, ["sprite", "var", "=", "-1"], true],
                [CheckName.VarComp, true, ["sprite", "var", "<=", "1"], CheckName.VarComp, true, ["sprite", "var", "=", "1"], false],

                [CheckName.VarComp, true, ["sprite", "var", ">", "1"], CheckName.VarComp, true, ["sprite", "var", "=", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", ">", "1"], CheckName.VarComp, false, ["sprite", "var", "=", "2"], true],
                [CheckName.VarComp, true, ["sprite", "var", ">", "0"], CheckName.VarComp, true, ["sprite", "var", "=", "1"], false],

                [CheckName.VarComp, true, ["sprite", "var", ">=", "2"], CheckName.VarComp, true, ["sprite", "var", "=", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", ">=", "2"], CheckName.VarComp, false, ["sprite", "var", "=", "3"], true],
                [CheckName.VarComp, true, ["sprite", "var", ">=", "0"], CheckName.VarComp, true, ["sprite", "var", "=", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", ">=", "1"], CheckName.VarComp, true, ["sprite", "var", "=", "1"], false],

                [CheckName.VarComp, false, ["sprite", "var", "<", "3"], CheckName.VarComp, false, ["sprite", "var", ">", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", "<", "1"], CheckName.VarComp, true, ["sprite", "var", ">", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", "<=", "1"], CheckName.VarComp, true, ["sprite", "var", ">=", "1"], true],
                [CheckName.VarComp, false, ["sprite", "var", "<", "1"], CheckName.VarComp, false, ["sprite", "var", ">", "1"], true],
                [CheckName.VarComp, true, ["sprite", "var", "<", "-1"], CheckName.VarComp, true, ["sprite", "var", ">", "1"], false],

                [CheckName.VarComp, true, ["sprite", "var", "<", "3"], CheckName.VarComp, true, ["sprite", "var", ">=", "1"], true],
                [CheckName.VarComp, false, ["sprite", "var", "<", "3"], CheckName.VarComp, false, ["sprite", "var", ">=", "1"], false],
                [CheckName.VarComp, true, ["sprite", "var", "<", "1"], CheckName.VarComp, true, ["sprite", "var", ">=", "1"], true],
                [CheckName.VarComp, false, ["sprite", "var", "<", "-1"], CheckName.VarComp, false, ["sprite", "var", ">=", "1"], true],

                [CheckName.VarComp, true, ["sprite", "var", "<=", "3"], CheckName.VarComp, true, ["sprite", "var", ">", "1"], true],
                [CheckName.VarComp, false, ["sprite", "var", "<=", "1"], CheckName.VarComp, false, ["sprite", "var", ">", "1"], true],
                [CheckName.VarComp, false, ["sprite", "var", "<=", "-1"], CheckName.VarComp, false, ["sprite", "var", ">", "1"], true],

                [CheckName.VarComp, false, ["sprite", "var", "<=", "3"], CheckName.VarComp, false, ["sprite", "var", ">=", "1"], false],
                [CheckName.VarComp, false, ["sprite", "var", "<=", "1"], CheckName.VarComp, false, ["sprite", "var", ">=", "1"], false],
                [CheckName.VarComp, false, ["sprite", "var", "<=", "-1"], CheckName.VarComp, false, ["sprite", "var", ">=", "1"], true],
            ];
            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        test("contradiction: click", () => {
            const effect1 = new Effect(id, edgeID, CheckName.Click, true, ["sprite1"]);
            assertSymmetricContradiction2(effect1, CheckName.Click, true, ["sprite2"], true);
            assertSymmetricContradiction2(effect1, CheckName.Click, true, ["sprite1"], false);
        });

        test("contradiction: key", () => {
            const effect1 = new Effect(id, edgeID, CheckName.Key, true, ["left"]);
            assertSymmetricContradiction2(effect1, CheckName.Key, true, ["right"], false);
            assertSymmetricContradiction2(effect1, CheckName.Key, true, ["left"], false);
        });

        test("contradiction: sprite color", () => {
            const effect1 = new Effect(id, edgeID, CheckName.SpriteColor, true, ["sprite1", "0", "0", "0"]);
            assertSymmetricContradiction2(effect1, CheckName.SpriteColor, true, ["sprite2", "0", "0", "0"], false);
            // it can touch multiple colors at the same time
            assertSymmetricContradiction2(effect1, CheckName.SpriteColor, true, ["sprite1", "0", "0", "1"], false);
        });

        test("contradiction: sprite touching", () => {
            const effect1 = new Effect(id, edgeID, CheckName.SpriteTouching, true, ["sprite1", "sprite2"]);
            assertSymmetricContradiction2(effect1, CheckName.SpriteTouching, true, ["sprite2", "sprite3"], false);
            assertSymmetricContradiction2(effect1, CheckName.SpriteTouching, true, ["sprite1", "sprite3"], false);
        });

        test("contradiction: expr", () => {
            const effect1 = new Effect(id, edgeID, CheckName.Expr, true, ["whatever"]);
            assertSymmetricContradiction2(effect1, CheckName.Expr, true, ["whatever2"], false);
            assertSymmetricContradiction2(effect1, CheckName.Click, true, ["whatever"], false);
        });

        // actually an effect with probability result is quite dumb to have....
        test("contradiction: probability", () => {
            const effect1 = new Effect(id, edgeID, CheckName.Probability, true, ["1"]);
            assertSymmetricContradiction2(effect1, CheckName.Probability, true, ["9"], false);
            assertSymmetricContradiction2(effect1, CheckName.Probability, true, ["1"], false);
        });

        describe("contradiction: time", () => {
            const table: TableEntry[] = [
                [CheckName.TimeElapsed, true, ["1000"], CheckName.TimeElapsed, true, ["2000"], false],
                [CheckName.TimeElapsed, true, ["1000"], CheckName.TimeElapsed, true, ["1000"], false],
                [CheckName.TimeBetween, true, ["1000"], CheckName.TimeBetween, true, ["2000"], false],
                [CheckName.TimeBetween, true, ["1000"], CheckName.TimeBetween, true, ["1000"], false],
                [CheckName.TimeAfterEnd, true, ["1000"], CheckName.TimeAfterEnd, true, ["2000"], false],
                [CheckName.TimeAfterEnd, true, ["1000"], CheckName.TimeAfterEnd, true, ["1000"], false],
            ];
            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        describe("contradiction: clones", () => {
            const table: TableEntry[] = [
                [CheckName.NbrOfClones, true, ["sprite", "=", "1"], CheckName.NbrOfClones, true, ["sprite2", "=", "2"], false],
                [CheckName.NbrOfClones, true, ["sprite", "=", "1"], CheckName.NbrOfClones, true, ["sprite", "=", "1"], false],
                [CheckName.NbrOfClones, true, ["sprite", "=", "1"], CheckName.NbrOfClones, true, ["sprite", "=", "2"], false],
                [CheckName.NbrOfClones, true, ["sprite", "=", "1"], CheckName.NbrOfClones, false, ["sprite", "=", "2"], false],

                [CheckName.NbrOfClones, true, ["sprite", "=", "1"], CheckName.NbrOfClones, false, ["sprite", "=", "1"], true],

                [CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"], CheckName.NbrOfVisibleClones, true, ["sprite2", "=", "2"], false],
                [CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"], CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"], false],
                [CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"], CheckName.NbrOfVisibleClones, true, ["sprite", "=", "2"], false],
            ];
            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);

            // other comparisons are valid as long as AttrComp and VarComp tests are ok (same comparison)
        });

        test("contradiction: expr", () => {
            const effect1 = new Effect(id, edgeID, CheckName.TouchingEdge, true, ["sprite"]);
            assertSymmetricContradiction2(effect1, CheckName.TouchingEdge, true, ["sprite2"], false);
            assertSymmetricContradiction2(effect1, CheckName.TouchingEdge, true, ["sprite"], false);
        });

        test("contradiction negation", () => {
            const effect1 = new Effect(id, edgeID, CheckName.TouchingEdge, true, ["sprite"]);
            assertSymmetricContradiction2(effect1, CheckName.TouchingEdge, true, ["sprite"], false);
            assertSymmetricContradiction2(effect1, CheckName.TouchingEdge, false, ["sprite2"], false);
            assertSymmetricContradiction2(effect1, CheckName.TouchingEdge, false, ["sprite"], true);
        });

        describe("contradiction negation attr/var change", () => {
            const table: TableEntry[] = [
                [CheckName.VarChange, true, ['sprite', 'var', '+5'], CheckName.VarChange, false, ['sprite', 'var', '+5'], true],

                // inverted
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, false, ['sprite', 'var', '+'], true],
                [CheckName.VarChange, true, ['sprite', 'var', '-'], CheckName.VarChange, false, ['sprite', 'var', '-'], true],
                [CheckName.VarChange, true, ['sprite', 'var', '='], CheckName.VarChange, false, ['sprite', 'var', '='], true],
                [CheckName.VarChange, true, ['sprite', 'var', '-'], CheckName.VarChange, false, ['sprite', 'var', '+='], false],
                [CheckName.VarChange, true, ['sprite', 'var', '-'], CheckName.VarChange, true, ['sprite', 'var', '+='], true],
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, false, ['sprite', 'var', '-='], false],
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite', 'var', '-='], true],

                // NO increase
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite', 'var', '-'], false],
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, false, ['sprite', 'var', '-'], false],
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite', 'var', '='], false],
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, false, ['sprite', 'var', '='], false],
                [CheckName.VarChange, true, ['sprite', 'var', '+'], CheckName.VarChange, false, ['sprite', 'var', '-='], false],

                // increase
                [CheckName.VarChange, false, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite', 'var', '-'], false],
                [CheckName.VarChange, false, ['sprite', 'var', '+'], CheckName.VarChange, false, ['sprite', 'var', '-'], true],
                [CheckName.VarChange, false, ['sprite', 'var', '+'], CheckName.VarChange, true, ['sprite', 'var', '='], false],
                [CheckName.VarChange, false, ['sprite', 'var', '+'], CheckName.VarChange, false, ['sprite', 'var', '='], true],
                [CheckName.VarChange, false, ['sprite', 'var', '+'], CheckName.VarChange, false, ['sprite', 'var', '+='], false],
                [CheckName.VarChange, false, ['sprite', 'var', '+'], CheckName.VarChange, false, ['sprite', 'var', '-='], true],
            ];
            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        describe("contradiction negation attr/var comparison", () => {
            const table: TableEntry[] = [
                [CheckName.AttrComp, true, ["sprite", "var", ">=", "0"], CheckName.AttrComp, true, ["sprite", "var", ">=", "0"], false],
                [CheckName.AttrComp, true, ["sprite", "var", ">=", "0"], CheckName.AttrComp, false, ["sprite", "var", "<", "0"], false],
                [CheckName.AttrComp, true, ["sprite", "var", ">=", "0"], CheckName.AttrComp, true, ["sprite", "var", "<", "0"], true],

                [CheckName.AttrComp, false, ["sprite", "var", ">=", "0"], CheckName.AttrComp, true, ["sprite", "var", "<", "0"], false],
                [CheckName.AttrComp, false, ["sprite", "var", ">=", "0"], CheckName.AttrComp, false, ["sprite", "var", "<", "0"], true],

                [CheckName.AttrComp, false, ["sprite", "var", ">", "0"], CheckName.AttrComp, true, ["sprite", "var", ">=", "0"], true],
                [CheckName.AttrComp, false, ["sprite", "var", ">", "0"], CheckName.AttrComp, false, ["sprite", "var", ">=", "0"], false],

                [CheckName.AttrComp, false, ["sprite", "var", "<", "0"], CheckName.AttrComp, true, ["sprite", "var", "<=", "0"], true],
                [CheckName.AttrComp, false, ["sprite", "var", "<", "0"], CheckName.AttrComp, false, ["sprite", "var", "<=", "0"], false],

                [CheckName.AttrComp, false, ["sprite", "var", "=", "0"], CheckName.AttrComp, true, ["sprite", "var", "<=", "0"], true],
                [CheckName.AttrComp, false, ["sprite", "var", "=", "0"], CheckName.AttrComp, false, ["sprite", "var", "<=", "0"], false],
                [CheckName.AttrComp, false, ["sprite", "var", "=", "0"], CheckName.AttrComp, true, ["sprite", "var", ">=", "0"], true],
                [CheckName.AttrComp, false, ["sprite", "var", "=", "0"], CheckName.AttrComp, false, ["sprite", "var", ">=", "0"], false],
                [CheckName.AttrComp, false, ["sprite", "var", "=", "0"], CheckName.AttrComp, false, ["sprite", "var", "<", "0"], true],
                [CheckName.AttrComp, false, ["sprite", "var", "=", "0"], CheckName.AttrComp, true, ["sprite", "var", "<", "0"], false],
                [CheckName.AttrComp, false, ["sprite", "var", "=", "0"], CheckName.AttrComp, false, ["sprite", "var", ">", "0"], true],
                [CheckName.AttrComp, false, ["sprite", "var", "=", "0"], CheckName.AttrComp, true, ["sprite", "var", ">", "0"], false],

                [CheckName.AttrComp, false, ["sprite", "var", "=", "0"], CheckName.AttrComp, true, ["sprite", "var", "<=", "2"], true],
                [CheckName.AttrComp, false, ["sprite", "var", "=", "0"], CheckName.AttrComp, false, ["sprite", "var", "<=", "2"], false],
            ];
            it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
        });

        test('contradiction with event strings', () => {
            const attrComp = new Effect(id, edgeID, CheckName.AttrComp, false, ["sprite", "var", "=", "0"]);
            expect(Check.testForContradictingWithEvents(attrComp, [CheckUtility.getEventString(CheckName.AttrComp, true,
                "sprite", "var", "<=", "2")])).toBe(true);
            expect(Check.testForContradictingWithEvents(attrComp, [CheckUtility.getEventString(CheckName.AttrComp, false,
                "sprite", "var", "<=", "2")])).toBe(false);
        });
    });

    const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
    const cu = cuMock.getCheckUtility();

    test('registerComponent() calculates correct effect', () => {
        const effect = new Effect(id, edgeID, CheckName.Key, true, ["a"]);
        effect.registerComponents(null, cu, "graphID");
        const func = effect.effect;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(true);
        cuMock.pressedKeys["a"] = true;
        expect(func(0, 0)).toEqual(false);
    });

    test('registerComponent() clears effect in error case', () => {
        const effect = new Effect(id, edgeID, CheckName.Key, true, ["a"]);
        const error = new Error("this is a message");
        effect.registerComponents(null, cu, "graphID");
        effect.checkArgsWithTestDriver = (t, cu, args) => {
            throw error;
        };
        const fn = jest.fn();
        cu.addErrorOutput = fn;
        effect.registerComponents(null, cu, "graphID");
        const func = effect.effect;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(false);
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(false);
        expect(fn).toHaveBeenCalledWith(edgeID, "graphID", error);
    });
});
