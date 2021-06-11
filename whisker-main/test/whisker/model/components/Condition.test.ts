import {Condition, setUpCondition} from "../../../../src/whisker/model/components/Condition";
import {CheckName} from "../../../../src/whisker/model/components/Check";
import {ProgramModelEdge} from "../../../../src/whisker/model/components/ModelEdge";
import {expect} from "@jest/globals";

describe('Condition', () => {
    test("no arguments", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.Key, true, undefined, undefined, []);
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.Key, true, undefined, undefined, [undefined])
        }).toThrow();

        expect(() => {
            new Condition(dummyEdge, CheckName.Click, true, undefined, undefined, []);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.Click, true, undefined, undefined, [undefined]);
        }).toThrow()

        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, undefined, undefined, []);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteTouching, true, undefined, undefined, []);
        }).toThrow()

        expect(() => {
            new Condition(dummyEdge, CheckName.Function, true, undefined, undefined, []);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.Function, true, undefined, undefined, [undefined]);
        }).toThrow()

        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, undefined, undefined, []);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, undefined, undefined, []);
        }).toThrow()

        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, undefined, undefined, []);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, undefined, undefined, []);
        }).toThrow()
    })

    test("not enough arguments: sprite color", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, undefined, undefined, ["test"])
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, undefined, undefined, ["test", "0"])
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, undefined, undefined, ["test", "0", "1"])
        }).toThrow();

        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, undefined, undefined, [undefined, undefined, "test", "0", "1"])
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, undefined, undefined, ["test", undefined, undefined, "0", "1"])
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, undefined, undefined, ["test", "0", undefined, undefined, "1"])
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, undefined, undefined, ["test", "0", "2", undefined])
        }).toThrow();
    })

    test("not enough arguments: sprite touching", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteTouching, true, undefined, undefined, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteTouching, true, undefined, undefined, ["test", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteTouching, true, undefined, undefined, [undefined, undefined, "test"]);
        }).toThrow()
    })

    test("not enough arguments: variable effect", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, undefined, undefined, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, undefined, undefined, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, undefined, undefined, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, undefined, undefined, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, undefined, undefined, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, undefined, undefined, ["test", undefined, undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, undefined, undefined, [undefined, undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute comparison", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, undefined, undefined, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, undefined, undefined, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, undefined, undefined, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, undefined, undefined, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, undefined, undefined, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, undefined, undefined, ["test", undefined, undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, undefined, undefined, [undefined, undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: variable change", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, undefined, undefined, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, undefined, undefined, ["test", "test2"]);
        }).toThrow()

        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, undefined, undefined, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, undefined, undefined, [undefined, undefined, "test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, undefined, undefined, ["test", undefined, undefined, "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute change", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, undefined, undefined, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, undefined, undefined, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, undefined, undefined, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, undefined, undefined, ["test", undefined, undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, undefined, undefined, [undefined, undefined, "test", "test2"]);
        }).toThrow()
    })

    test("conditions", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            let condition = new Condition(dummyEdge, CheckName.Key, true, undefined, undefined, ["test"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.Click, true, undefined, undefined, ["test"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.SpriteColor, true, undefined, undefined, ["test", "0", "1", "2"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.SpriteTouching, true, undefined, undefined, ["test", "test2"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.Function, true, undefined, undefined, ["()=>{return null;}"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.VarComp, true, undefined, undefined, ["sprite", "var", ">", "0"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.AttrComp, true, undefined, undefined, ["sprite", "attr", ">", "0"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.VarChange, true, undefined, undefined, ["test", "var", "+"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.AttrChange, false, undefined, undefined, ["test", "attr", "-"]);
            condition.toString();
        }).not.toThrow();
    })

    test("get condition", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
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

    // todo insert test for expr condition
});
