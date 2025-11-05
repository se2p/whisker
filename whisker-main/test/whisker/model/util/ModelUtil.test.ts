import {
    checkAttributeExistence,
    checkCyclicValueWithinDelta,
    checkSpriteExistence,
    checkVariableExistence,
    Dependencies,
    evaluateExpression,
    getDependencies,
    getExpectedDirectionForSprite1LookingAtTarget,
    getExpressionForEval,
    testNumber
} from "../../../../src/whisker/model/util/ModelUtil";
import {
    EmptyExpressionError,
    ExpressionSyntaxError,
    SpriteNotFoundError,
    VariableNotFoundError
} from "../../../../src/whisker/model/util/ModelError";
import {getDummyTestDriver, TestDriverMock} from "../mocks/TestDriverMock";
import {SpriteMock} from "../mocks/SpriteMock";
import Sprite from "../../../../src/vm/sprite";
import Variable from "../../../../src/vm/variable";
import {ArgType} from "../../../../src/whisker/model/util/schema";
import {numberAttributeNames, stringAttributeNames} from "../../../../src/whisker/model/checks/CheckTypes";
import {STAGE_NAME} from "../../../../src/assembler/utils/selectors";

const graphID = "graphID";

describe('ModelUtil tests', function () {
    describe("testNumber()", () => {
        it.each(["string", "", null, undefined])('throw exception for %s', (value) => {
            expect(() => {
                testNumber(value);
            }).toThrow();
        });

        describe('parsing valid inputs', () => {
            const table: [string, ArgType, number][] = [
                ['"1" as string', "1", 1],
                ['1 as number', 1, 1],
                ['"-10" as number', "-10", -10],
                ['-1 as number', -1, -1],
            ];
            it.each(table)('parsing %s', (name, value, expected) => {
                expect(testNumber(value)).toBe(expected);
            });
        });
    });

    describe("getDependencies()", () => {
        function checkDependenciesCorrect(func: string, dependencies: Dependencies) {
            expect(getDependencies(func)).toStrictEqual(dependencies);
        }

        describe('ModelUtil getDependencies attribute', () => {
            const table: [string, Dependencies][] = [
                [
                    "(t) => { return t.getSprite('Apple').x == 0;} ",
                    {varDependencies: [], attrDependencies: [{spriteName: 'Apple', attrName: 'x'}]}
                ],
                [
                    "(t) => { return t.getSprite('Apple').visible;} ", {
                    varDependencies: [], attrDependencies: [{spriteName: 'Apple', attrName: 'visible'}]
                }
                ],
                [
                    "(t) => { t.getSprite('Apple').visible; return t.getSprite('Apple').visible;} ",
                    {varDependencies: [], attrDependencies: [{spriteName: 'Apple', attrName: 'visible'}]}
                ],
                [
                    "(t) => { let y = t.getSprite('ban').y; return t.getSprite('Apple').visible;} ",
                    {
                        varDependencies: [],
                        attrDependencies: [{spriteName: 'ban', attrName: 'y'}, {
                            spriteName: 'Apple',
                            attrName: 'visible'
                        }]
                    }
                ],
            ];
            it.each(table)('%s has right dependencies', checkDependenciesCorrect);
        });

        describe('ModelUtil getDependencies variable', () => {
            const table: [string, Dependencies][] = [
                [
                    "(t) => { return t.getSprite('Apple').getVariable('test') == '2'} ",
                    {varDependencies: [{spriteName: "Apple", varName: "test"}], attrDependencies: []}
                ],
                [
                    "(t) => { let var1 = t.getSprite('Apple').getVariable('test'); return t.getSprite('Apple').getVariable('test') == '2'} ",
                    {varDependencies: [{spriteName: "Apple", varName: "test"}], attrDependencies: []}
                ],
                [
                    "(t) => { let var1 = t.getSprite('Apple').getVariable('test2'); return t.getSprite('Apple').getVariable('test') == '2'} ",
                    {
                        varDependencies: [{spriteName: "Apple", varName: "test2"}, {
                            spriteName: "Apple",
                            varName: "test"
                        }],
                        attrDependencies: []
                    }
                ]
            ];
            it.each(table)('%s has right dependencies', checkDependenciesCorrect);
        });

        describe('ModelUtil getDependencies with "', () => {
            const table: [string, Dependencies][] = [
                [
                    "(t) => { let x = t.getSprite('apple'); sprite = t.getSprite('bananas'); return sprite.getVariable(\"test\");} ",
                    {varDependencies: [{spriteName: "bananas", varName: "test"}], attrDependencies: []}
                ],
                [
                    "(t) => { let x = t.getSprite(\"apple\").x; sprite = t.getSprite(\"bananas\"); let variable = sprite.getVariable(\"test\");} ",
                    {
                        varDependencies: [{spriteName: "bananas", varName: "test"}],
                        attrDependencies: [{spriteName: "apple", attrName: "x"}]
                    }
                ]
            ];
            it.each(table)('%s has right dependencies', checkDependenciesCorrect);
        });

        describe('ModelUtil getDependencies wrong ones', () => {
            const table: [string, Dependencies][] = [
                // Error ones
                [
                    "(t) => { let x = t.getSprite(apple).x; sprite = t.getSprite('bananas'); let variable = sprite.getVariable('test');} ",
                    {varDependencies: [{spriteName: "bananas", varName: "test"}], attrDependencies: []}
                ],

                [
                    "(t) => { let x = t.getSprite(apple).x; sprite = t.getSprite(bananas); let variable = sprite.getVariable('test');} ",
                    {varDependencies: [], attrDependencies: []}
                ],
                [
                    "(t) => { let x = t.getSprite('apple').x; sprite = t.getSprite('bananas'); let variable = sprite.getVariable(test);} ",
                    {varDependencies: [], attrDependencies: [{spriteName: "apple", attrName: "x"}]}
                ]
            ];
            it.each(table)('%s has right dependencies', checkDependenciesCorrect);
        });

        describe('Additional tests for getDependencies()', () => {
            const table: [string, string, Dependencies][] = [
                [
                    "ModelUtil getDependencies variable 2",
                    "(t) => { let sprite = t.getSprite('apple'); let variable = sprite.getVariable('test'); } ",
                    {varDependencies: [{spriteName: "apple", varName: "test"}], attrDependencies: []}
                ],
                [
                    "ModelUtil getDependencies two sprites",
                    "(t) => { let sprite = t.getSprite('apple'); sprite = t.getSprite('bananas'); let variable = sprite.getVariable('test');} ",
                    {varDependencies: [{spriteName: "bananas", varName: "test"}], attrDependencies: []}
                ],
                [
                    "ModelUtil getDependencies both attribute and variable",
                    "(t) => { let x = t.getSprite('apple').x; sprite = t.getSprite('bananas'); let variable = sprite.getVariable('test');} ",
                    {
                        varDependencies: [{spriteName: "bananas", varName: "test"}],
                        attrDependencies: [{spriteName: "apple", attrName: "x"}]
                    }
                ],
                [
                    "ModelUtil getDependencies nothing",
                    "(t) => { let x = t.getSprite('apple'); sprite = t.getSprite('bananas');} ",
                    {varDependencies: [], attrDependencies: []}
                ],
                [
                    "ModelUtil getDependencies crossed use",
                    "(t) => { let apple = t.getSprite('apple'); sprite = t.getSprite('bananas'); let variable = sprite.getVariable('test'); let x = apple.x;} ",
                    {
                        varDependencies: [{spriteName: "bananas", varName: "test"}],
                        attrDependencies: [{spriteName: "apple", attrName: "x"}]
                    }
                ],
                [
                    "ModelUtil getDependencies crossed use 2",
                    "(t) => { let apple = t.getSprite('apple'); sprite = t.getSprite('bananas'); let variable = sprite.getVariable('test'); let x = apple.x; return apple.x;} ",
                    {
                        varDependencies: [{spriteName: "bananas", varName: "test"}],
                        attrDependencies: [{spriteName: "apple", attrName: "x"}]
                    }
                ],
            ];
            it.each(table)('%s', (name, func, dependencies) => checkDependenciesCorrect(func, dependencies));
        });

        test('empty dependencies if t.getSprites is not called', () => {
            const res = getDependencies("Math.exp(-1)");
            expect(res.attrDependencies).toStrictEqual([]);
            expect(res.varDependencies).toStrictEqual([]);
        });
    });

    describe('checkAttributeExistence()', () => {
        const AttributeNames = [...stringAttributeNames, ...numberAttributeNames, "visible"];
        it.each(AttributeNames)('checkAttributeForExistence("%s")', (name) => {
            expect(() => checkAttributeExistence(null, "sprite", name)).not.toThrow();
        });
        it.each(AttributeNames)('checkAttributeForExistence("%s") does not throw', (name) => {
            expect(() => checkAttributeExistence(null, "sprite", "old." + name)).not.toThrow();
        });
        const nonValidNames = ["test", "something", "variable", "DIRECTION", "X", "Y", "Z", "z", "old.X"];
        it.each(nonValidNames)('checkAttributeForExistence("%s") does throw', (name) => {
            expect(() => checkAttributeExistence(null, "sprite", +name)).toThrow();
        });
    });

    describe('getExpressionForEval', () => {
        const t = getDummyTestDriver();
        test('throws exception when expression cannot be evaluated (wrong syntax)', () => {
            const expr = "'some wrong syntax";
            expect(() => {
                getExpressionForEval(t, expr, graphID);
            }).toThrow(ExpressionSyntaxError);
        });

        test('throws exception when expression cannot be evaluated (exception', () => {
            const expr = "throw new Exception(\"this is supposed to happen\")";
            expect(() => {
                getExpressionForEval(t, expr, graphID);
            }).toThrow(ExpressionSyntaxError);
        });

        test('throws exception when expression has no end tag', () => {
            const expr = "$(sprite.name";
            expect(() => {
                getExpressionForEval(t, expr, graphID);
            }).toThrow(ExpressionSyntaxError);
        });

        test('throws exception when expression is empty  $()', () => {
            const expr = "true && $() == 10";
            expect(() => {
                getExpressionForEval(t, expr, graphID);
            }).toThrow(EmptyExpressionError);
        });

        test('can create variables', () => {
            const tdMock = new TestDriverMock([new SpriteMock("apple", [{name: "x", value: 10}])]);
            const t = tdMock.getTestDriver();
            const expr = "{const value=$('apple', 'x');return value == 10}";
            const result = getExpressionForEval(t, expr, graphID);
            expect(evaluateExpression(t, result.expr, graphID)).toBe(true);
        });

        test('Evaluated expression correct with dependencies', () => {
            const apple = new SpriteMock("Apple");
            const kiwi = new SpriteMock("Banana");
            const bowl = new SpriteMock("Bowl");
            bowl.variables = [{name: "x", value: 10}, {name: "name", value: "Bowl"}];
            const oldBowl = new SpriteMock("Bowl");
            oldBowl.variables = [{name: "x", value: 5}];
            bowl._old = oldBowl;
            const tdMock = new TestDriverMock([apple, kiwi, bowl]);
            const t = tdMock.getTestDriver();
            const expr = '$("Bowl", "name")!="ApPle"&&Math.abs($("Bowl", "old").x-$("Bowl", "x"))==10';
            const result = getExpressionForEval(t, expr, graphID);
            expect(evaluateExpression(t, result.expr, graphID)).toBe(false);
            bowl.variables = [{name: "x", value: 15}, {name: "name", value: "Bowl"}];
            tdMock.currentSprites = SpriteMock.toSpriteArray([apple, kiwi, bowl]);
            expect(evaluateExpression(t, result.expr, graphID)).toBe(true);
        });

        test('Produces the correct sting for multiple variables and sprites', () => {
            const bowl = new SpriteMock("Bowl", [{name: "x", value: 17}]);
            const kiwi = new SpriteMock("Kiwi", [{name: "x", value: 7}, {name: "name", value: "Kiwi"}]);
            bowl._old = new SpriteMock("Bowl", [{name: "x", value: 5}, {name: "y", value: 9}]);
            const tdMock = new TestDriverMock([bowl, kiwi]);
            const t = tdMock.getTestDriver();
            const expr = '$("Kiwi", "name")+(-1*Math.abs($("Bowl", "old").y-$("Bowl", "x"))).toString()';
            const result = getExpressionForEval(t, expr, graphID);
            expect(evaluateExpression(t, result.expr, graphID)).toBe("Kiwi-8");
        });

        test('Produces correct result with () independent of $-expressions', () => {
            const boat = new SpriteMock("Boat", [{name: "x", value: 42}, {name: "speed", value: 100}]);
            const gate = new SpriteMock("Gate", [{name: "size", value: 3}]);
            const stage = new SpriteMock(STAGE_NAME, [{name: "direction", value: 140}, {name: "score", value: 10}]);
            const tdMock = new TestDriverMock([boat, gate, stage]);
            tdMock.stage = stage.sprite;
            const t = tdMock.getTestDriver();
            const expr = `$("Boat", "x").toString()+(-1*Math.sqrt($("Boat", "speed", true))).toString() == "42-10" && 3*($("Gate", "size")+2) < (2*($("${STAGE_NAME}", "score", true)-1)+10)/1.5`;
            const result = getExpressionForEval(t, expr, graphID);
            expect(evaluateExpression(t, result.expr, graphID)).toBe(true);
        });
    });

    describe('checkVariableExistence()', () => {
        const bowl = new SpriteMock("Bowl", [{name: "y", value: 17}]);
        const kiwi = new SpriteMock("Kiwi", [{name: "x", value: 7}, {name: "name", value: "Kiwi"}]);
        const stage = new SpriteMock(STAGE_NAME, [{name: "Points", value: 10}, {name: "Lives", value: 10}]);
        const tdMock = new TestDriverMock([bowl, kiwi, stage]);
        tdMock.stage = stage.sprite;
        const t = tdMock.getTestDriver();
        test("throws exception if variable does not exist", () => {
            expect(() => {
                checkVariableExistence(t, kiwi.sprite, "X");
            }).toThrow(VariableNotFoundError);
        });
        test("finds variable on other Sprites", () => {
            const res = checkVariableExistence(t, kiwi.sprite, "Points");
            expect(res.sprite).toEqual(stage.sprite);
            expect(res.variable).toEqual(stage.variables[0]);
        });
        test("Regex does not work", () => {
            expect(() => {
                checkVariableExistence(t, stage.sprite, "/oin/g");
            }).toThrow(VariableNotFoundError);
        });

        test("finds the correct option if only one matches", () => {
            let res: { sprite: Sprite, variable: Variable };
            expect(() => {
                res = checkVariableExistence(t, stage.sprite,
                    ["someInvalidVariable", "Score", "Points"]);
            }).not.toThrow(SpriteNotFoundError);
            expect(res.sprite == stage.sprite).toBe(true);
            expect(res.variable).toBe(stage.variables[0]);
        });

        test("Does not throw but simply returns one if multiply match", () => {
            let res: { sprite: Sprite, variable: Variable };
            expect(() => {
                res = checkVariableExistence(t, stage.sprite, ["Points", "Lives"]);
            }).not.toThrow(SpriteNotFoundError);
            expect(res.sprite == stage.sprite).toBe(true);
            expect(stage.variables.some(v => v == res.variable)).toBe(true);
        });
    });

    describe('checkSpriteExistence()', () => {
        const bowl = new SpriteMock("Bowl", [{name: "x", value: 17}]);
        const kiwi = new SpriteMock("Kiwi", [{name: "y", value: 7}, {name: "name", value: "Kiwi"}]);
        const stage = new SpriteMock(STAGE_NAME, [{name: "Punkte", value: 10}]);
        const tdMock = new TestDriverMock([bowl, kiwi, stage]);
        tdMock.stage = stage.sprite;
        const t = tdMock.getTestDriver();
        const table: [string, ArgType][] = [
            ["throws exception if sprite does not exist", "Banane"],
            ["throws exception if sprite does not exist (multiple options)", ["Banane", "banane", "Banana", "banana"]],
            ["Regex does not work", "/owl/g"],
        ];
        it.each(table)('%s', (name: string, spriteNames: ArgType) => {
            expect(() => {
                checkSpriteExistence(t, spriteNames);
            }).toThrow(SpriteNotFoundError);
        });

        test("finds the correct option if only one matches", () => {
            let res: Sprite;
            expect(() => {
                res = checkSpriteExistence(t, [bowl._name + "someTypo", "boowl", bowl._name]);
            }).not.toThrow(SpriteNotFoundError);
            expect(res).toBe(bowl.sprite);
        });

        test("Does not throw but simply returns one if multiply match", () => {
            let res: Sprite;
            expect(() => {
                res = checkSpriteExistence(t, [bowl._name, kiwi._name]);
            }).not.toThrow(SpriteNotFoundError);
            expect(res == bowl.sprite || res == kiwi.sprite).toBe(true);
        });
    });

    describe('getExpectedDirectionForSprite1LookingAtTarget()', () => {
        const sprite = new SpriteMock("Bowl", [{name: "x", value: 0}, {name: "y", value: 0}]).updateSprite();
        const table: [number, number, number][] = [
            [0, 123, 0],
            [12, 12, 45],
            [50, 0, 90],
            [25, -25, 135],
            [0, -78, 180],
            [-44, 44, -45],
            [-34, 0, -90],
            [-5, -5, -135],
        ];
        it.each(table)('expected direction for resulting vector(%s,%s): %s degrees in scratch', (x, y, expected) => {
            expect(getExpectedDirectionForSprite1LookingAtTarget(sprite, x, y)).toBe(expected);
        });
        const tableWithOffset: [number, number, number, number, number][] = [
            [23, 10, 23, 133, 0],
            [-10, -10, 2, 2, 45],
            [100, 35, 150, 35, 90],
            [-1, -12, 24, -37, 135],
            [-99, 12, -99, -90, 180],
            [13, 12, -31, 56, -45],
            [0, 16, -34, 16, -90],
            [10, 3, 5, -2, -135],
        ];

        it.each(tableWithOffset)('expected direction for -(%s,%s)+(%s,%s): %s degrees in scratch', (sx, sy, x, y, expected) => {
            const s = new SpriteMock("Bowl", [{name: "x", value: sx}, {name: "y", value: sy}]).updateSprite();
            expect(getExpectedDirectionForSprite1LookingAtTarget(s, x, y)).toBe(expected);
        });
    });

    describe('checkCyclicValueWithinDelta()', () => {
        const table: [boolean, number, number, number, number, number][] = [
            [true, 0, 3.0, 0, -10, 10],
            [false, 0, 3.0, 3.1, -10, 10],
            [true, -8, 3.0, 9.5, -10, 10],
            [true, 9.5, 3.0, -8, -10, 10],
            [false, 39, 3.5, 3, 0, 40],
        ];
        it.each(table)('Returns %s for %s is not more than %s away from %s (for cycle from %s to %s)', (result, actual, delta, expected, min, max) => {
            expect(checkCyclicValueWithinDelta(actual, expected, min, max, delta)).toBe(result);
        });
    });
});
