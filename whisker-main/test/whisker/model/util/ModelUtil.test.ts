import {Dependencies, ModelUtil} from "../../../../src/whisker/model/util/ModelUtil";
import {ArgType} from "../../../../src/whisker/model/components/Check";
import {
    EmptyExpressionError,
    ExpressionEndTagMissingError,
    ExpressionEnterError,
    ExprEvalError,
    VariableNotFoundError
} from "../../../../src/whisker/model/util/ModelError";
import {getDummyTestDriver, TestDriverMock} from "../TestDriverMock";
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

                ["1", "0", "<>="]
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

        test('empty dependencies if t.getSprites is not called', () => {
           const res = ModelUtil.getDependencies("Math.exp(-1)");
           expect(res.attrDependencies).toStrictEqual([]);
           expect(res.varDependencies).toStrictEqual([]);
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
        const t = getDummyTestDriver();
        test('throws exception when expression cannot be evaluated', () => {
            const tdMock = new TestDriverMock();
            // const expr = "throw new Exception(\"this is supposed to happen\")";
            const expr = "\"some wrong syntax'\"";
            expect(() => {
                ModelUtil.getExpressionForEval(tdMock.getTestDriver(), false, expr);
            }).toThrow(ExprEvalError);
        });

        test('throws exception when expression has no end tag', () => {
            const expr = "$(sprite.name";
            expect(() => {
                ModelUtil.getExpressionForEval(t, false, expr);
            }).toThrow(ExpressionEndTagMissingError);
        });

        test('throws exception when expression is empty  $()', () => {
            const expr = "true && $() == 10";
            expect(() => {
                ModelUtil.getExpressionForEval(t, false, expr);
            }).toThrow(EmptyExpressionError);
        });

        test('does not allow assignment of variables', () => {
            const tdMock = new TestDriverMock([new SpriteMock("apple", [{name: "x", value: 10}])]);
            const testDriver = tdMock.getTestDriver();
            const expr = "const value=$(apple.x);return value == 10";
            expect(() => {
                ModelUtil.getExpressionForEval(testDriver, false, expr);
            }).toThrow(ExprEvalError);
            // TODO: I think the test should rather look like this because "=" should not be automatically converted to "=="
            // const result = ModelUtil.getExpressionForEval(testDriver, false, expr);
            // const f = eval(result.expr);
            // expect(f(testDriver)).toBe(true);
        });

        test('adds missing \' at the end of constant expression', () => {
            const res = ModelUtil.getExpressionForEval(t, false, "'some text");
            const f = eval(res.expr);
            expect(f(t)).toBe("some text");
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
            const t = getDummyTestDriver();
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
            tdMock.currentSprites = SpriteMock.toSpriteArray([apple, kiwi, bowl]);
            expect(f(t)).toBe(true);
        });

        test('Produces the correct sting for multiple variables and sprites', () => {
            const expectedOutput = `(t) => {
const sprite0 = t.getSprites(sprite => sprite.name.includes('Kiwi'), false)[0];
if (sprite0 == undefined) {
    throw new SpriteNotFoundError('Kiwi');
}
const variable0 = sprite0.getVariable('name', false).value;
 if (variable0 == undefined) {
   throw new VariableNotFoundError('name');
}
const sprite1 = t.getSprites(sprite => sprite.name.includes('Bowl'), false)[0];
if (sprite1 == undefined) {
    throw new SpriteNotFoundError('Bowl');
}
return variable0+(-1*Math.abs(sprite1.old.y-sprite1.x)).toString();
}`;
            const bowl = new SpriteMock("Bowl", [{name: "x", value: 17}]);
            const kiwi = new SpriteMock("Kiwi", [{name: "x", value: 7}, {name: "name", value: "Kiwi"}]);
            bowl.old = new SpriteMock("Bowl", [{name: "x", value: 5}, {name: "y", value: 9}]);
            const tdMock = new TestDriverMock([bowl, kiwi]);
            const t = tdMock.getTestDriver();
            const expr = "$(Kiwi.name)+(-1*Math.abs($(Bowl.old.y)-$(Bowl.x))).toString()";
            const result = ModelUtil.getExpressionForEval(t, false, expr);
            expect(result.expr).toBe(expectedOutput);
            const f = eval(result.expr);
            expect(f(t)).toBe("Kiwi-8");
        });

        test('Produces correct result with () independent of $-expressions', () => {
            const expectedOutput = `(t) => {
const sprite0 = t.getSprites(sprite => sprite.name.includes('Boat'), false)[0];
if (sprite0 == undefined) {
    throw new SpriteNotFoundError('Boat');
}
const variable0 = sprite0.getVariable('speed', false).value;
 if (variable0 == undefined) {
   throw new VariableNotFoundError('speed');
}
const sprite1 = t.getSprites(sprite => sprite.name.includes('Gate'), false)[0];
if (sprite1 == undefined) {
    throw new SpriteNotFoundError('Gate');
}
const sprite2 = t.getSprites(sprite => sprite.name.includes('Stage'), false)[0];
if (sprite2 == undefined) {
    throw new SpriteNotFoundError('Stage');
}
const variable2 = sprite2.getVariable('score', false).value;
 if (variable2 == undefined) {
   throw new VariableNotFoundError('score');
}
return sprite0.x.toString()+(-1*Math.sqrt(variable0)).toString() == '42-10' && 3*(sprite1.size+2) < (2*(variable2-1)+10)/1.5;
}`;
            const boat = new SpriteMock("Boat", [{name: "x", value: 42}, {name: "speed", value: 100}]);
            const gate = new SpriteMock("Gate", [{name: "size", value: 3}]);
            const stage = new SpriteMock("Stage", [{name: "direction", value: 140}, {name: "score", value: 10}]);
            const tdMock = new TestDriverMock([boat, gate, stage]);
            tdMock.stage = stage.sprite;
            const t = tdMock.getTestDriver();
            const expr = "$(Boat.x).toString()+(-1*Math.sqrt($(Boat.speed))).toString() == '42-10' && 3*($(Gate.size)+2) < (2*($(Stage.score)-1)+10)/1.5";
            const result = ModelUtil.getExpressionForEval(t, false, expr);
            expect(result.expr).toBe(expectedOutput);
            const f = eval(result.expr);
            expect(f(t)).toBe(true);
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
