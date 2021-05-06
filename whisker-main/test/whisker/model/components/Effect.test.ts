import {Effect, EffectName} from "../../../../src/whisker/model/components/Effect";

describe('Effect', () => {
    test('test change: error no number', () => {
        expect(function () {
            Effect.testChange("0", "string", "-")
        }).toThrow();

        expect(function () {
            Effect.testChange("string", "0", "-")
        }).toThrow();

        expect(function () {
            Effect.testChange("string", "0", "+")
        }).toThrow();

        expect(function () {
            Effect.testChange("0", "string", "+")
        }).toThrow();
    });

    test("test change: test change: decrease number", () => {
        expect(Effect.testChange("0", "-1", "-")).toBeTruthy();
        expect(Effect.testChange("-1", "0", "-")).toBeFalsy();
        expect(Effect.testChange("1", "1", "-")).toBeFalsy();
    })

    test("test change: increase number", () => {
        expect(Effect.testChange("0", "-1", "+")).toBeFalsy();
        expect(Effect.testChange("-1", "0", "+")).toBeTruthy();
        expect(Effect.testChange("1", "1", "+")).toBeFalsy();
    })

    test("test change: equal", () => {
        expect(Effect.testChange("0", "-1", "=")).toBeFalsy();
        expect(Effect.testChange("-1", "0", "=")).toBeFalsy();
        expect(Effect.testChange("1", "1", "=")).toBeTruthy();
    })

    test("test change: some string test", () => {
        expect(Effect.testChange(null, "hallo", "hallo")).toBeTruthy();
        expect(Effect.testChange(null, "hallo", "2")).toBeFalsy();
        expect(Effect.testChange("2", "hallo", "hallo")).toBeTruthy();
        expect(Effect.testChange(null, true, "true"));
        expect(Effect.testChange(null, false, "false"));
    })

    test("no arguments", () => {
        expect(() => {
            new Effect(EffectName.Output, true, [])
        }).toThrow();
        expect(() => {
            new Effect(EffectName.VarChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.AttrChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.BackgroundChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.BackgroundChange, true, [undefined]);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.Function, true, []);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.Wait, true, []);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.Function, true, [undefined]);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.Wait, true, [undefined]);
        }).toThrow()
    })

    test("not enough arguments: output", () => {
        expect(() => {
            new Effect(EffectName.Output, true, ["test"])
        }).toThrow();

        expect(() => {
            new Effect(EffectName.Output, true, ["test", undefined])
        }).toThrow();

        expect(() => {
            new Effect(EffectName.Output, true, [undefined, "test"])
        }).toThrow();
    })

    test("not enough arguments: variable effect", () => {
        expect(() => {
            new Effect(EffectName.VarChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.VarChange, true, ["test", "test2"]);
        }).toThrow()

        expect(() => {
            new Effect(EffectName.VarChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.VarChange, true, [undefined, "test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.VarChange, true, ["test", undefined, "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute effect", () => {
        expect(() => {
            new Effect(EffectName.AttrChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.AttrChange, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.AttrChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.AttrChange, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(EffectName.AttrChange, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("test number", () => {
        expect(Effect.testNumber("string")).toBeFalsy();
        expect(Effect.testNumber("")).toBeFalsy();
        expect(Effect.testNumber(null)).toBeFalsy();
        expect(Effect.testNumber(undefined)).toBeFalsy();
        expect(Effect.testNumber(1)).toBeTruthy();
        expect(Effect.testNumber("1")).toBeTruthy();
    })

    test("effects", () => {
        expect(() => {
            new Effect(EffectName.Output, true, ["test", "hallo"]);
            new Effect(EffectName.VarChange, true, ["test", "var", "+"]);
            new Effect(EffectName.AttrChange, true, ["test", "attr", "-"]);
            new Effect(EffectName.BackgroundChange, true, ["test"]);
            new Effect(EffectName.Function, true, ["test"]);
            new Effect(EffectName.Wait, true, ["2"]);
        }).not.toThrow();
    })

});
