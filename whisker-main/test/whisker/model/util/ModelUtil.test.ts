import {ModelUtil} from "../../../../src/whisker/model/util/ModelUtil";

describe('ModelUtil tests', function () {
    test('test change: error no number', () => {
        expect(function () {
            ModelUtil.testChange("0", "string", "-")
        }).toThrow();

        expect(function () {
            ModelUtil.testChange("string", "0", "-")
        }).toThrow();

        expect(function () {
            ModelUtil.testChange("string", "0", "+")
        }).toThrow();

        expect(function () {
            ModelUtil.testChange("0", "string", "+")
        }).toThrow();
    });

    test("test change: decrease number", () => {
        expect(ModelUtil.testChange("0", "-1", "-")).toBeTruthy();
        expect(ModelUtil.testChange("-1", "0", "-")).toBeFalsy();
        expect(ModelUtil.testChange("1", "1", "-")).toBeFalsy();
    })

    test("test change: increase number", () => {
        expect(ModelUtil.testChange("0", "-1", "+")).toBeFalsy();
        expect(ModelUtil.testChange("-1", "0", "+")).toBeTruthy();
        expect(ModelUtil.testChange("1", "1", "+")).toBeFalsy();
    })

    test("test change: equality", () => {
        expect(ModelUtil.testChange("0", "-1", "=")).toBeFalsy();
        expect(ModelUtil.testChange("-1", "0", "=")).toBeFalsy();
        expect(ModelUtil.testChange("1", "1", "=")).toBeTruthy();
    })

    test("test change: error", () => {
        expect(() => {
            ModelUtil.testChange("0", "1", "anything")
        }).toThrow();
        expect(() => {
            ModelUtil.testChange("0", "1", null)
        }).toThrow();
        expect(() => {
            ModelUtil.testChange(null, "1", "+")
        }).toThrow();
        expect(() => {
            ModelUtil.testChange("0", null, "-")
        }).toThrow();
    })

    test('errors', () => {
        expect(function () {
            ModelUtil.compare("0", "string", ">")
        }).toThrow();
        expect(function () {
            ModelUtil.compare("string", "0", ">")
        }).toThrow();

        expect(function () {
            ModelUtil.compare("string", "0", "<")
        }).toThrow();
        expect(function () {
            ModelUtil.compare("0", "string", "<")
        }).toThrow();

        expect(function () {
            ModelUtil.compare("0", "string", ">=")
        }).toThrow();
        expect(function () {
            ModelUtil.compare("string", "0", ">=")
        }).toThrow();

        expect(function () {
            ModelUtil.compare("0", "string", ">=")
        }).toThrow();
        expect(function () {
            ModelUtil.compare("string", "0", ">=")
        }).toThrow();

        expect(function () {
            ModelUtil.compare("string", "0", "<>=")
        }).toThrow();
    });

    test("test compare: decrease number", () => {
        expect(ModelUtil.compare("0", "-1", "<")).toBeFalsy();
        expect(ModelUtil.compare("-1", "0", "<")).toBeTruthy();
        expect(ModelUtil.compare("1", "1", "<")).toBeFalsy();

        expect(ModelUtil.compare("0", "-1", "<=")).toBeFalsy();
        expect(ModelUtil.compare("-1", "0", "<=")).toBeTruthy();
        expect(ModelUtil.compare("1", "1", "<=")).toBeTruthy();
    })

    test("test compare: increase number", () => {
        expect(ModelUtil.compare("0", "-1", ">")).toBeTruthy();
        expect(ModelUtil.compare("-1", "0", ">")).toBeFalsy();
        expect(ModelUtil.compare("1", "1", ">")).toBeFalsy();

        expect(ModelUtil.compare("0", "-1", ">=")).toBeTruthy();
        expect(ModelUtil.compare("-1", "0", ">=")).toBeFalsy();
        expect(ModelUtil.compare("1", "1", ">=")).toBeTruthy();
    })

    test("test compare: equal", () => {
        expect(ModelUtil.compare("0", "-1", "=")).toBeFalsy();
        expect(ModelUtil.compare("-1", "0", "=")).toBeFalsy();
        expect(ModelUtil.compare("1", "1", "=")).toBeTruthy();
        expect(ModelUtil.compare("hallo", "hallo", "=")).toBeTruthy();
        expect(ModelUtil.compare("1", "hallo", "=")).toBeFalsy();
    })

    test("test compare: booleans", () => {
        expect(ModelUtil.compare("true", "true", "=")).toBeTruthy();
        expect(ModelUtil.compare("false", "false", "=")).toBeTruthy();
        expect(ModelUtil.compare("true", "false", "=")).toBeFalsy();
        expect(ModelUtil.compare("false", "true", "=")).toBeFalsy();
    })

    test("test number", () => {
        expect(() => ModelUtil.testNumber("string")).toThrow();
        expect(() => ModelUtil.testNumber("")).toThrow();
        expect(() => ModelUtil.testNumber(null)).toThrow();
        expect(() => ModelUtil.testNumber(undefined)).toThrow();;
        expect(() => ModelUtil.testNumber(1)).not.toThrow();;
        expect(() => ModelUtil.testNumber("1")).not.toThrow();;
    })
});
