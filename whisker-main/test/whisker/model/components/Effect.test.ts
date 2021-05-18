import {Effect} from "../../../../src/whisker/model/components/Effect";
import {CheckName} from "../../../../src/whisker/model/util/Checks";

describe('Effect', () => {
    test("no arguments", () => {
        expect(() => {
            new Effect(null, CheckName.Output, true, [])
        }).toThrow();
        expect(() => {
            new Effect(null, CheckName.VarChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.BackgroundChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.BackgroundChange, true, [undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.Function, true, []);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.Function, true, [undefined]);
        }).toThrow()

        expect(() => {
            new Effect(null, CheckName.VarComp, true, []);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrComp, true, []);
        }).toThrow()
    })

    test("not enough arguments: output", () => {
        expect(() => {
            new Effect(null, CheckName.Output, true, ["test"])
        }).toThrow();

        expect(() => {
            new Effect(null, CheckName.Output, true, ["test", undefined])
        }).toThrow();

        expect(() => {
            new Effect(null, CheckName.Output, true, [undefined, "test"])
        }).toThrow();
    })

    test("not enough arguments: variable change", () => {
        expect(() => {
            new Effect(null, CheckName.VarChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.VarChange, true, ["test", "test2"]);
        }).toThrow()

        expect(() => {
            new Effect(null, CheckName.VarChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.VarChange, true, [undefined, "test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.VarChange, true, ["test", undefined, "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute change", () => {
        expect(() => {
            new Effect(null, CheckName.AttrChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrChange, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrChange, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrChange, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: variable comparison", () => {
        expect(() => {
            new Effect(null, CheckName.VarComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.VarComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.VarComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.VarComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.VarComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.VarComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.VarComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute comparison", () => {
        expect(() => {
            new Effect(null, CheckName.AttrComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, CheckName.AttrComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("effects", () => {
        expect(() => {
            new Effect(null, CheckName.Output, true, ["test", "hallo"]);
            new Effect(null, CheckName.VarChange, true, ["test", "var", "+"]);
            new Effect(null, CheckName.AttrChange, true, ["test", "attr", "-"]);
            new Effect(null, CheckName.BackgroundChange, true, ["test"]);
            new Effect(null, CheckName.Function, true, ["test"]);
            new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
            new Effect(null, CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]);
        }).not.toThrow();
    })

    test("contradictions I", () => {
        let effects = [];
        effects.push(new Effect(null, CheckName.Output, true, ["sprite", "hi"]));
        effects.push(new Effect(null, CheckName.VarChange, true, ["test", "var", "+"]));
        effects.push(new Effect(null, CheckName.AttrChange, true, ["test", "attr", "-"]));
        effects.push(new Effect(null, CheckName.BackgroundChange, true, ["test"]));
        effects.push(new Effect(null, CheckName.Function, true, ["test"]));
        effects.push( new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "0"]));
        effects.push( new Effect(null, CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]));
        effects.push(new Effect(null, CheckName.Key, true, ["right arrow"]));
        effects.push(new Effect(null, CheckName.Click, true, ["sprite"]));
        effects.push(new Effect(null, CheckName.SpriteColor, true, ["sprite", 255,0,0]));
        effects.push(new Effect(null, CheckName.SpriteTouching, true, ["sprite", "sprite1"]));

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
        let output = new Effect(null, CheckName.Output, true, ["sprite", "hi"]);
        let output2 = new Effect(null, CheckName.Output, true, ["sprite1", "hi"]);
        expect(output.contradicts(output2)).toBeFalsy();
        output2 = new Effect(null, CheckName.Output, true, ["sprite", "hi"]);
        expect(output.contradicts(output2)).toBeFalsy();
        output2 = new Effect(null, CheckName.Output, true, ["sprite", "hi2"]);
        expect(output.contradicts(output2)).toBeTruthy();
    })

    test("contradictions function", () => {
        let functionE = new Effect(null, CheckName.Function, true, ["test"]);
        let functionE2 = new Effect(null, CheckName.Function, true, ["testblabla"]);
        expect(functionE.contradicts(functionE2)).toBeFalsy();
        functionE2 = new Effect(null, CheckName.Function, true, ["test"]);
        expect(functionE.contradicts(functionE2)).toBeFalsy();
    })

    test("contradictions background", () => {
        let background = new Effect(null, CheckName.BackgroundChange, true, ["test"]);
        let background2 = new Effect(null, CheckName.BackgroundChange, true, ["test"]);
        expect(background.contradicts(background2)).toBeFalsy();
        background2 = new Effect(null, CheckName.BackgroundChange, true, ["test2"]);
        expect(background.contradicts(background2)).toBeTruthy();
    })

    test("contradiction: variable change and comparison", () => {
        // not the same sprite
        let varChange = new Effect(null, CheckName.VarChange, true, ["test", "var", "+"]);
        let varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // not the same var
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "+"]);
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var2", ">", "0"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // different changes
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // >=
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "0"]);
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // <
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<", "0"]);
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // <=
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "0"]);
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // =
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "0"]);
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
    })

    test("contradiction: attribute comparison and change", () => {
        // not the same sprite
        let attrChange = new Effect(null, CheckName.AttrChange, true, ["test", "var", "+"]);
        let attrComp = new Effect(null, CheckName.AttrComp, true, ["sprite", "var", ">", "0"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // not the same var
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        attrComp = new Effect(null, CheckName.AttrComp, true, ["sprite", "var2", ">", "0"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // different changes
        attrComp = new Effect(null, CheckName.AttrComp, true, ["sprite", "var", ">", "0"]);
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // >=
        attrComp = new Effect(null, CheckName.AttrComp, true, ["sprite", "var", ">=", "0"]);
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();


        // <
        attrComp = new Effect(null, CheckName.AttrComp, true, ["sprite", "var", "<", "0"]);
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // <=
        attrComp = new Effect(null, CheckName.AttrComp, true, ["sprite", "var", "<=", "0"]);
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // =
        attrComp = new Effect(null, CheckName.AttrComp, true, ["sprite", "var", "=", "0"]);
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
    })

    test("contradictions: var/attr change", () => {
        let varChange = new Effect(null, CheckName.VarChange, true, ['sprite', 'var', '+']);
        let varChange2 = new Effect(null, CheckName.VarChange, true, ['sprite', 'var', '+']);
        expect(varChange.contradicts(varChange2)).toBeFalsy();
        varChange2 = new Effect(null, CheckName.VarChange, true, ['sprite', 'var', '-']);
        expect(varChange.contradicts(varChange2)).toBeTruthy();
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        varChange2 = new Effect(null, CheckName.VarChange, true, ['sprite', 'var', '=']);
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        expect(varChange.contradicts(varChange2)).toBeTruthy();
        varChange2 = new Effect(null, CheckName.VarChange, true, ['sprite', 'var', '+=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();
        varChange2 = new Effect(null, CheckName.VarChange, true, ['sprite', 'var', '-=']);
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        expect(varChange.contradicts(varChange2)).toBeTruthy();

        varChange2 = new Effect(null, CheckName.VarChange, true, ['sprite2', 'var', '=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();
        varChange2 = new Effect(null, CheckName.VarChange, true, ['sprite', 'var2', '=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();

        varChange = new Effect(null, CheckName.VarChange, true, ['sprite', 'var', '-']);
        varChange2 = new Effect(null, CheckName.VarChange, true, ['sprite', 'var', '+=']);
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        expect(varChange.contradicts(varChange2)).toBeTruthy();
        varChange2 = new Effect(null, CheckName.VarChange, true, ['sprite', 'var', '-=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();

        let attrChange = new Effect(null, CheckName.AttrChange, true, ['sprite', 'var', '+']);
        let attrChange2 = new Effect(null, CheckName.AttrChange, true, ['sprite', 'var', '+']);
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
        attrChange2 = new Effect(null, CheckName.AttrChange, true, ['sprite', 'var', '-']);
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        attrChange2 = new Effect(null, CheckName.AttrChange, true, ['sprite', 'var', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();
        attrChange2 = new Effect(null, CheckName.AttrChange, true, ['sprite', 'var', '+=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
        attrChange2 = new Effect(null, CheckName.AttrChange, true, ['sprite', 'var', '-=']);
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();

        attrChange2 = new Effect(null, CheckName.AttrChange, true, ['sprite2', 'var', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
        attrChange2 = new Effect(null, CheckName.AttrChange, true, ['sprite', 'var2', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();

        attrChange = new Effect(null, CheckName.AttrChange, true, ['sprite', 'var', '-']);
        attrChange2 = new Effect(null, CheckName.AttrChange, true, ['sprite', 'var', '-']);
        attrChange2 = new Effect(null, CheckName.AttrChange, true, ['sprite', 'var', '+=']);
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();
        attrChange2 = new Effect(null, CheckName.AttrChange, true, ['sprite', 'var', '-=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
    })

    test("contradictions: variable comparison", () => {
        let varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        let varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<", "0"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();


        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "0"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<", "0"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<", "2"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "0"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "2"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "2"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "0"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<", "3"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<", "1"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<", "-1"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<", "3"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<", "1"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<", "-1"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "3"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "-1"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "3"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, CheckName.VarComp, true, ["sprite", "var", "<=", "-1"]);
        varComp2 = new Effect(null, CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
    })
});
