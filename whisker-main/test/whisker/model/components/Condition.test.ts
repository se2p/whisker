import {Condition} from "../../../../src/whisker/model/components/Condition";
import {CheckName} from "../../../../src/whisker/model/util/Checks";

describe('Condition', () => {
    test("no arguments", () => {
        expect(() => {
            new Condition(CheckName.Key, true, []);
        }).toThrow();
        expect(() => {
            new Condition(CheckName.Key, true, [undefined])
        }).toThrow();

        expect(() => {
            new Condition(CheckName.Click, true, []);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.Click, true, [undefined]);
        }).toThrow()

        expect(() => {
            new Condition(CheckName.SpriteColor, true, []);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.SpriteTouching, true, []);
        }).toThrow()

        expect(() => {
            new Condition(CheckName.Function, true, []);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.Function, true, [undefined]);
        }).toThrow()

        expect(() => {
            new Condition(CheckName.VarComp, true, []);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrComp, true, []);
        }).toThrow()

        expect(() => {
            new Condition(CheckName.VarChange, true, []);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrChange, true, []);
        }).toThrow()
    })

    test("not enough arguments: sprite color", () => {
        expect(() => {
            new Condition(CheckName.SpriteColor, true, ["test"])
        }).toThrow();
        expect(() => {
            new Condition(CheckName.SpriteColor, true, ["test", "0"])
        }).toThrow();
        expect(() => {
            new Condition(CheckName.SpriteColor, true, ["test", "0", "1"])
        }).toThrow();

        expect(() => {
            new Condition(CheckName.SpriteColor, true, [undefined, "test", "0", "1"])
        }).toThrow();
        expect(() => {
            new Condition(CheckName.SpriteColor, true, ["test", undefined, "0", "1"])
        }).toThrow();
        expect(() => {
            new Condition(CheckName.SpriteColor, true, ["test", "0", undefined, "1"])
        }).toThrow();
        expect(() => {
            new Condition(CheckName.SpriteColor, true, ["test", "0", "2", undefined])
        }).toThrow();
    })

    test("not enough arguments: sprite touching", () => {
        expect(() => {
            new Condition(CheckName.SpriteTouching, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.SpriteTouching, true, ["test", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.SpriteTouching, true, [undefined, "test"]);
        }).toThrow()
    })

    test("not enough arguments: variable effect", () => {
        expect(() => {
            new Condition(CheckName.VarComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.VarComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.VarComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.VarComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.VarComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.VarComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.VarComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute comparison", () => {
        expect(() => {
            new Condition(CheckName.AttrComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: variable change", () => {
        expect(() => {
            new Condition(CheckName.VarChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.VarChange, true, ["test", "test2"]);
        }).toThrow()

        expect(() => {
            new Condition(CheckName.VarChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.VarChange, true, [undefined, "test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.VarChange, true, ["test", undefined, "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute change", () => {
        expect(() => {
            new Condition(CheckName.AttrChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrChange, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrChange, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(CheckName.AttrChange, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("conditions", () => {
        expect(() => {
            new Condition(CheckName.Key, true, ["test"]);
            new Condition(CheckName.Click, true, ["test"]);
            new Condition(CheckName.SpriteColor, true, ["test", "0", "1", "2"]);
            new Condition(CheckName.SpriteTouching, true, ["test", "test2"]);
            new Condition(CheckName.Function, true, ["()=>{return null;}"]);
            new Condition(CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
            new Condition(CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]);
            new Condition(CheckName.VarChange, true, ["test", "var", "+"]);
            new Condition(CheckName.AttrChange, true, ["test", "attr", "-"]);
        }).not.toThrow();
    })

});
