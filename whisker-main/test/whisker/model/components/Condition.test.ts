import {Condition, setUpCondition} from "../../../../src/whisker/model/components/Condition";
import {CheckName} from "../../../../src/whisker/model/components/Check";
import {ProgramModelEdge} from "../../../../src/whisker/model/components/ModelEdge";
import {expect} from "@jest/globals";

describe('Condition', () => {
    test("no arguments", () => {
        for (const checkNameKey in CheckName) {
            expect(() => {
                new Condition("id", CheckName[checkNameKey], true, undefined, undefined, []);

            }).toThrow()
        }
    })

    test("not enough arguments: sprite color", () => {
        expect(() => {
            new Condition("id", CheckName.SpriteColor, true, undefined, undefined, ["test"])
        }).toThrow();
        expect(() => {
            new Condition("id", CheckName.SpriteColor, true, undefined, undefined, ["test", "0"])
        }).toThrow();
        expect(() => {
            new Condition("id", CheckName.SpriteColor, true, undefined, undefined, ["test", "0", "1"])
        }).toThrow();

        expect(() => {
            new Condition("id", CheckName.SpriteColor, true, undefined, undefined, [undefined, undefined, "test", "0", "1"])
        }).toThrow();
        expect(() => {
            new Condition("id", CheckName.SpriteColor, true, undefined, undefined, ["test", undefined, undefined, "0", "1"])
        }).toThrow();
        expect(() => {
            new Condition("id", CheckName.SpriteColor, true, undefined, undefined, ["test", "0", undefined, undefined, "1"])
        }).toThrow();
        expect(() => {
            new Condition("id", CheckName.SpriteColor, true, undefined, undefined, ["test", "0", "2", undefined])
        }).toThrow();
    })

    test("not enough arguments: sprite touching", () => {
        expect(() => {
            new Condition("id", CheckName.SpriteTouching, true, undefined, undefined, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.SpriteTouching, true, undefined, undefined, ["test", undefined]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.SpriteTouching, true, undefined, undefined, [undefined, undefined, "test"]);
        }).toThrow()
    })

    test("not enough argument: nbrofclones", () => {
        expect(() => {
            new Condition("id", CheckName.NbrOfClones, true, undefined, undefined, ["spritename"])
        }).toThrow();
        expect(() => {
            new Condition("id", CheckName.NbrOfClones, true, undefined, undefined, ["spritename", "="])
        }).toThrow();
        expect(() => {
            new Condition("id", CheckName.NbrOfVisibleClones, true, undefined, undefined, ["spritename"])
        }).toThrow();
        expect(() => {
            new Condition("id", CheckName.NbrOfVisibleClones, true, undefined, undefined, ["spritename", "="])
        }).toThrow();
    })

    test("not enough arguments: output", () => {
        expect(() => {
            new Condition("id", CheckName.Output, true, undefined, undefined, ["test"])
        }).toThrow();

        expect(() => {
            new Condition("id", CheckName.Output, true, undefined, undefined, ["test", undefined])
        }).toThrow();

        expect(() => {
            new Condition("id", CheckName.Output, true, undefined, undefined, [undefined, "test"])
        }).toThrow();
    })

    test("not enough arguments: variable comparison", () => {
        expect(() => {
            new Condition("id", CheckName.VarComp, true, undefined, undefined, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.VarComp, true, undefined, undefined, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.VarComp, true, undefined, undefined, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.VarComp, true, undefined, undefined, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.VarComp, true, undefined, undefined, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.VarComp, true, undefined, undefined, ["test", undefined, undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.VarComp, true, undefined, undefined, [undefined, undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute comparison", () => {
        expect(() => {
            new Condition("id", CheckName.AttrComp, true, undefined, undefined, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.AttrComp, true, undefined, undefined, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.AttrComp, true, undefined, undefined, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.AttrComp, true, undefined, undefined, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.AttrComp, true, undefined, undefined, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.AttrComp, true, undefined, undefined, ["test", undefined, undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.AttrComp, true, undefined, undefined, [undefined, undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: variable change", () => {
        expect(() => {
            new Condition("id", CheckName.VarChange, true, undefined, undefined, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.VarChange, true, undefined, undefined, ["test", "test2"]);
        }).toThrow()

        expect(() => {
            new Condition("id", CheckName.VarChange, true, undefined, undefined, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.VarChange, true, undefined, undefined, [undefined, undefined, "test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.VarChange, true, undefined, undefined, ["test", undefined, undefined, "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute change", () => {
        expect(() => {
            new Condition("id", CheckName.AttrChange, true, undefined, undefined, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.AttrChange, true, undefined, undefined, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.AttrChange, true, undefined, undefined, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.AttrChange, true, undefined, undefined, ["test", undefined, undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition("id", CheckName.AttrChange, true, undefined, undefined, [undefined, undefined, "test", "test2"]);
        }).toThrow()
    })

    test("conditions", () => {
        expect(() => {
            let condition = new Condition("id", CheckName.AttrChange, false, undefined, undefined, ["test", "attr", "-"]);
            condition.toString();
            condition = new Condition("id", CheckName.AttrComp, true, undefined, undefined, ["sprite", "attr", ">", "0"]);
            condition.toString();
            condition = new Condition("id", CheckName.BackgroundChange, true, undefined, undefined, ["test"]);
            condition.toString();
            condition = new Condition("id", CheckName.Click, true, undefined, undefined, ["test"]);
            condition.toString();
            condition = new Condition("id", CheckName.Function, true, undefined, undefined, ["()=>{return null;}"]);
            condition.toString();
            condition = new Condition("id", CheckName.Key, true, undefined, undefined, ["test"]);
            condition.toString();
            condition = new Condition("id", CheckName.Output, true, undefined, undefined, ["test", "hallo"]);
            condition.toString();
            condition = new Condition("id", CheckName.SpriteColor, true, undefined, undefined, ["test", "0", "1", "2"]);
            condition.toString();
            condition = new Condition("id", CheckName.SpriteTouching, true, undefined, undefined, ["test", "test2"]);
            condition.toString();
            condition = new Condition("id", CheckName.VarComp, true, undefined, undefined, ["sprite", "var", ">", "0"]);
            condition.toString();
            condition = new Condition("id", CheckName.VarChange, true, undefined, undefined, ["test", "var", "+"]);
            condition.toString();
            condition = new Condition("id", CheckName.Expr, true, undefined, undefined, ["test"]);
            condition.toString();
            condition = new Condition("id", CheckName.Probability, true, undefined, undefined, ["0"]);
            condition.toString();
            condition = new Condition("id", CheckName.TimeElapsed, true, undefined, undefined, ["1000"]);
            condition.toString();
            condition = new Condition("id", CheckName.TimeBetween, true, undefined, undefined, ["1000"]);
            condition.toString();
            condition = new Condition("id", CheckName.TimeAfterEnd, true, undefined, undefined, ["1000"]);
            condition.toString();
            condition = new Condition("id", CheckName.NbrOfClones, true, undefined, undefined, ["sprite", "=", "1"]);
            condition.toString();
            condition = new Condition("id", CheckName.NbrOfVisibleClones, true, undefined, undefined, ["sprite", "=", "1"]);
            condition.toString();
            condition = new Condition("id", CheckName.TouchingEdge, true, undefined, undefined, ["sprite"]);
            condition.toString();
        }).not.toThrow();

        expect(() => {
            let condition = new Condition("id", CheckName.AttrChange, false, undefined, undefined, ["test", "attr", "-"]);
            condition.check(1, 1, 0);
        }).toThrow();
    })

    test("get condition", () => {
        let dummyEdge = new ProgramModelEdge("1", "0", "1");
        let condString = "AttrChange:Cat:x:+";
        expect(() => {
            setUpCondition(dummyEdge, condString, undefined, undefined);
        }).not.toThrow();
        condString = "Function:()=>{return true;}";
        expect(() => {
            setUpCondition(dummyEdge, condString, undefined, undefined);
        }).not.toThrow();
        condString = "!AttrChange:Cat:x:+";
        expect(() => {
            setUpCondition(dummyEdge, condString, undefined, undefined);
        }).not.toThrow();
        expect(() => {
            setUpCondition(null, condString, undefined, undefined);
        }).toThrow();

        condString = "AttrChange"
        expect(() => {
            setUpCondition(dummyEdge, condString, undefined, undefined);
        }).toThrow();
    })
})
