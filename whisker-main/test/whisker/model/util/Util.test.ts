import {Util} from "../../../../src/whisker/model/util/Util";

describe('Util tests', function () {
    test('test change: error no number', () => {
        expect(function () {
            Util.testChange("0", "string", "-")
        }).toThrow();

        expect(function () {
            Util.testChange("string", "0", "-")
        }).toThrow();

        expect(function () {
            Util.testChange("string", "0", "+")
        }).toThrow();

        expect(function () {
            Util.testChange("0", "string", "+")
        }).toThrow();
    });

    test("test change: decrease number", () => {
        expect(Util.testChange("0", "-1", "-")).toBeTruthy();
        expect(Util.testChange("-1", "0", "-")).toBeFalsy();
        expect(Util.testChange("1", "1", "-")).toBeFalsy();
    })

    test("test change: increase number", () => {
        expect(Util.testChange("0", "-1", "+")).toBeFalsy();
        expect(Util.testChange("-1", "0", "+")).toBeTruthy();
        expect(Util.testChange("1", "1", "+")).toBeFalsy();
    })

    test("test change: equality", () => {
        expect(Util.testChange("0", "-1", "=")).toBeFalsy();
        expect(Util.testChange("-1", "0", "=")).toBeFalsy();
        expect(Util.testChange("1", "1", "=")).toBeTruthy();
    })

    test("test change: error", () => {
        expect(() => {
            Util.testChange("0", "1", "anything")
        }).toThrow();
        expect(() => {
            Util.testChange("0", "1", null)
        }).toThrow();
        expect(() => {
            Util.testChange(null, "1", "+")
        }).toThrow();
        expect(() => {
            Util.testChange("0", null, "-")
        }).toThrow();
    })

    test('errors', () => {
        expect(function () {
            Util.compare("0", "string", ">")
        }).toThrow();
        expect(function () {
            Util.compare("string", "0", ">")
        }).toThrow();

        expect(function () {
            Util.compare("string", "0", "<")
        }).toThrow();
        expect(function () {
            Util.compare("0", "string", "<")
        }).toThrow();

        expect(function () {
            Util.compare("0", "string", ">=")
        }).toThrow();
        expect(function () {
            Util.compare("string", "0", ">=")
        }).toThrow();

        expect(function () {
            Util.compare("0", "string", ">=")
        }).toThrow();
        expect(function () {
            Util.compare("string", "0", ">=")
        }).toThrow();

        expect(function () {
            Util.compare("string", "0", "<>=")
        }).toThrow();
    });

    test("test compare: decrease number", () => {
        expect(Util.compare("0", "-1", "<")).toBeFalsy();
        expect(Util.compare("-1", "0", "<")).toBeTruthy();
        expect(Util.compare("1", "1", "<")).toBeFalsy();

        expect(Util.compare("0", "-1", "<=")).toBeFalsy();
        expect(Util.compare("-1", "0", "<=")).toBeTruthy();
        expect(Util.compare("1", "1", "<=")).toBeTruthy();
    })

    test("test compare: increase number", () => {
        expect(Util.compare("0", "-1", ">")).toBeTruthy();
        expect(Util.compare("-1", "0", ">")).toBeFalsy();
        expect(Util.compare("1", "1", ">")).toBeFalsy();

        expect(Util.compare("0", "-1", ">=")).toBeTruthy();
        expect(Util.compare("-1", "0", ">=")).toBeFalsy();
        expect(Util.compare("1", "1", ">=")).toBeTruthy();
    })

    test("test compare: equal", () => {
        expect(Util.compare("0", "-1", "=")).toBeFalsy();
        expect(Util.compare("-1", "0", "=")).toBeFalsy();
        expect(Util.compare("1", "1", "=")).toBeTruthy();
        expect(Util.compare("hallo", "hallo", "=")).toBeTruthy();
        expect(Util.compare("1", "hallo", "=")).toBeFalsy();
    })

    test("test compare: booleans", () => {
        expect(Util.compare("true", "true", "=")).toBeTruthy();
        expect(Util.compare("false", "false", "=")).toBeTruthy();
        expect(Util.compare("true", "false", "=")).toBeFalsy();
        expect(Util.compare("false", "true", "=")).toBeFalsy();
    })

    test("test number", () => {
        expect(() => Util.testNumber("string")).toThrow();
        expect(() => Util.testNumber("")).toThrow();
        expect(() => Util.testNumber(null)).toThrow();
        expect(() => Util.testNumber(undefined)).toThrow();;
        expect(() => Util.testNumber(1)).not.toThrow();;
        expect(() => Util.testNumber("1")).not.toThrow();;
    })
});
