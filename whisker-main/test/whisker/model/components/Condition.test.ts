import {Condition, ConditionName} from "../../../../src/whisker/model/components/Condition";

describe('Condition', () => {
    test("no arguments", () => {
        expect(() => {
            new Condition(ConditionName.Key, true, [])
        }).toThrow();
        expect(() => {
            new Condition(ConditionName.Key, true, [undefined])
        }).toThrow();

        expect(() => {
            new Condition(ConditionName.Click, true, []);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.Click, true, [undefined]);
        }).toThrow()

        expect(() => {
            new Condition(ConditionName.SpriteColor, true, []);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.SpriteTouching, true, []);
        }).toThrow()

        expect(() => {
            new Condition(ConditionName.Function, true, []);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.Function, true, [undefined]);
        }).toThrow()

        expect(() => {
            new Condition(ConditionName.VarComp, true, []);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.AttrComp, true, []);
        }).toThrow()

        expect(() => {
            new Condition(ConditionName.Nothing, true, []);
        }).not.toThrow()
    })

    test("not enough arguments: sprite color", () => {
        expect(() => {
            new Condition(ConditionName.SpriteColor, true, ["test"])
        }).toThrow();
        expect(() => {
            new Condition(ConditionName.SpriteColor, true, ["test", "0"])
        }).toThrow();
        expect(() => {
            new Condition(ConditionName.SpriteColor, true, ["test", "0", "1"])
        }).toThrow();

        expect(() => {
            new Condition(ConditionName.SpriteColor, true, [undefined, "test", "0", "1"])
        }).toThrow();
        expect(() => {
            new Condition(ConditionName.SpriteColor, true, ["test", undefined, "0", "1"])
        }).toThrow();
        expect(() => {
            new Condition(ConditionName.SpriteColor, true, ["test", "0", undefined, "1"])
        }).toThrow();
        expect(() => {
            new Condition(ConditionName.SpriteColor, true, ["test", "0", "2", undefined])
        }).toThrow();
    })

    test("not enough arguments: sprite touching", () => {
        expect(() => {
            new Condition(ConditionName.SpriteTouching, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.SpriteTouching, true, ["test", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.SpriteTouching, true, [undefined, "test"]);
        }).toThrow()
    })

    test("not enough arguments: variable effect", () => {
        expect(() => {
            new Condition(ConditionName.VarComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.VarComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.VarComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.VarComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.VarComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.VarComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.VarComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute effect", () => {
        expect(() => {
            new Condition(ConditionName.AttrComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.AttrComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.AttrComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.AttrComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.AttrComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.AttrComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(ConditionName.AttrComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("conditions", () => {
        expect(() => {
            new Condition(ConditionName.Key, true, ["test"]);
            new Condition(ConditionName.Click, true, ["test"]);
            new Condition(ConditionName.SpriteColor, true, ["test", "0", "1", "2"]);
            new Condition(ConditionName.SpriteTouching, true, ["test", "test2"]);
            new Condition(ConditionName.Function, true, ["()=>{return null;}"]);
            new Condition(ConditionName.VarComp, true, ["sprite", "var", ">", "0"]);
            new Condition(ConditionName.AttrComp, true, ["sprite", "attr", ">", "0"]);
            new Condition(ConditionName.Nothing, true, []);
        }).not.toThrow();
    })

});
