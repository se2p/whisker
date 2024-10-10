import {Dependencies, ModelUtil} from "../../../../src/whisker/model/util/ModelUtil";
import {ArgType} from "../../../../src/whisker/model/components/Check";
import {
    ExpressionEnterError,
    ExprEvalError,
    VariableNotFoundError
} from "../../../../src/whisker/model/util/ModelError";
import {TestDriverMock} from "../TestDriverMock";
import {SpriteMock} from "../SpriteMock";

describe('ModelUtil tests', function () {
    describe('testChange()', () => {
        describe('exception for invalid input', () => {
            const invalidInputs: [string, string, string][] = [
                ["0", "string", "-"],
                ["string", "0", "-"],
                ["string", "0", "+"],
                ["0", "string", "+"],
                ["0", "1", "anything"],
                ["0", "1", null],
                [null, "1", "+"],
                ["0", null, "-"],
            ];
            it.each(invalidInputs)('throw exception for: %s, %s, %s',
                (oldValue, newValue, change) => {
                    expect(() => {
                        ModelUtil.testChange(oldValue, newValue, change);
                    }).toThrow();
                });
        });

        describe('correct return values', () => {
            const params: [string, string, string, boolean][] = [
                ["0", "-1", "-", true],
                ["-1", "0", "-", false],
                ["1", "1", "-", false],

                ["0", "-1", "+5", false],
                ["-1", "0", "+", true],
                ["1", "1", "+", false],

                ["0", "-1", "=", false],
                ["-1", "0", "=", false],
                ["1", "1", "=", true],

                ["0", "-1", "+=", false],
                ["0", "-1", "-=", true],
            ];
            it.each(params)('testChange(%s, %s, %s) == %s',
                (oldValue, newValue, change, expected) => {
                    expect(ModelUtil.testChange(oldValue, newValue, change)).toBe(expected);
                });
        });
    });

    describe('compare()', () => {
        describe('exception for invalid input', () => {
            const invalidInputs: [string, string, string][] = [
                [undefined, "string", ">"],
                ["0", undefined, ">"],
                ["0", "string", "increase"],
                ["0", "string", ">"],
                ["string", "0", ">"],

                ["string", "0", "<"],
                ["0", "string", "<"],

                ["0", "string", ">="],
                ["string", "0", ">="],

                ["0", "string", ">="],
                ["string", "0", ">="],

                ["string", "0", "<>="]
            ];
            it.each(invalidInputs)('throw exception for: %s; %s, %s',
                (value1, value2, comparison) => {
                    expect(() => {
                        ModelUtil.compare(value1, value2, comparison);
                    }).toThrow();
                });
        });

        describe("correct result for compare()", () => {
            const params: [string, string, string, boolean][] = [
                ["0", "-1", "<", false],
                ["-1", "0", "<", true],
                ["1", "1", "<", false],

                ["0", "-1", "<=", false],
                ["-1", "0", "<=", true],
                ["1", "1", "<=", true],

                ["0", "-1", ">", true],
                ["-1", "0", ">", false],
                ["1", "1", ">", false],

                ["0", "-1", ">=", true],
                ["-1", "0", ">=", false],
                ["1", "1", ">=", true],

                ["0", "-1", "=", false],
                ["-1", "0", "=", false],
                ["1", "1", "=", true],
                ["hallo", "hallo", "=", true],
                ["1", "hallo", "=", false],

                ["true", "true", "=", true],
                ["false", "false", "=", true],
                ["true", "false", "=", false],
                ["false", "true", "=", false]
            ];
            it.each(params)("testChange(%s, %s, %s) == %s",
                (value1, value2, comparison, expected) => {
                    expect(ModelUtil.compare(value1, value2, comparison)).toBe(expected);
                });
        });
    });

    describe("testNumber()", () => {
        it.each(["string", "", null, undefined])('throw exception for %s', (value) => {
            expect(() => {
                ModelUtil.testNumber(value);
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
                expect(ModelUtil.testNumber(value)).toBe(expected);
            });
        });
    });

    describe("getDependencies()", () => {
        function checkDependenciesCorrect(func: string, dependencies: Dependencies) {
            expect(ModelUtil.getDependencies(func)).toStrictEqual(dependencies);
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
    });

    describe('checkAttributeExistence()', () => {
        const validNames = [
            "effects", "x", "y", "pos", "direction", "visible", "size", "currentCostume",
            "costume", "currentCostumeName", "volume", "layerOrder", "sayText", "rotationStyle"
        ];
        it.each(validNames)('checkAttributeForExistence("%s")', (name) => {
            expect(() => ModelUtil.checkAttributeExistence(null, "sprite", name)).not.toThrow();
        });
        it.each(validNames)('checkAttributeForExistence("%s") does not throw', (name) => {
            expect(() => ModelUtil.checkAttributeExistence(null, "sprite", "old." + name)).not.toThrow();
        });
        const nonValidNames = ["test", "something", "variable", "DIRECTION", "X", "Y", "Z", "z", "old.X"];
        it.each(nonValidNames)('checkAttributeForExistence("%s") does throw', (name) => {
            expect(() => ModelUtil.checkAttributeExistence(null, "sprite", +name)).toThrow();
        });
    });

    describe('getExpressionForEval', () => {
        test('throws exception when expression cannot be evaluated', () => {
            const tdMock = new TestDriverMock();
            // const expr = "throw new Exception(\"this is supposed to happen\")";
            const expr = "\"some wrong syntax'\"";
            expect(() => {
                ModelUtil.getExpressionForEval(tdMock.getTestDriver(), false, expr);
            }).toThrow(ExprEvalError);
        });

        test('Escapes input so expression is not evaluated', () => {
            const apple = new SpriteMock("apple");
            const kiwi = new SpriteMock("kiwi");
            const tdMock = new TestDriverMock([apple, kiwi]);
            const t = tdMock.getTestDriver();
            const expr = "t.getSprites(s => s.name == \"apple\").length == 1";
            const result = ModelUtil.getExpressionForEval(t, true, expr);
            const f = eval(result.expr);
            expect(f(t)).toBe(expr);
        });

        test('Expression cannot contain newlines', () => {
            const t = new TestDriverMock().getTestDriver();
            const expr = "Math.abs($(Bowl.old.x)-$(Bowl.x))\n==10";
            expect(() => {
                ModelUtil.getExpressionForEval(t, true, expr);
            }).toThrow(ExpressionEnterError);
        });

        test('Evaluated expression correct with dependencies', () => {
            const apple = new SpriteMock("Apple");
            const kiwi = new SpriteMock("Banana");
            const bowl = new SpriteMock("Bowl");
            bowl.variables = [{name: "x", value: 10}, {name: "name", value: "Bowl"}];
            const oldBowl = new SpriteMock("Bowl");
            oldBowl.variables = [{name: "x", value: 5}];
            bowl.old = oldBowl;
            const tdMock = new TestDriverMock([apple, kiwi, bowl]);
            const t = tdMock.getTestDriver();
            const expr = "$(Bowl.name)!=\"ApPle\"&&Math.abs($(Bowl.old.x)-$(Bowl.x))==10";
            const result = ModelUtil.getExpressionForEval(t, false, expr);
            const f = eval(result.expr);
            expect(f(t)).toBe(false);
            bowl.variables = [{name: "x", value: 15}, {name: "name", value: "Bowl"}];
            tdMock.currentSprites = SpriteMock.toSpriteMockMap([apple, kiwi, bowl]);
            expect(f(t)).toBe(true);
        });


        test('Produces the correct sting for multiple variables and sprites', () => {
            const expectedOutput = `(t) => {
const sprite0 = t.getSprites(sprite => sprite.name.includes('Kiwi'), false)[0];
if (sprite0 == undefined) {
    throw getSpriteNotFoundError('Kiwi');
}
const variable0 = sprite0.getVariable('name', false).value;
 if (variable0 == undefined) {
   throw getVariableNotFoundError('name');
}
const sprite1 = t.getSprites(sprite => sprite.name.includes('Bowl'), false)[0];
if (sprite1 == undefined) {
    throw getSpriteNotFoundError('Bowl');
}
return variable0+(-1*Math.abs(sprite1.old.y-sprite1.x)).toString();
}`;
            const bowl = new SpriteMock("Bowl");
            const kiwi = new SpriteMock("Kiwi");
            const oldBowl = new SpriteMock("Bowl");
            kiwi.variables = [{name: "x", value: 7}, {name: "name", value: "Kiwi"}];
            bowl.variables = [{name: "x", value: 17}];
            oldBowl.variables = [{name: "x", value: 5}, {name: "y", value: 9}];
            bowl.old = oldBowl;
            const tdMock = new TestDriverMock([bowl, kiwi]);
            const t = tdMock.getTestDriver();
            const expr = "$(Kiwi.name)+(-1*Math.abs($(Bowl.old.y)-$(Bowl.x))).toString()";
            const result = ModelUtil.getExpressionForEval(t, false, expr);
            expect(result.expr).toBe(expectedOutput);
            const f = eval(result.expr);
            expect(f(t)).toBe("Kiwi-8");
        });
    });

    test("checkVariableExistence() throws exception if variable does not exist", () => {
        const bowl = new SpriteMock("Bowl");
        const kiwi = new SpriteMock("Kiwi");
        kiwi.variables = [{name: "x", value: 7}, {name: "name", value: "Kiwi"}];
        bowl.variables = [{name: "y", value: 17}];
        const tdMock = new TestDriverMock([bowl, kiwi]);
        expect(() => {
            ModelUtil.checkVariableExistence(tdMock.getTestDriver(), false, kiwi.sprite, "xy");
        }).toThrow(VariableNotFoundError);
    });
});
