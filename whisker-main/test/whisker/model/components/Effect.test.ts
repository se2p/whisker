import {Effect} from "../../../../src/whisker/model/components/Effect";
import {ArgType, Check, CHECK_NAMES, CheckName} from "../../../../src/whisker/model/components/Check";
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
            ["Function", true, ["test"], "!Function(test)"],
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
                expect(new Effect(id, edgeID, checkName, negated, args).toString()).toBe(expected);
            });
    });

    test("effect.contradicts() throws for null argument", () => {
        expect(() => {
            const effect = new Effect(id, edgeID, "AttrComp", true, ["sprite", "attr", ">", "0"]);
            effect.contradicts(null);
        }).toThrow();
    });

    test("effect.check() returns false before calling registerComponents()", () => {
        const effect = new Effect(id, edgeID, "AttrComp", true, ["sprite", "attr", ">", "0"]);
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
                new Effect(id, edgeID, "Output", true, ["sprite", "hi"]),
                new Effect(id, edgeID, "VarChange", true, ["test", "var", "+"]),
                new Effect(id, edgeID, "AttrChange", true, ["test", "attr", "-"]),
                new Effect(id, edgeID, "BackgroundChange", true, ["test"]),
                new Effect(id, edgeID, "Function", true, ["test"]),
                new Effect(id, edgeID, "VarComp", true, ["sprite", "var", ">", "0"]),
                new Effect(id, edgeID, "AttrComp", true, ["sprite", "attr", ">", "0"]),
                new Effect(id, edgeID, "Key", true, ["right arrow"]),
                new Effect(id, edgeID, "Click", true, ["sprite"]),
                new Effect(id, edgeID, "SpriteColor", true, ["sprite", 255, 0, 0]),
                new Effect(id, edgeID, "SpriteTouching", true, ["sprite", "sprite1"]),
                new Effect(id, edgeID, "TouchingEdge", true, ["sprite"]),
                new Effect(id, edgeID, "NbrOfVisibleClones", true, ["sprite", "=", "1"]),
                new Effect(id, edgeID, "NbrOfClones", true, ["sprite", "=", "1"]),
                new Effect(id, edgeID, "TimeAfterEnd", true, ["1000"]),
                new Effect(id, edgeID, "TimeBetween", true, ["1000"]),
                new Effect(id, edgeID, "TimeElapsed", true, ["1000"]),
                new Effect(id, edgeID, "Probability", true, ["0"]),
                new Effect(id, edgeID, "Expr", true, ["test"]),
            ];

            it.each(createAllPairs(effects))('%s and %s do not contradict each other',
                (a, b) => assertSymmetricContradiction(a, b, false));
        });

        test("contradictions output", () => {
            const output = new Effect(id, edgeID, "Output", true, ["sprite", "hi"]);
            assertSymmetricContradiction2(output, "Output", true, ["sprite1", "hi"], false);
            assertSymmetricContradiction2(output, "Output", true, ["sprite", "hi"], false);
            assertSymmetricContradiction2(output, "Output", true, ["sprite", "hi2"], true);
        });

        test("contradictions function", () => {
            const functionE = new Effect(id, edgeID, "Function", true, ["test"]);
            assertSymmetricContradiction2(functionE, "Function", true, ["testblabla"], false);
            assertSymmetricContradiction2(functionE, "Function", true, ["test"], false);
        });

        test("contradictions background", () => {
            const background = new Effect(id, edgeID, "BackgroundChange", true, ["test"]);
            assertSymmetricContradiction2(background, "BackgroundChange", true, ["test"], false);
            assertSymmetricContradiction2(background, "BackgroundChange", true, ["test2"], true);
        });

        describe("contradiction: variable change and comparison", () => {
            test('not the same sprite', () => {
                const varChange = new Effect(id, edgeID, "VarChange", true, ["test", "var", "+"]);
                const varComp = new Effect(id, edgeID, "VarComp", true, ["sprite", "var", ">", "0"]);
                assertSymmetricContradiction(varChange, varComp, false);
            });

            test('not the same var', () => {
                const varChange = new Effect(id, edgeID, "VarChange", true, ["sprite", "var", "+"]);
                const varComp = new Effect(id, edgeID, "VarComp", true, ["sprite", "var2", ">", "0"]);
                assertSymmetricContradiction(varChange, varComp, false);
            });


            describe('VarComp and VarChange', () => {
                it.each(getEffectComparisonChangeCombinations("VarComp", "VarChange"))(
                    '%s does not contradict %s', assertSymmetricContradiction);
            });
        });

        describe("contradiction: attribute comparison and change", () => {
            test('not the same sprite', () => {
                const attrChange = new Effect(id, edgeID, "AttrChange", true, ["test", "var", "+"]);
                const attrComp = new Effect(id, edgeID, "AttrComp", true, ["sprite", "var", ">", "0"]);
                assertSymmetricContradiction(attrChange, attrComp, false);
            });

            test('not the same var', () => {
                const attrChange = new Effect(id, edgeID, "AttrChange", true, ["sprite", "var", "+"]);
                const attrComp = new Effect(id, edgeID, "AttrComp", true, ["sprite", "var2", ">", "0"]);
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
            const effect1 = new Effect(id, edgeID, "Click", true, ["sprite1"]);
            assertSymmetricContradiction2(effect1, "Click", true, ["sprite2"], true);
            assertSymmetricContradiction2(effect1, "Click", true, ["sprite1"], false);
        });

        test("contradiction: key", () => {
            const effect1 = new Effect(id, edgeID, "Key", true, ["left"]);
            assertSymmetricContradiction2(effect1, "Key", true, ["right"], false);
            assertSymmetricContradiction2(effect1, "Key", true, ["left"], false);
        });

        test("contradiction: sprite color", () => {
            const effect1 = new Effect(id, edgeID, "SpriteColor", true, ["sprite1", "0", "0", "0"]);
            assertSymmetricContradiction2(effect1, "SpriteColor", true, ["sprite2", "0", "0", "0"], false);
            // it can touch multiple colors at the same time
            assertSymmetricContradiction2(effect1, "SpriteColor", true, ["sprite1", "0", "0", "1"], false);
        });

        test("contradiction: sprite touching", () => {
            const effect1 = new Effect(id, edgeID, "SpriteTouching", true, ["sprite1", "sprite2"]);
            assertSymmetricContradiction2(effect1, "SpriteTouching", true, ["sprite2", "sprite3"], false);
            assertSymmetricContradiction2(effect1, "SpriteTouching", true, ["sprite1", "sprite3"], false);
        });

        test("contradiction: expr", () => {
            const effect1 = new Effect(id, edgeID, "Expr", true, ["whatever"]);
            assertSymmetricContradiction2(effect1, "Expr", true, ["whatever2"], false);
            assertSymmetricContradiction2(effect1, "Click", true, ["whatever"], false);
        });

        // actually an effect with probability result is quite dumb to have....
        test("contradiction: probability", () => {
            const effect1 = new Effect(id, edgeID, "Probability", true, ["1"]);
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
            const effect1 = new Effect(id, edgeID, "TouchingEdge", true, ["sprite"]);
            assertSymmetricContradiction2(effect1, "TouchingEdge", true, ["sprite2"], false);
            assertSymmetricContradiction2(effect1, "TouchingEdge", true, ["sprite"], false);
        });

        test("contradiction negation", () => {
            const effect1 = new Effect(id, edgeID, "TouchingEdge", true, ["sprite"]);
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
            const attrComp = new Effect(id, edgeID, "AttrComp", false, ["sprite", "var", "=", "0"]);
            expect(Check.testForContradictingWithEvents(attrComp, [CheckUtility.getEventString("AttrComp", true,
                "sprite", "var", "<=", "2")])).toBe(true);
            expect(Check.testForContradictingWithEvents(attrComp, [CheckUtility.getEventString("AttrComp", false,
                "sprite", "var", "<=", "2")])).toBe(false);
        });
    });

    const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
    const cu = cuMock.getCheckUtility();

    test('registerComponent() calculates correct effect', () => {
        const effect = new Effect(id, edgeID, "Key", true, ["a"]);
        effect.registerComponents(null, cu, "graphID");
        const func = effect.effect;
        cuMock.pressedKeys["a"] = false;
        expect(func(0, 0)).toEqual(true);
        cuMock.pressedKeys["a"] = true;
        expect(func(0, 0)).toEqual(false);
    });

    test('registerComponent() clears effect in error case', () => {
        const effect = new Effect(id, edgeID, "Key", true, ["a"]);
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
