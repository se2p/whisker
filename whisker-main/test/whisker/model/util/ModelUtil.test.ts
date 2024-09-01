import {ModelUtil} from "../../../../src/whisker/model/util/ModelUtil";

describe('ModelUtil tests', function () {
    test('ModelUtil test change', () => {
        expect(function () {
            ModelUtil.testChange("0", "string", "-");
        }).toThrow();

        expect(function () {
            ModelUtil.testChange("string", "0", "-");
        }).toThrow();

        expect(function () {
            ModelUtil.testChange("string", "0", "+");
        }).toThrow();

        expect(function () {
            ModelUtil.testChange("0", "string", "+");
        }).toThrow();

        expect(ModelUtil.testChange("0", "-1", "-")).toBe(true);
        expect(ModelUtil.testChange("-1", "0", "-")).toBe(false);
        expect(ModelUtil.testChange("1", "1", "-")).toBe(false);

        expect(ModelUtil.testChange("0", "-1", "+5")).toBe(false);
        expect(ModelUtil.testChange("-1", "0", "+")).toBe(true);
        expect(ModelUtil.testChange("1", "1", "+")).toBe(false);

        expect(ModelUtil.testChange("0", "-1", "=")).toBe(false);
        expect(ModelUtil.testChange("-1", "0", "=")).toBe(false);
        expect(ModelUtil.testChange("1", "1", "=")).toBe(true);

        expect(ModelUtil.testChange("0", "-1", "+=")).toBe(false);
        expect(ModelUtil.testChange("0", "-1", "-=")).toBe(true);

        expect(() => {
            ModelUtil.testChange("0", "1", "anything");
        }).toThrow();
        expect(() => {
            ModelUtil.testChange("0", "1", null);
        }).toThrow();
        expect(() => {
            ModelUtil.testChange(null, "1", "+");
        }).toThrow();
        expect(() => {
            ModelUtil.testChange("0", null, "-");
        }).toThrow();
    });

    test('ModelUtil errors', () => {
        expect(function () {
            ModelUtil.compare(undefined, "string", ">");
        }).toThrow();
        expect(function () {
            ModelUtil.compare("0", undefined, ">");
        }).toThrow();
        expect(function () {
            ModelUtil.compare("0", "string", "increase");
        }).toThrow();
        expect(function () {
            ModelUtil.compare("0", "string", ">");
        }).toThrow();
        expect(function () {
            ModelUtil.compare("string", "0", ">");
        }).toThrow();

        expect(function () {
            ModelUtil.compare("string", "0", "<");
        }).toThrow();
        expect(function () {
            ModelUtil.compare("0", "string", "<");
        }).toThrow();

        expect(function () {
            ModelUtil.compare("0", "string", ">=");
        }).toThrow();
        expect(function () {
            ModelUtil.compare("string", "0", ">=");
        }).toThrow();

        expect(function () {
            ModelUtil.compare("0", "string", ">=");
        }).toThrow();
        expect(function () {
            ModelUtil.compare("string", "0", ">=");
        }).toThrow();

        expect(function () {
            ModelUtil.compare("string", "0", "<>=");
        }).toThrow();
    });

    test("ModelUtil test compare", () => {
        expect(ModelUtil.compare("0", "-1", "<")).toBe(false);
        expect(ModelUtil.compare("-1", "0", "<")).toBe(true);
        expect(ModelUtil.compare("1", "1", "<")).toBe(false);

        expect(ModelUtil.compare("0", "-1", "<=")).toBe(false);
        expect(ModelUtil.compare("-1", "0", "<=")).toBe(true);
        expect(ModelUtil.compare("1", "1", "<=")).toBe(true);

        expect(ModelUtil.compare("0", "-1", ">")).toBe(true);
        expect(ModelUtil.compare("-1", "0", ">")).toBe(false);
        expect(ModelUtil.compare("1", "1", ">")).toBe(false);

        expect(ModelUtil.compare("0", "-1", ">=")).toBe(true);
        expect(ModelUtil.compare("-1", "0", ">=")).toBe(false);
        expect(ModelUtil.compare("1", "1", ">=")).toBe(true);

        expect(ModelUtil.compare("0", "-1", "=")).toBe(false);
        expect(ModelUtil.compare("-1", "0", "=")).toBe(false);
        expect(ModelUtil.compare("1", "1", "=")).toBe(true);
        expect(ModelUtil.compare("hallo", "hallo", "=")).toBe(true);
        expect(ModelUtil.compare("1", "hallo", "=")).toBe(false);

        expect(ModelUtil.compare("true", "true", "=")).toBe(true);
        expect(ModelUtil.compare("false", "false", "=")).toBe(true);
        expect(ModelUtil.compare("true", "false", "=")).toBe(false);
        expect(ModelUtil.compare("false", "true", "=")).toBe(false);
    });

    test("ModelUtil test number", () => {
        expect(() => ModelUtil.testNumber("string")).toThrow();
        expect(() => ModelUtil.testNumber("")).toThrow();
        expect(() => ModelUtil.testNumber(null)).toThrow();
        expect(() => ModelUtil.testNumber(undefined)).toThrow();
        expect(() => ModelUtil.testNumber(1)).not.toThrow();
        expect(() => ModelUtil.testNumber("1")).not.toThrow();
    });

    test("ModelUtil getDependencies attribute", () => {
        let func = "(t) => {" +
            "return t.getSprite('Apple').x == 0;}";

        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [],
            attrDependencies: [{spriteName: 'Apple', attrName: 'x'}]
        });
        func = "(t) => {" +
            "return t.getSprite('Apple').visible;}";

        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [],
            attrDependencies: [{spriteName: 'Apple', attrName: 'visible'}]
        });
        func = "(t) => {" +
            "t.getSprite('Apple').visible;"+
            "return t.getSprite('Apple').visible;}";

        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [],
            attrDependencies: [{spriteName: 'Apple', attrName: 'visible'}]
        });
        func = "(t) => {" +
            "let y = t.getSprite('ban').y;"+
            "return t.getSprite('Apple').visible;}";

        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [],
            attrDependencies: [{spriteName:'ban',attrName:'y'},{spriteName: 'Apple', attrName: 'visible'}]
        });
    });

    test("ModelUtil getDependencies variable", () => {
        let func = "(t) => {" +
            "return t.getSprite('Apple').getVariable('test') == '2'}";

        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [{spriteName: "Apple", varName: "test"}],
            attrDependencies: []
        });
        func = "(t) => {" +
            "let var1 = t.getSprite('Apple').getVariable('test');"+
            "return t.getSprite('Apple').getVariable('test') == '2'}";

        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [{spriteName: "Apple", varName: "test"}],
            attrDependencies: []
        });
        func = "(t) => {" +
            "let var1 = t.getSprite('Apple').getVariable('test2');"+
            "return t.getSprite('Apple').getVariable('test') == '2'}";

        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [{spriteName: "Apple", varName: "test2"},{spriteName: "Apple", varName: "test"}],
            attrDependencies: []
        });
    });

    test("ModelUtil getDependencies variable 2", () => {
        const func = "(t) => {" +
            "let sprite = t.getSprite('apple');" +
            "let variable = sprite.getVariable('test');" +
            "}";

        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [{spriteName: "apple", varName: "test"}],
            attrDependencies: []
        });
    });

    test("ModelUtil getDependencies two sprites", () => {
        const func = "(t) => {" +
            "let sprite = t.getSprite('apple');" +
            "sprite = t.getSprite('bananas');" +
            "let variable = sprite.getVariable('test');}";
        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [{spriteName: "bananas", varName: "test"}],
            attrDependencies: []
        });
    });

    test("ModelUtil getDependencies both attribute and variable", () => {
        const func = "(t) => {" +
            "let x = t.getSprite('apple').x;" +
            "sprite = t.getSprite('bananas');" +
            "let variable = sprite.getVariable('test');}";
        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [{spriteName: "bananas", varName: "test"}],
            attrDependencies: [{spriteName: "apple", attrName: "x"}]
        });
    });

    test("ModelUtil getDependencies nothing", () => {
        const func = "(t) => {" +
            "let x = t.getSprite('apple');" +
            "sprite = t.getSprite('bananas');}";
        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [],
            attrDependencies: []
        });
    });

    test("ModelUtil getDependencies with \" ", () => {
        let func = "(t) => {" +
            "let x = t.getSprite('apple');" +
            "sprite = t.getSprite('bananas');" +
            "return sprite.getVariable(\"test\");}";
        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [{spriteName: "bananas", varName: "test"}],
            attrDependencies: []
        });

        func = "(t) => {" +
            "let x = t.getSprite(\"apple\").x;" +
            "sprite = t.getSprite(\"bananas\");" +
            "let variable = sprite.getVariable(\"test\");}";
        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [{spriteName: "bananas", varName: "test"}],
            attrDependencies: [{spriteName: "apple", attrName: "x"}]
        });
    });

    test("ModelUtil getDependencies crossed use", () => {
        const func = "(t) => {" +
            "let apple = t.getSprite('apple');" +
            "sprite = t.getSprite('bananas');" +
            "let variable = sprite.getVariable('test');" +
            "let x = apple.x;}";
        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [{spriteName: "bananas", varName: "test"}],
            attrDependencies: [{spriteName: "apple", attrName: "x"}]
        });
    });

    test("ModelUtil getDependencies crossed use 2", () => {
        const func = "(t) => {" +
            "let apple = t.getSprite('apple');" +
            "sprite = t.getSprite('bananas');" +
            "let variable = sprite.getVariable('test');" +
            "let x = apple.x;" +
            "return apple.x;}";
        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [{spriteName: "bananas", varName: "test"}],
            attrDependencies: [{spriteName: "apple", attrName: "x"}]
        });
    });

    test("ModelUtil getDependencies wrong ones", () => {
        // Error ones
        let func = "(t) => {" +
            "let x = t.getSprite(apple).x;" +
            "sprite = t.getSprite('bananas');" +
            "let variable = sprite.getVariable('test');}";
        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [{spriteName: "bananas", varName: "test"}],
            attrDependencies: []
        });

        func = "(t) => {" +
            "let x = t.getSprite(apple).x;" +
            "sprite = t.getSprite(bananas);" +
            "let variable = sprite.getVariable('test');}";
        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [],
            attrDependencies: []
        });
        func = "(t) => {" +
            "let x = t.getSprite('apple').x;" +
            "sprite = t.getSprite('bananas');" +
            "let variable = sprite.getVariable(test);}";
        expect(ModelUtil.getDependencies(func)).toStrictEqual({
            varDependencies: [],
            attrDependencies: [{spriteName: "apple", attrName: "x"}]
        });
    });
});
