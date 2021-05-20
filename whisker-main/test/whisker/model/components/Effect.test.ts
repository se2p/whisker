import {Effect, setUpEffect} from "../../../../src/whisker/model/components/Effect";
import {CheckName} from "../../../../src/whisker/model/components/Check";
import {ModelEdge} from "../../../../src/whisker/model/components/ModelEdge";

describe('Effect', () => {
    test("no arguments", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        expect(() => {
            new Effect(dummyEdge, CheckName.Output, true, [])
        }).toThrow();
        expect(() => {
            new Effect(dummyEdge, CheckName.VarChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.BackgroundChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.BackgroundChange, true, [undefined]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.Function, true, []);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.Function, true, [undefined]);
        }).toThrow()

        expect(() => {
            new Effect(dummyEdge, CheckName.VarComp, true, []);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrComp, true, []);
        }).toThrow()
    })

    test("not enough arguments: output", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        expect(() => {
            new Effect(dummyEdge, CheckName.Output, true, ["test"])
        }).toThrow();

        expect(() => {
            new Effect(dummyEdge, CheckName.Output, true, ["test", undefined])
        }).toThrow();

        expect(() => {
            new Effect(dummyEdge, CheckName.Output, true, [undefined, "test"])
        }).toThrow();
    })

    test("not enough arguments: variable change", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        expect(() => {
            new Effect(dummyEdge, CheckName.VarChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.VarChange, true, ["test", "test2"]);
        }).toThrow()

        expect(() => {
            new Effect(dummyEdge, CheckName.VarChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.VarChange, true, [undefined, "test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.VarChange, true, ["test", undefined, "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute change", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrChange, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrChange, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrChange, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: variable comparison", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        expect(() => {
            new Effect(dummyEdge, CheckName.VarComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.VarComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.VarComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.VarComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.VarComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.VarComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.VarComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute comparison", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(dummyEdge, CheckName.AttrComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("effects", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        expect(() => {
            let effect = new Effect(dummyEdge, CheckName.Output, true, ["test", "hallo"]);
            effect.toString();
            effect = new Effect(dummyEdge, CheckName.VarChange, true, ["test", "var", "+"]);
            effect.toString();
            effect = new Effect(dummyEdge, CheckName.AttrChange, true, ["test", "attr", "-"]);
            effect.toString();
            effect = new Effect(dummyEdge, CheckName.BackgroundChange, true, ["test"]);
            effect.toString();
            effect = new Effect(dummyEdge, CheckName.Function, true, ["test"]);
            effect.toString();
            effect = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
            effect.toString();
            effect = new Effect(dummyEdge, CheckName.AttrComp, false, ["sprite", "attr", ">", "0"]);
            effect.toString();
        }).not.toThrow();

        expect(() => {
            let effect = new Effect(dummyEdge, CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]);
            effect.contradicts(null);
        }).toThrow();

        expect(() => {
            let effect = new Effect(dummyEdge, CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]);
            effect.check();
        }).toThrow();
    })

    test("contradictions I", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        let effects = [];
        effects.push(new Effect(dummyEdge, CheckName.Output, true, ["sprite", "hi"]));
        effects.push(new Effect(dummyEdge, CheckName.VarChange, true, ["test", "var", "+"]));
        effects.push(new Effect(dummyEdge, CheckName.AttrChange, true, ["test", "attr", "-"]));
        effects.push(new Effect(dummyEdge, CheckName.BackgroundChange, true, ["test"]));
        effects.push(new Effect(dummyEdge, CheckName.Function, true, ["test"]));
        effects.push( new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "0"]));
        effects.push( new Effect(dummyEdge, CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]));
        effects.push(new Effect(dummyEdge, CheckName.Key, true, ["right arrow"]));
        effects.push(new Effect(dummyEdge, CheckName.Click, true, ["sprite"]));
        effects.push(new Effect(dummyEdge, CheckName.SpriteColor, true, ["sprite", 255,0,0]));
        effects.push(new Effect(dummyEdge, CheckName.SpriteTouching, true, ["sprite", "sprite1"]));

        for (let i = 0; i < effects.length; i++) {
            for (let j = i + 1; j < effects.length; j++) {
                expect(() => {
                    if (effects[i].contradicts(effects[j])) {
                        throw new Error("Effects contradict!\n " + effects[i].toString() + "\n" + effects[j].toString())
                    }
                }).not.toThrow();
            }
        }
    })

    test("contradictions output", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        let output = new Effect(dummyEdge, CheckName.Output, true, ["sprite", "hi"]);
        let output2 = new Effect(dummyEdge, CheckName.Output, true, ["sprite1", "hi"]);
        expect(output.contradicts(output2)).toBeFalsy();
        output2 = new Effect(dummyEdge, CheckName.Output, true, ["sprite", "hi"]);
        expect(output.contradicts(output2)).toBeFalsy();
        output2 = new Effect(dummyEdge, CheckName.Output, true, ["sprite", "hi2"]);
        expect(output.contradicts(output2)).toBeTruthy();
    })

    test("contradictions function", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        let functionE = new Effect(dummyEdge, CheckName.Function, true, ["test"]);
        let functionE2 = new Effect(dummyEdge, CheckName.Function, true, ["testblabla"]);
        expect(functionE.contradicts(functionE2)).toBeFalsy();
        functionE2 = new Effect(dummyEdge, CheckName.Function, true, ["test"]);
        expect(functionE.contradicts(functionE2)).toBeFalsy();
    })

    test("contradictions background", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        let background = new Effect(dummyEdge, CheckName.BackgroundChange, true, ["test"]);
        let background2 = new Effect(dummyEdge, CheckName.BackgroundChange, true, ["test"]);
        expect(background.contradicts(background2)).toBeFalsy();
        background2 = new Effect(dummyEdge, CheckName.BackgroundChange, true, ["test2"]);
        expect(background.contradicts(background2)).toBeTruthy();
    })

    test("contradiction: variable change and comparison", () => {
        // not the same sprite
        let dummyEdge = new ModelEdge("1", null, null);
        let varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["test", "var", "+"]);
        let varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // not the same var
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "+"]);
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var2", ">", "0"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // different changes
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // >=
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "0"]);
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // <
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<", "0"]);
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // <=
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "0"]);
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // =
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "0"]);
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
    })

    test("contradiction: attribute comparison and change", () => {
        // not the same sprite
        let dummyEdge = new ModelEdge("1", null, null);
        let attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["test", "var", "+"]);
        let attrComp = new Effect(dummyEdge, CheckName.AttrComp, true, ["sprite", "var", ">", "0"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // not the same var
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        attrComp = new Effect(dummyEdge, CheckName.AttrComp, true, ["sprite", "var2", ">", "0"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // different changes
        attrComp = new Effect(dummyEdge, CheckName.AttrComp, true, ["sprite", "var", ">", "0"]);
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // >=
        attrComp = new Effect(dummyEdge, CheckName.AttrComp, true, ["sprite", "var", ">=", "0"]);
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();


        // <
        attrComp = new Effect(dummyEdge, CheckName.AttrComp, true, ["sprite", "var", "<", "0"]);
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // <=
        attrComp = new Effect(dummyEdge, CheckName.AttrComp, true, ["sprite", "var", "<=", "0"]);
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // =
        attrComp = new Effect(dummyEdge, CheckName.AttrComp, true, ["sprite", "var", "=", "0"]);
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
    })

    test("contradictions: var/attr change", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        let varChange = new Effect(dummyEdge, CheckName.VarChange, true, ['sprite', 'var', '+']);
        let varChange2 = new Effect(dummyEdge, CheckName.VarChange, true, ['sprite', 'var', '+']);
        expect(varChange.contradicts(varChange2)).toBeFalsy();
        varChange2 = new Effect(dummyEdge, CheckName.VarChange, true, ['sprite', 'var', '-']);
        expect(varChange.contradicts(varChange2)).toBeTruthy();
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        varChange2 = new Effect(dummyEdge, CheckName.VarChange, true, ['sprite', 'var', '=']);
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        expect(varChange.contradicts(varChange2)).toBeTruthy();
        varChange2 = new Effect(dummyEdge, CheckName.VarChange, true, ['sprite', 'var', '+=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();
        varChange2 = new Effect(dummyEdge, CheckName.VarChange, true, ['sprite', 'var', '-=']);
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        expect(varChange.contradicts(varChange2)).toBeTruthy();

        varChange2 = new Effect(dummyEdge, CheckName.VarChange, true, ['sprite2', 'var', '=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();
        varChange2 = new Effect(dummyEdge, CheckName.VarChange, true, ['sprite', 'var2', '=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();

        varChange = new Effect(dummyEdge, CheckName.VarChange, true, ['sprite', 'var', '-']);
        varChange2 = new Effect(dummyEdge, CheckName.VarChange, true, ['sprite', 'var', '+=']);
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        expect(varChange.contradicts(varChange2)).toBeTruthy();
        varChange2 = new Effect(dummyEdge, CheckName.VarChange, true, ['sprite', 'var', '-=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();

        let attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ['sprite', 'var', '+']);
        let attrChange2 = new Effect(dummyEdge, CheckName.AttrChange, true, ['sprite', 'var', '+']);
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
        attrChange2 = new Effect(dummyEdge, CheckName.AttrChange, true, ['sprite', 'var', '-']);
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        attrChange2 = new Effect(dummyEdge, CheckName.AttrChange, true, ['sprite', 'var', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();
        attrChange2 = new Effect(dummyEdge, CheckName.AttrChange, true, ['sprite', 'var', '+=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
        attrChange2 = new Effect(dummyEdge, CheckName.AttrChange, true, ['sprite', 'var', '-=']);
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();

        attrChange2 = new Effect(dummyEdge, CheckName.AttrChange, true, ['sprite2', 'var', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
        attrChange2 = new Effect(dummyEdge, CheckName.AttrChange, true, ['sprite', 'var2', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();

        attrChange = new Effect(dummyEdge, CheckName.AttrChange, true, ['sprite', 'var', '-']);
        attrChange2 = new Effect(dummyEdge, CheckName.AttrChange, true, ['sprite', 'var', '+=']);
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();
        attrChange2 = new Effect(dummyEdge, CheckName.AttrChange, true, ['sprite', 'var', '-=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
    })

    test("contradictions: variable comparison", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        let varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        let varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite2", "var", ">=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var2", ">=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<", "0"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();


        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "0"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<", "0"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<", "2"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "0"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "2"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "2"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "0"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<", "3"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<", "1"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<", "-1"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<", "3"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<", "1"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<", "-1"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "3"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "-1"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "3"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", "<=", "-1"]);
        varComp2 = new Effect(dummyEdge, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
    })

    test("get effect", () => {
        let dummyEdge = new ModelEdge("1", null, null);
        let effectString = "AttrChange:Cat:x:+";
        expect(() => {
            setUpEffect(dummyEdge, effectString);
        }).not.toThrow();
        effectString = "Function:()=>{return true;}";
        expect(() => {
            setUpEffect(dummyEdge, effectString);
        }).not.toThrow();
        effectString = "!AttrChange:Cat:x:+";
        expect(() => {
            setUpEffect(dummyEdge, effectString);
        }).not.toThrow();
        expect(() => {
            setUpEffect(null, effectString);
        }).toThrow();

        effectString = "AttrChange"
        expect(() => {
            setUpEffect(dummyEdge, effectString);
        }).toThrow();
    })
});
