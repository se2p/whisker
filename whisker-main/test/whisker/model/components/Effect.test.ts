import {Effect, EffectName} from "../../../../src/whisker/model/components/Effect";

describe('Effect', () => {

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
            new Effect(EffectName.Function, true, [undefined]);
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

    test("effects", () => {
        expect(() => {
            new Effect(EffectName.Output, true, ["test", "hallo"]);
            new Effect(EffectName.VarChange, true, ["test", "var", "+"]);
            new Effect(EffectName.AttrChange, true, ["test", "attr", "-"]);
            new Effect(EffectName.BackgroundChange, true, ["test"]);
            new Effect(EffectName.Function, true, ["test"]);
        }).not.toThrow();
    })

});
