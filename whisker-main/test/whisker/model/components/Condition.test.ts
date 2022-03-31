import {Condition} from "../../../../src/whisker/model/components/Condition";
import {CheckName} from "../../../../src/whisker/model/components/Check";
import {expect} from "@jest/globals";

describe('Condition', () => {
    test("no arguments", () => {
        for (const checkNameKey in CheckName) {
            expect(() => {
                new Condition("id", "edgeID", CheckName[checkNameKey], true, []);

            }).toThrow();
        }
    });

    test("constructor, getters", () => {
        expect(() => {
            new Condition(undefined, undefined, CheckName.BackgroundChange, true, ["test"]);
        }).toThrow();
        expect(() => {
            new Condition("test", undefined, CheckName.BackgroundChange, true, ["test"]);
        }).not.toThrow();
        let c = new Condition("test", undefined, CheckName.BackgroundChange, true, ["test"]);
        expect(c.id == "test");
        expect(c.negated == true);
        expect(c.name == CheckName.BackgroundChange);
        expect(c.args[0] == "test");

        expect(() => {
            c.simplifyForSave();
        }).not.toThrow();

        expect(() => {
            c.condition;
        }).not.toThrow();
    });

    test("not enough arguments: sprite color", () => {
        expect(() => {
            new Condition("id", "edgeID", CheckName.SpriteColor, true, ["test"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.SpriteColor, true, ["test", "0"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.SpriteColor, true, ["test", "0", "1"]);
        }).toThrow();

        expect(() => {
            new Condition("id", "edgeID", CheckName.SpriteColor, true, [undefined, undefined, "test", "0", "1"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.SpriteColor, true, ["test", undefined, undefined, "0", "1"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.SpriteColor, true, ["test", "0", undefined, undefined, "1"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.SpriteColor, true, ["test", "0", "2", undefined]);
        }).toThrow();
    });

    test("not enough arguments: sprite touching", () => {
        expect(() => {
            new Condition("id", "edgeID", CheckName.SpriteTouching, true, ["test"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.SpriteTouching, true, ["test", undefined]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.SpriteTouching, true, [undefined, undefined, "test"]);
        }).toThrow();
    });

    test("not enough argument: nbrofclones", () => {
        expect(() => {
            new Condition("id", "edgeID", CheckName.NbrOfClones, true, ["spritename"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.NbrOfClones, true, ["spritename", "="]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.NbrOfVisibleClones, true, ["spritename"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.NbrOfVisibleClones, true, ["spritename", "="]);
        }).toThrow();
    });

    test("not enough arguments: output", () => {
        expect(() => {
            new Condition("id", "edgeID", CheckName.Output, true, ["test"]);
        }).toThrow();

        expect(() => {
            new Condition("id", "edgeID", CheckName.Output, true, ["test", undefined]);
        }).toThrow();

        expect(() => {
            new Condition("id", "edgeID", CheckName.Output, true, [undefined, "test"]);
        }).toThrow();
    });

    test("not enough arguments: variable comparison", () => {
        expect(() => {
            new Condition("id", "edgeID", CheckName.VarComp, true, ["test"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.VarComp, true, ["test", "test2"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.VarComp, true, ["test", "test2", ">"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.VarComp, true, ["test", "test2", ">", undefined]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.VarComp, true, ["test", "test2", undefined]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.VarComp, true, ["test", undefined, undefined, "test2"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.VarComp, true, [undefined, undefined, "test", "test2"]);
        }).toThrow();
    });

    test("not enough arguments: attribute comparison", () => {
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrComp, true, ["test"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrComp, true, ["test", "test2"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrComp, true, ["test", "test2", ">"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrComp, true, ["test", "test2", ">", undefined]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrComp, true, ["test", "test2", undefined]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrComp, true, ["test", undefined, undefined, "test2"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrComp, true, [undefined, undefined, "test", "test2"]);
        }).toThrow();
    });

    test("not enough arguments: variable change", () => {
        expect(() => {
            new Condition("id", "edgeID", CheckName.VarChange, true, ["test"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.VarChange, true, ["test", "test2"]);
        }).toThrow();

        expect(() => {
            new Condition("id", "edgeID", CheckName.VarChange, true, ["test", "test2", undefined]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.VarChange, true, [undefined, undefined, "test", "test2"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.VarChange, true, ["test", undefined, undefined, "test2"]);
        }).toThrow();
    });

    test("not enough arguments: attribute change", () => {
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrChange, true, ["test"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrChange, true, ["test", "test2"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrChange, true, ["test", "test2", undefined]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrChange, true, ["test", undefined, undefined, "test2"]);
        }).toThrow();
        expect(() => {
            new Condition("id", "edgeID", CheckName.AttrChange, true, [undefined, undefined, "test", "test2"]);
        }).toThrow();
    });

    test("conditions", () => {
        expect(() => {
            let condition = new Condition("id", "edgeID", CheckName.AttrChange, false, ["test", "attr", "-"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.BackgroundChange, true, ["test"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.Click, true, ["test"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.Function, true, ["()=>{return null;}"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.Key, true, ["test"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.Output, true, ["test", "hallo"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.SpriteColor, true, ["test", "0", "1", "2"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.SpriteTouching, true, ["test", "test2"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.VarChange, true, ["test", "var", "+"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.Expr, true, ["test"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.Probability, true, ["0"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.TimeElapsed, true, ["1000"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.TimeBetween, true, ["1000"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.TimeAfterEnd, true, ["1000"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.NbrOfClones, true, ["sprite", "=", "1"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"]);
            condition.toString();
            condition = new Condition("id", "edgeID", CheckName.TouchingEdge, true, ["sprite"]);
            condition.toString();
        }).not.toThrow();

        expect(() => {
            let condition = new Condition("id", "edgeID", CheckName.AttrChange, false, ["test", "attr", "-"]);
            condition.check(1, 1);
        }).toThrow();
    });
});
