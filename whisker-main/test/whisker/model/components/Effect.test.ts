import {Effect, EffectName} from "../../../../src/whisker/model/components/Effect";

describe('Effect', () => {
    test("no arguments", () => {
        expect(() => {
            new Effect(null, EffectName.Output, true, [])
        }).toThrow();
        expect(() => {
            new Effect(null, EffectName.VarChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.BackgroundChange, true, []);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.BackgroundChange, true, [undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.Function, true, []);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.Function, true, [undefined]);
        }).toThrow()

        expect(() => {
            new Effect(null, EffectName.VarComp, true, []);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrComp, true, []);
        }).toThrow()
    })

    test("not enough arguments: output", () => {
        expect(() => {
            new Effect(null, EffectName.Output, true, ["test"])
        }).toThrow();

        expect(() => {
            new Effect(null, EffectName.Output, true, ["test", undefined])
        }).toThrow();

        expect(() => {
            new Effect(null, EffectName.Output, true, [undefined, "test"])
        }).toThrow();
    })

    test("not enough arguments: variable change", () => {
        expect(() => {
            new Effect(null, EffectName.VarChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.VarChange, true, ["test", "test2"]);
        }).toThrow()

        expect(() => {
            new Effect(null, EffectName.VarChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.VarChange, true, [undefined, "test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.VarChange, true, ["test", undefined, "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute change", () => {
        expect(() => {
            new Effect(null, EffectName.AttrChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrChange, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrChange, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrChange, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: variable comparison", () => {
        expect(() => {
            new Effect(null, EffectName.VarComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.VarComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.VarComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.VarComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.VarComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.VarComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.VarComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute comparison", () => {
        expect(() => {
            new Effect(null, EffectName.AttrComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect(null, EffectName.AttrComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("effects", () => {
        expect(() => {
            new Effect(null, EffectName.Output, true, ["test", "hallo"]);
            new Effect(null, EffectName.VarChange, true, ["test", "var", "+"]);
            new Effect(null, EffectName.AttrChange, true, ["test", "attr", "-"]);
            new Effect(null, EffectName.BackgroundChange, true, ["test"]);
            new Effect(null, EffectName.Function, true, ["test"]);
            new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "0"]);
            new Effect(null, EffectName.AttrComp, true, ["sprite", "attr", ">", "0"]);
        }).not.toThrow();
    })

    test("contradictions I", () => {
        let effects = [];
        let output = new Effect(null, EffectName.Output, true, ["sprite", "hi"]);
        let varChange = new Effect(null, EffectName.VarChange, true, ["test", "var", "+"]);
        let attrChange = new Effect(null, EffectName.AttrChange, true, ["test", "attr", "-"]);
        let background = new Effect(null, EffectName.BackgroundChange, true, ["test"]);
        let functionE = new Effect(null, EffectName.Function, true, ["test"]);
        let varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "0"]);
        let attrComp = new Effect(null, EffectName.AttrComp, true, ["sprite", "attr", ">", "0"]);
        effects.push(output);
        effects.push(varChange);
        effects.push(attrChange);
        effects.push(background);
        effects.push(functionE);
        effects.push(varComp);
        effects.push(attrComp);

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
        let output = new Effect(null, EffectName.Output, true, ["sprite", "hi"]);
        let output2 = new Effect(null, EffectName.Output, true, ["sprite1", "hi"]);
        expect(output.contradicts(output2)).toBeFalsy();
        output2 = new Effect(null, EffectName.Output, true, ["sprite", "hi"]);
        expect(output.contradicts(output2)).toBeFalsy();
        output2 = new Effect(null, EffectName.Output, true, ["sprite", "hi2"]);
        expect(output.contradicts(output2)).toBeTruthy();
    })

    test("contradictions function", () => {
        let functionE = new Effect(null, EffectName.Function, true, ["test"]);
        let functionE2 = new Effect(null, EffectName.Function, true, ["testblabla"]);
        expect(functionE.contradicts(functionE2)).toBeFalsy();
        functionE2 = new Effect(null, EffectName.Function, true, ["test"]);
        expect(functionE.contradicts(functionE2)).toBeFalsy();
    })

    test("contradictions background", () => {
        let background = new Effect(null, EffectName.BackgroundChange, true, ["test"]);
        let background2 = new Effect(null, EffectName.BackgroundChange, true, ["test"]);
        expect(background.contradicts(background2)).toBeFalsy();
        background2 = new Effect(null, EffectName.BackgroundChange, true, ["test2"]);
        expect(background.contradicts(background2)).toBeTruthy();
    })

    test("contradiction: variable change and comparison", () => {
        // not the same sprite
        let varChange = new Effect(null, EffectName.VarChange, true, ["test", "var", "+"]);
        let varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "0"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // not the same var
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "+"]);
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var2", ">", "0"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // different changes
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "0"]);
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // >=
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "0"]);
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();


        // <
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<", "0"]);
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // <=
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "0"]);
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // =
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "0"]);
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect(null, EffectName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

    })

    test("contradiction: attribute comparison and change", () => {
        // not the same sprite
        let attrChange = new Effect(null, EffectName.AttrChange, true, ["test", "var", "+"]);
        let attrComp = new Effect(null, EffectName.AttrComp, true, ["sprite", "var", ">", "0"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // not the same var
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "+"]);
        attrComp = new Effect(null, EffectName.AttrComp, true, ["sprite", "var2", ">", "0"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // different changes
        attrComp = new Effect(null, EffectName.AttrComp, true, ["sprite", "var", ">", "0"]);
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // >=
        attrComp = new Effect(null, EffectName.AttrComp, true, ["sprite", "var", ">=", "0"]);
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();


        // <
        attrComp = new Effect(null, EffectName.AttrComp, true, ["sprite", "var", "<", "0"]);
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // <=
        attrComp = new Effect(null, EffectName.AttrComp, true, ["sprite", "var", "<=", "0"]);
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // =
        attrComp = new Effect(null, EffectName.AttrComp, true, ["sprite", "var", "=", "0"]);
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect(null, EffectName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
    })

    test("contradictions: var/attr change", () => {
        let varChange = new Effect(null, EffectName.VarChange, true, ['sprite', 'var', '+']);
        let varChange2 = new Effect(null, EffectName.VarChange, true, ['sprite', 'var', '+']);
        expect(varChange.contradicts(varChange2)).toBeFalsy();
        varChange2 = new Effect(null, EffectName.VarChange, true, ['sprite', 'var', '-']);
        expect(varChange.contradicts(varChange2)).toBeTruthy();
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        varChange2 = new Effect(null, EffectName.VarChange, true, ['sprite', 'var', '=']);
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        expect(varChange.contradicts(varChange2)).toBeTruthy();

        varChange2 = new Effect(null, EffectName.VarChange, true, ['sprite2', 'var', '=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();
        varChange2 = new Effect(null, EffectName.VarChange, true, ['sprite', 'var2', '=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();

        let attrChange = new Effect(null, EffectName.AttrChange, true, ['sprite', 'var', '+']);
        let attrChange2 = new Effect(null, EffectName.AttrChange, true, ['sprite', 'var', '+']);
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
        attrChange2 = new Effect(null, EffectName.AttrChange, true, ['sprite', 'var', '-']);
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        attrChange2 = new Effect(null, EffectName.AttrChange, true, ['sprite', 'var', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();

        attrChange2 = new Effect(null, EffectName.AttrChange, true, ['sprite2', 'var', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
        attrChange2 = new Effect(null, EffectName.AttrChange, true, ['sprite', 'var2', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
    })

    test("contradictions: variable comparison", () => {
        let varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "0"]);
        let varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<", "0"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();


        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "0"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<", "0"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<", "2"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "0"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "2"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "1"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "0"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "2"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "0"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "1"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<", "3"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<", "1"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<", "-1"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<", "3"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<", "1"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<", "-1"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "3"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "-1"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "3"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect(null, EffectName.VarComp, true, ["sprite", "var", "<=", "-1"]);
        varComp2 = new Effect(null, EffectName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
    })
});
