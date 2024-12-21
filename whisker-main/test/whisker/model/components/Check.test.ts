import {CheckUtilityMock} from "../mocks/CheckUtilityMock";
import {AttrComp} from "../../../../src/whisker/model/checks/AttrComp";
import {AttrChange} from "../../../../src/whisker/model/checks/AttrChange";
import {
    BackgroundChange,
    BackgroundChangeArgs,
    BackgroundChangeJSON
} from "../../../../src/whisker/model/checks/BackgroundChange";
import {Key} from "../../../../src/whisker/model/checks/Key";
import {Check, CHECK_NAMES, CheckName, newCheck} from "../../../../src/whisker/model/checks/newCheck";
import {ArgType} from "../../../../src/whisker/model/util/schema";
import {Pair} from "../../../../src/whisker/utils/Pair";
import {Checks} from "../../../../src/whisker/model/util/Checks";

import {Comparison} from "../../../../src/whisker/model/checks/comparisons";

function checkConstructorThrows(name: CheckName, negated: boolean, args) {
    expect(() => newCheck(edgeID, {name, negated, args})).toThrow();
}

const edgeID = "edgeID";

describe('constructor', () => {
    test("constructor does not throw for undefined edgeLabel", () => {
        expect(() => {
            new BackgroundChange(undefined, {negated: true, args: ["test"]});
        }).not.toThrow();
    });

    test('Invalid comparison throws error', () => {
        expect(() => new AttrComp("label", {negated: true, args: ["sprite", "var", "comp" as Comparison, "value"]}))
            .toThrow();
    });

    describe('Constructor throws for empty args', () => {
        const constructorArguments: [CheckName, boolean, ArgType[]][] = CHECK_NAMES.map(c => [c, true, []]);
        it.each(constructorArguments)('throws for CheckName: %s', checkConstructorThrows);
    });

    describe("constructor throws if not enough arguments in args", () => {
        describe("not enough arguments: sprite color", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["SpriteColor", true, ["spriteName"]],
                ["SpriteColor", true, ["spriteName", "1"]],
                ["SpriteColor", true, ["spriteName", "1", "2"]],
                ["SpriteColor", true, ["spriteName", "1", "2", undefined]],
                ["SpriteColor", true, ["spriteName", undefined, "1", "2"]],
                ["SpriteColor", true, ["spriteName", "1", undefined, "2"]],
                ["SpriteColor", true, [undefined, undefined, "test", "0", "1"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: sprite touching", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["SpriteTouching", true, ["spriteName"]],
                ["SpriteTouching", true, ["spriteName", undefined]],
                ["SpriteTouching", true, [undefined, "spriteName"]]
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough argument: nbrofclones", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["NbrOfClones", true, ["spriteName"]],
                ["NbrOfClones", true, ["spriteName", "="]],
                ["NbrOfVisibleClones", true, ["spriteName"]],
                ["NbrOfVisibleClones", true, ["spriteName", "="]]
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
                ["VarChange", true, [undefined, "test", "test2"]],
                ["VarChange", true, ["test", undefined, "test2"]],
                ["VarChange", true, ["test", "test2", undefined]],
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
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });

        describe("not enough arguments: attribute change", () => {
            const constructorArguments: [CheckName, boolean, ArgType[]][] = [
                ["AttrChange", true, ["test"]],
                ["AttrChange", true, ["test", "test2"]],
                ["AttrChange", true, ["test", "test2", undefined]],
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
                ["AttrComp", true, [undefined, undefined, "test", "test2"]],
            ];
            it.each(constructorArguments)('Constructor with (%s, %s, %s) throws', checkConstructorThrows);
        });
    });
});

describe('string representations', () => {
    test("toJSON", () => {
        const checkName = "BackgroundChange";
        const negated = true;
        const args: BackgroundChangeArgs = ["test"];
        const condition = new BackgroundChange(edgeID, {negated, args});
        const actual = condition.toJSON();
        const expected: BackgroundChangeJSON = {
            name: checkName,
            negated: negated,
            args: args
        };
        expect(actual).toStrictEqual(expected);
    });

    describe('toString()', () => {
        const constructorArguments: [CheckName, boolean, ArgType[], string][] = [
            ["AttrChange", false, ["test", "attr", "-"], "AttrChange(test,attr,-)"],
            ["AttrComp", true, ["sprite", "attr", ">", "0"], "!AttrComp(sprite,attr,>,0)"],
            ["BackgroundChange", true, ["test"], "!BackgroundChange(test)"],
            ["Click", true, ["sprite"], "!Click(sprite)"],
            ["Key", true, ["test"], "!Key(test)"],
            ["Output", true, ["test", "hallo"], "!Output(test,hallo)"],
            ["SpriteColor", true, ["sprite", "0", "0", "0"], "!SpriteColor(sprite,0,0,0)"],
            ["SpriteTouching", true, ["sprite1", "sprite2"], "!SpriteTouching(sprite1,sprite2)"],
            ["VarComp", true, ["sprite", "var", ">", "0"], "!VarComp(sprite,var,>,0)"],
            ["VarChange", true, ["test", "var", "+"], "!VarChange(test,var,+)"],
            ["Expr", true, ["test"], "!Expr(test)"],
            ["Probability", true, ["0"], "!Probability(0)"],
            ["TimeElapsed", true, ["1000"], "!TimeElapsed(1000)"],
            ["TimeBetween", true, ["1000"], "!TimeBetween(1000)"],
            ["TimeAfterEnd", true, ["1000"], "!TimeAfterEnd(1000)"],
            ["NbrOfClones", true, ["sprite", "=", "1"], "!NbrOfClones(sprite,==,1)"],
            ["NbrOfVisibleClones", true, ["sprite", "=", "1"], "!NbrOfVisibleClones(sprite,==,1)"],
            ["TouchingEdge", true, ["sprite"], "!TouchingEdge(sprite)"]
        ];

        it.each(constructorArguments)('(%s, %s, %s) has the correct toString()', (name: CheckName, negated: boolean, args, expected: string) => {
            expect(newCheck(edgeID, {name, negated, args: args as any}).toString()).toBe(expected);
        });
    });
});

describe('check and registerComponent', () => {

    const cuMock = new CheckUtilityMock({"a": true, "b": false, "c": true,});
    const cu = cuMock.getCheckUtility();

    test('Condition.check() returns false before registerComponent()', () => {
        const condition = new AttrChange(edgeID, {args: ["test", "attr", "-"]});
        expect(condition.check(1, 1)).toBe(false);
    });

    test('registerComponent() calculates correct effect', () => {
        const effect = new Key(edgeID, {negated: true, args: ["a"]});
        effect.registerComponents(null, cu, "graphID");
        const func = effect.check;
        cuMock.pressedKeys["a"] = false;
        expect(func()).toEqual(true);
        cuMock.pressedKeys["a"] = true;
        expect(func()).toEqual(false);
    });

    test('registerComponent() clears effect in error case', () => {
        const check = new Key(edgeID, {negated: true, args: ["a"]});
        const error = new Error("this is a message");
        check.registerComponents(null, cu, "graphID");
        check._checkArgsWithTestDriver = () => {
            throw error;
        };
        const fn = jest.fn();
        cu.addErrorOutput = fn;
        check.registerComponents(null, cu, "graphID");
        const func = check.check;
        cuMock.pressedKeys["a"] = false;
        expect(func()).toEqual(false);
        expect(fn).toHaveBeenCalledWith(edgeID, "graphID", error);
    });
});

describe('Contradictions', () => {

    type TableEntry = [CheckName, boolean, ArgType[], CheckName, boolean, ArgType[], boolean];

    function assertSymmetricContradiction(effect1: Check, effect2: Check, expected: boolean) {
        expect(effect1.contradicts(effect2)).toBe(expected);
        expect(effect2.contradicts(effect1)).toBe(expected);
    }

    function assertSymmetricContradiction2(effect1: Check, name: CheckName, negated: boolean,
                                           args: ArgType[], expected: boolean) {
        assertSymmetricContradiction(effect1, newCheck(edgeID, {name, negated, args: args as any}), expected);
    }

    function mapToTwoEffects(checkName1: CheckName, negated1: boolean, args1: ArgType[],
                             checkName2: CheckName, negated2: boolean, args2: ArgType[], expected: boolean): [Check, Check, boolean] {
        return [
            newCheck(edgeID, {name: checkName1, negated: negated1, args: args1 as any}),
            newCheck(edgeID, {name: checkName2, negated: negated2, args: args2 as any}), expected
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
            const effect1 = newCheck(edgeLabel, {
                name: first,
                negated: true,
                args: [id, edgeLabel, option1, "0"] as any
            });
            for (const option2 of optionsSecond) {
                const effect2 = newCheck(edgeLabel, {
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

    function getEffectComparisonChangeCombinations(first: CheckName, second: CheckName): [Check, Check, boolean][] {
        return getEffectsCombinationsFor("sprite", "var", first, optionsFirst, second, optionsSecond);
    }


    test("effect.contradicts() throws for null argument", () => {
        expect(() => {
            const effect = newCheck(edgeID, {name: "AttrComp", negated: true, args: ["sprite", "attr", ">", "0"]});
            effect.contradicts(null);
        }).toThrow();
    });

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
            newCheck(edgeID, {name: "Output", negated: true, args: ["sprite", "hi"]}),
            newCheck(edgeID, {name: "VarChange", negated: true, args: ["test", "var", "+"]}),
            newCheck(edgeID, {name: "AttrChange", negated: true, args: ["test", "attr", "-"]}),
            newCheck(edgeID, {name: "BackgroundChange", negated: true, args: ["test"]}),
            newCheck(edgeID, {name: "VarComp", negated: true, args: ["sprite", "var", ">", "0"]}),
            newCheck(edgeID, {name: "AttrComp", negated: true, args: ["sprite", "attr", ">", "0"]}),
            newCheck(edgeID, {name: "Key", negated: true, args: ["right arrow"]}),
            newCheck(edgeID, {name: "Click", negated: true, args: ["sprite"]}),
            newCheck(edgeID, {name: "SpriteColor", negated: true, args: ["sprite", 255, 0, 0]}),
            newCheck(edgeID, {name: "SpriteTouching", negated: true, args: ["sprite", "sprite1"]}),
            newCheck(edgeID, {name: "TouchingEdge", negated: true, args: ["sprite"]}),
            newCheck(edgeID, {name: "NbrOfVisibleClones", negated: true, args: ["sprite", "==", 1]}),
            newCheck(edgeID, {name: "NbrOfClones", negated: true, args: ["sprite", "==", 1]}),
            newCheck(edgeID, {name: "TimeAfterEnd", negated: true, args: [1000]}),
            newCheck(edgeID, {name: "TimeBetween", negated: true, args: [1000]}),
            newCheck(edgeID, {name: "TimeElapsed", negated: true, args: [1000]}),
            newCheck(edgeID, {name: "Probability", negated: true, args: [0]}),
            newCheck(edgeID, {name: "Expr", negated: true, args: ["test"]}),
        ];

        it.each(createAllPairs(effects))('%s and %s do not contradict each other',
            (a, b) => assertSymmetricContradiction(a, b, false));
    });

    test("contradictions output", () => {
        const output = newCheck(edgeID, {name: "Output", negated: true, args: ["sprite", "hi"]});
        assertSymmetricContradiction2(output, "Output", true, ["sprite1", "hi"], false);
        assertSymmetricContradiction2(output, "Output", true, ["sprite", "hi"], false);
        assertSymmetricContradiction2(output, "Output", true, ["sprite", "hi2"], true);
    });

    test("contradictions background", () => {
        const background = newCheck(edgeID, {name: "BackgroundChange", negated: true, args: ["test"]});
        assertSymmetricContradiction2(background, "BackgroundChange", true, ["test"], false);
        assertSymmetricContradiction2(background, "BackgroundChange", true, ["test2"], true);
    });

    describe("contradiction: variable change and comparison", () => {
        test('not the same sprite', () => {
            const varChange = newCheck(edgeID, {name: "VarChange", negated: true, args: ["test", "var", "+"]});
            const varComp = newCheck(edgeID, {
                name: "VarComp",
                negated: true,
                args: ["sprite", "var", ">", "0"]
            });
            assertSymmetricContradiction(varChange, varComp, false);
        });

        test('not the same var', () => {
            const varChange = newCheck(edgeID, {
                name: "VarChange",
                negated: true,
                args: ["sprite", "var", "+"]
            });
            const varComp = newCheck(edgeID, {
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
                name: "AttrChange",
                negated: true,
                args: ["test", "var", "+"]
            });
            const attrComp = newCheck(edgeID, {
                name: "AttrComp",
                negated: true,
                args: ["sprite", "var", ">", "0"]
            });
            assertSymmetricContradiction(attrChange, attrComp, false);
        });

        test('not the same var', () => {
            const attrChange = newCheck(edgeID, {
                name: "AttrChange",
                negated: true,
                args: ["sprite", "var", "+"]
            });
            const attrComp = newCheck(edgeID, {
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
            ["VarChange", true, ['sprite', 'var', '-5'], "VarChange", true, ['sprite', 'var', '-7'], false],
            ["VarChange", true, ['sprite', 'var', '+5'], "VarChange", true, ['sprite', 'var', '+7'], false],
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

            ["VarComp", false, ["sprite", "var", "=", "3"], "VarComp", false, ["sprite", "var", "!=", "3"], true],
            ["VarComp", false, ["sprite", "var", "=", "3"], "VarComp", true, ["sprite", "var", "!=", "3"], false],
            ["VarComp", true, ["sprite", "var", "=", "1"], "VarComp", false, ["sprite", "var", "!=", "1"], false],
            ["VarComp", true, ["sprite", "var", "=", "1"], "VarComp", true, ["sprite", "var", "!=", "1"], true],
        ];
        it.each(mapToRightFormat(table))('%s contradicts %s == %s', assertSymmetricContradiction);
    });

    test("contradiction: click", () => {
        const effect1 = newCheck(edgeID, {name: "Click", negated: true, args: ["sprite1"]});
        assertSymmetricContradiction2(effect1, "Click", true, ["sprite2"], true);
        assertSymmetricContradiction2(effect1, "Click", true, ["sprite1"], false);
    });

    test("contradiction: key", () => {
        const effect1 = newCheck(edgeID, {name: "Key", negated: true, args: ["left"]});
        assertSymmetricContradiction2(effect1, "Key", true, ["right"], false);
        assertSymmetricContradiction2(effect1, "Key", true, ["left"], false);
    });

    test("contradiction: sprite color", () => {
        const effect1 = newCheck(edgeID, {
            name: "SpriteColor",
            negated: true,
            args: ["sprite1", 0, 0, 0]
        });
        assertSymmetricContradiction2(effect1, "SpriteColor", true, ["sprite2", "0", "0", "0"], false);
        // it can touch multiple colors at the same time
        assertSymmetricContradiction2(effect1, "SpriteColor", true, ["sprite1", "0", "0", "1"], false);
    });

    test("contradiction: sprite touching", () => {
        const effect1 = newCheck(edgeID, {name: "SpriteTouching", negated: true, args: ["sprite1", "sprite2"]});
        assertSymmetricContradiction2(effect1, "SpriteTouching", true, ["sprite2", "sprite3"], false);
        assertSymmetricContradiction2(effect1, "SpriteTouching", true, ["sprite1", "sprite3"], false);
    });

    test("contradiction: expr", () => {
        const effect1 = newCheck(edgeID, {name: "Expr", negated: true, args: ["whatever"]});
        assertSymmetricContradiction2(effect1, "Expr", true, ["whatever2"], false);
        assertSymmetricContradiction2(effect1, "Click", true, ["whatever"], false);
    });

    // actually an effect with probability result is quite dumb to have....
    test("contradiction: probability", () => {
        const effect1 = newCheck(edgeID, {name: "Probability", negated: true, args: [1]});
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
        const effect1 = newCheck(edgeID, {name: "TouchingEdge", negated: true, args: ["sprite"]});
        assertSymmetricContradiction2(effect1, "TouchingEdge", true, ["sprite2"], false);
        assertSymmetricContradiction2(effect1, "TouchingEdge", true, ["sprite"], false);
    });

    test("contradiction negation", () => {
        const effect1 = newCheck(edgeID, {name: "TouchingEdge", negated: true, args: ["sprite"]});
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
            name: "AttrComp",
            negated: false,
            args: ["sprite", "var", "==", "0"]
        });

        const attrComp2 = new AttrComp(edgeID, {negated: true, args: ["sprite", "var", "<=", "2"]});
        const attrComp3 = new AttrComp(edgeID, {args: ["sprite", "var", "<=", "2"]});

        expect(attrComp.testForContradictingWithEvents(new Checks([attrComp2]))).toBe(true);
        expect(attrComp.testForContradictingWithEvents(new Checks([attrComp3]))).toBe(false);
    });
});
