import {Condition, setUpCondition} from "../../../../src/whisker/model/components/Condition";
import {CheckName} from "../../../../src/whisker/model/components/Check";
import {ProgramModelEdge} from "../../../../src/whisker/model/components/ModelEdge";
import {expect} from "@jest/globals";

describe('Condition', () => {
    test("no arguments", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.Key, true, []);
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.Key, true, [undefined])
        }).toThrow();

        expect(() => {
            new Condition(dummyEdge, CheckName.Click, true, []);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.Click, true, [undefined]);
        }).toThrow()

        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, []);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteTouching, true, []);
        }).toThrow()

        expect(() => {
            new Condition(dummyEdge, CheckName.Function, true, []);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.Function, true, [undefined]);
        }).toThrow()

        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, []);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, []);
        }).toThrow()

        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, []);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, []);
        }).toThrow()
    })

    test("not enough arguments: sprite color", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, ["test"])
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, ["test", "0"])
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, ["test", "0", "1"])
        }).toThrow();

        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, [undefined, "test", "0", "1"])
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, ["test", undefined, "0", "1"])
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, ["test", "0", undefined, "1"])
        }).toThrow();
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteColor, true, ["test", "0", "2", undefined])
        }).toThrow();
    })

    test("not enough arguments: sprite touching", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteTouching, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteTouching, true, ["test", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.SpriteTouching, true, [undefined, "test"]);
        }).toThrow()
    })

    test("not enough arguments: variable effect", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute comparison", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: variable change", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, ["test", "test2"]);
        }).toThrow()

        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, [undefined, "test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.VarChange, true, ["test", undefined, "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute change", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Condition(dummyEdge, CheckName.AttrChange, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("conditions", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        expect(() => {
            let condition = new Condition(dummyEdge, CheckName.Key, true, ["test"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.Click, true, ["test"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.SpriteColor, true, ["test", "0", "1", "2"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.SpriteTouching, true, ["test", "test2"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.Function, true, ["()=>{return null;}"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.VarChange, true, ["test", "var", "+"]);
            condition.toString();
            condition = new Condition(dummyEdge, CheckName.AttrChange, false, ["test", "attr", "-"]);
            condition.toString();
        }).not.toThrow();

        expect(() => {
            let condition = new Condition(dummyEdge, CheckName.Key, true, ["test"]);
            condition.check();
        }).toThrow();
    })

    test("get condition", () => {
        let dummyEdge = new ProgramModelEdge("1", null, null);
        let condString = "AttrChange:Cat:x:+";
        expect(() => {
            setUpCondition(dummyEdge, condString);
        }).not.toThrow();
        condString = "Function:()=>{return true;}";
        expect(() => {
            setUpCondition(dummyEdge, condString);
        }).not.toThrow();
        condString = "!AttrChange:Cat:x:+";
        expect(() => {
            setUpCondition(dummyEdge, condString);
        }).not.toThrow();
        expect(() => {
            setUpCondition(null, condString);
        }).toThrow();

        condString = "AttrChange"
        expect(() => {
            setUpCondition(dummyEdge, condString);
        }).toThrow();
    })

    // todo insert test for expr condition
});
