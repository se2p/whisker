import {Effect} from "../../../../src/whisker/model/components/Effect";
import {CheckName} from "../../../../src/whisker/model/components/Check";

describe('Effect', () => {
    test("no arguments", () => {
        for (const checkNameKey in CheckName) {
            expect(() => {
                new Effect("id", CheckName[checkNameKey], true, []);
            }).toThrow()
        }
    })

    test("not enough arguments: sprite events", () => {
        expect(() => {
            new Effect("id", CheckName.SpriteColor, true, ["spritename"])
        }).toThrow();
        expect(() => {
            new Effect("id", CheckName.SpriteColor, true, ["spritename", "1"])
        }).toThrow();
        expect(() => {
            new Effect("id", CheckName.SpriteColor, true, ["spritename", "1", "2"])
        }).toThrow();

        expect(() => {
            new Effect("id", CheckName.SpriteColor, true, ["spritename", "1", "2", undefined])
        }).toThrow();
        expect(() => {
            new Effect("id", CheckName.SpriteColor, true, [undefined, "spritename", "1", "2"])
        }).toThrow();
        expect(() => {
            new Effect("id", CheckName.SpriteColor, true, ["spritename", undefined, "1", "2"])
        }).toThrow();
        expect(() => {
            new Effect("id", CheckName.SpriteColor, true, ["spritename", "1", undefined, "2"])
        }).toThrow();

        expect(() => {
            new Effect("id", CheckName.SpriteTouching, true, ["spritename"])
        }).toThrow();
        expect(() => {
            new Effect("id", CheckName.SpriteTouching, true, ["spritename", undefined])
        }).toThrow();
        expect(() => {
            new Effect("id", CheckName.SpriteTouching, true, [undefined, "spritename"])
        }).toThrow();
    })

    test("not enough argument: nbrofclones", () => {
        expect(() => {
            new Effect("id", CheckName.NbrOfClones, true, ["spritename"])
        }).toThrow();
        expect(() => {
            new Effect("id", CheckName.NbrOfClones, true, ["spritename", "="])
        }).toThrow();
        expect(() => {
            new Effect("id", CheckName.NbrOfVisibleClones, true, ["spritename"])
        }).toThrow();
        expect(() => {
            new Effect("id", CheckName.NbrOfVisibleClones, true, ["spritename", "="])
        }).toThrow();
    })

    test("not enough arguments: output", () => {
        expect(() => {
            new Effect("id", CheckName.Output, true, ["test"])
        }).toThrow();

        expect(() => {
            new Effect("id", CheckName.Output, true, ["test", undefined])
        }).toThrow();

        expect(() => {
            new Effect("id", CheckName.Output, true, [undefined, "test"])
        }).toThrow();
    })

    test("not enough arguments: variable change", () => {
        expect(() => {
            new Effect("id", CheckName.VarChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.VarChange, true, ["test", "test2"]);
        }).toThrow()

        expect(() => {
            new Effect("id", CheckName.VarChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.VarChange, true, [undefined, "test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.VarChange, true, ["test", undefined, "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute change", () => {
        expect(() => {
            new Effect("id", CheckName.AttrChange, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.AttrChange, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.AttrChange, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.AttrChange, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.AttrChange, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: variable comparison", () => {
        expect(() => {
            new Effect("id", CheckName.VarComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.VarComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.VarComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.VarComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.VarComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.VarComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.VarComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("not enough arguments: attribute comparison", () => {
        expect(() => {
            new Effect("id", CheckName.AttrComp, true, ["test"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.AttrComp, true, ["test", "test2"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.AttrComp, true, ["test", "test2", ">"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.AttrComp, true, ["test", "test2", ">", undefined]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.AttrComp, true, ["test", "test2", undefined]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.AttrComp, true, ["test", undefined, "test2"]);
        }).toThrow()
        expect(() => {
            new Effect("id", CheckName.AttrComp, true, [undefined, "test", "test2"]);
        }).toThrow()
    })

    test("effects", () => {
        expect(() => {
            let effect;
            effect = new Effect("id", CheckName.AttrChange, true, ["test", "attr", "-"]);
            effect.toString();
            effect = new Effect("id", CheckName.AttrComp, false, ["sprite", "attr", ">", "0"]);
            effect.toString();
            effect = new Effect("id", CheckName.BackgroundChange, true, ["test"]);
            effect.toString();
            effect = new Effect("id", CheckName.Click, true, ["sprite"]);
            effect.toString();
            effect = new Effect("id", CheckName.Function, true, ["test"]);
            effect.toString();
            effect = new Effect("id", CheckName.Key, true, ["test"]);
            effect.toString();
            effect = new Effect("id", CheckName.Output, true, ["test", "hallo"]);
            effect.toString();
            effect = new Effect("id", CheckName.SpriteColor, true, ["sprite", "0", "0", "0"]);
            effect.toString();
            effect = new Effect("id", CheckName.SpriteTouching, true, ["sprite1", "sprite2"]);
            effect.toString();
            effect = new Effect("id", CheckName.VarChange, true, ["test", "var", "+"]);
            effect.toString();
            effect = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
            effect.toString();
            effect = new Effect("id", CheckName.Expr, true, ["test"]);
            effect.toString();
            effect = new Effect("id", CheckName.Probability, true, ["0"]);
            effect.toString();
            effect = new Effect("id", CheckName.TimeElapsed, true, ["1000"]);
            effect.toString();
            effect = new Effect("id", CheckName.TimeBetween, true, ["1000"]);
            effect.toString();
            effect = new Effect("id", CheckName.TimeAfterEnd, true, ["1000"]);
            effect.toString();
            effect = new Effect("id", CheckName.NbrOfClones, true, ["sprite", "=", "1"]);
            effect.toString();
            effect = new Effect("id", CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"]);
            effect.toString();
            effect = new Effect("id", CheckName.TouchingEdge, true, ["sprite"]);
            effect.toString();
        }).not.toThrow();

        expect(() => {
            let effect = new Effect("id", CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]);
            effect.contradicts(null);
        }).toThrow();

        expect(() => {
            let effect = new Effect("id", CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]);
            effect.check(0, 0);
        }).toThrow();
    })

    test("contradictions I", () => {
        let effects = [];
        effects.push(new Effect("id", CheckName.Output, true, ["sprite", "hi"]));
        effects.push(new Effect("id", CheckName.VarChange, true, ["test", "var", "+"]));
        effects.push(new Effect("id", CheckName.AttrChange, true, ["test", "attr", "-"]));
        effects.push(new Effect("id", CheckName.BackgroundChange, true, ["test"]));
        effects.push(new Effect("id", CheckName.Function, true, ["test"]));
        effects.push(new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "0"]));
        effects.push(new Effect("id", CheckName.AttrComp, true, ["sprite", "attr", ">", "0"]));
        effects.push(new Effect("id", CheckName.Key, true, ["right arrow"]));
        effects.push(new Effect("id", CheckName.Click, true, ["sprite"]));
        effects.push(new Effect("id", CheckName.SpriteColor, true, ["sprite", 255, 0, 0]));
        effects.push(new Effect("id", CheckName.SpriteTouching, true, ["sprite", "sprite1"]));
        effects.push(new Effect("id", CheckName.TouchingEdge, true, ["sprite"]));
        effects.push(new Effect("id", CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"]));
        effects.push(new Effect("id", CheckName.NbrOfClones, true, ["sprite", "=", "1"]));
        effects.push(new Effect("id", CheckName.TimeAfterEnd, true, ["1000"]));
        effects.push(new Effect("id", CheckName.TimeBetween, true, ["1000"]));
        effects.push(new Effect("id", CheckName.TimeElapsed, true, ["1000"]));
        effects.push(new Effect("id", CheckName.Probability, true, ["0"]));
        effects.push(new Effect("id", CheckName.Expr, true, ["test"]));

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
        let output = new Effect("id", CheckName.Output, true, ["sprite", "hi"]);
        let output2 = new Effect("id", CheckName.Output, true, ["sprite1", "hi"]);
        expect(output.contradicts(output2)).toBeFalsy();
        output2 = new Effect("id", CheckName.Output, true, ["sprite", "hi"]);
        expect(output.contradicts(output2)).toBeFalsy();
        output2 = new Effect("id", CheckName.Output, true, ["sprite", "hi2"]);
        expect(output.contradicts(output2)).toBeTruthy();
    })

    test("contradictions function", () => {
        let functionE = new Effect("id", CheckName.Function, true, ["test"]);
        let functionE2 = new Effect("id", CheckName.Function, true, ["testblabla"]);
        expect(functionE.contradicts(functionE2)).toBeFalsy();
        functionE2 = new Effect("id", CheckName.Function, true, ["test"]);
        expect(functionE.contradicts(functionE2)).toBeFalsy();
    })

    test("contradictions background", () => {
        let background = new Effect("id", CheckName.BackgroundChange, true, ["test"]);
        let background2 = new Effect("id", CheckName.BackgroundChange, true, ["test"]);
        expect(background.contradicts(background2)).toBeFalsy();
        background2 = new Effect("id", CheckName.BackgroundChange, true, ["test2"]);
        expect(background.contradicts(background2)).toBeTruthy();
    })

    test("contradiction: variable change and comparison", () => {
        // not the same sprite
        let varChange = new Effect("id", CheckName.VarChange, true, ["test", "var", "+"]);
        let varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // not the same var
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "+"]);
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var2", ">", "0"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // different changes
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // >=
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "0"]);
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // <
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<", "0"]);
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // <=
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "0"]);
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();

        // =
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "0"]);
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "+"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "-"]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "+="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
        varChange = new Effect("id", CheckName.VarChange, true, ["sprite", "var", "-="]);
        expect(varChange.contradicts(varComp)).toBeFalsy();
        expect(varComp.contradicts(varChange)).toBeFalsy();
    })

    test("contradiction: attribute comparison and change", () => {
        // not the same sprite
        let attrChange = new Effect("id", CheckName.AttrChange, true, ["test", "var", "+"]);
        let attrComp = new Effect("id", CheckName.AttrComp, true, ["sprite", "var", ">", "0"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // not the same var
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "+"]);
        attrComp = new Effect("id", CheckName.AttrComp, true, ["sprite", "var2", ">", "0"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // different changes
        attrComp = new Effect("id", CheckName.AttrComp, true, ["sprite", "var", ">", "0"]);
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // >=
        attrComp = new Effect("id", CheckName.AttrComp, true, ["sprite", "var", ">=", "0"]);
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();


        // <
        attrComp = new Effect("id", CheckName.AttrComp, true, ["sprite", "var", "<", "0"]);
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // <=
        attrComp = new Effect("id", CheckName.AttrComp, true, ["sprite", "var", "<=", "0"]);
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();

        // =
        attrComp = new Effect("id", CheckName.AttrComp, true, ["sprite", "var", "=", "0"]);
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "+"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "-"]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "+="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
        attrChange = new Effect("id", CheckName.AttrChange, true, ["sprite", "var", "-="]);
        expect(attrChange.contradicts(attrComp)).toBeFalsy();
        expect(attrComp.contradicts(attrChange)).toBeFalsy();
    })

    test("contradictions: var/attr change", () => {
        let varChange = new Effect("id", CheckName.VarChange, true, ['sprite', 'var', '+']);
        let varChange2 = new Effect("id", CheckName.VarChange, true, ['sprite', 'var', '+']);
        expect(varChange.contradicts(varChange2)).toBeFalsy();
        varChange2 = new Effect("id", CheckName.VarChange, true, ['sprite', 'var', '-']);
        expect(varChange.contradicts(varChange2)).toBeTruthy();
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        varChange2 = new Effect("id", CheckName.VarChange, true, ['sprite', 'var', '=']);
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        expect(varChange.contradicts(varChange2)).toBeTruthy();
        varChange2 = new Effect("id", CheckName.VarChange, true, ['sprite', 'var', '+=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();
        varChange2 = new Effect("id", CheckName.VarChange, true, ['sprite', 'var', '-=']);
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        expect(varChange.contradicts(varChange2)).toBeTruthy();

        varChange2 = new Effect("id", CheckName.VarChange, true, ['sprite2', 'var', '=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();
        varChange2 = new Effect("id", CheckName.VarChange, true, ['sprite', 'var2', '=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();

        varChange = new Effect("id", CheckName.VarChange, true, ['sprite', 'var', '-']);
        varChange2 = new Effect("id", CheckName.VarChange, true, ['sprite', 'var', '+=']);
        expect(varChange2.contradicts(varChange)).toBeTruthy();
        expect(varChange.contradicts(varChange2)).toBeTruthy();
        varChange2 = new Effect("id", CheckName.VarChange, true, ['sprite', 'var', '-=']);
        expect(varChange2.contradicts(varChange)).toBeFalsy();
        expect(varChange.contradicts(varChange2)).toBeFalsy();

        let attrChange = new Effect("id", CheckName.AttrChange, true, ['sprite', 'var', '+']);
        let attrChange2 = new Effect("id", CheckName.AttrChange, true, ['sprite', 'var', '+']);
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
        attrChange2 = new Effect("id", CheckName.AttrChange, true, ['sprite', 'var', '-']);
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        attrChange2 = new Effect("id", CheckName.AttrChange, true, ['sprite', 'var', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();
        attrChange2 = new Effect("id", CheckName.AttrChange, true, ['sprite', 'var', '+=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
        attrChange2 = new Effect("id", CheckName.AttrChange, true, ['sprite', 'var', '-=']);
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();

        attrChange2 = new Effect("id", CheckName.AttrChange, true, ['sprite2', 'var', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
        attrChange2 = new Effect("id", CheckName.AttrChange, true, ['sprite', 'var2', '=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();

        attrChange = new Effect("id", CheckName.AttrChange, true, ['sprite', 'var', '-']);
        attrChange2 = new Effect("id", CheckName.AttrChange, true, ['sprite', 'var', '+=']);
        expect(attrChange2.contradicts(attrChange)).toBeTruthy();
        expect(attrChange.contradicts(attrChange2)).toBeTruthy();
        attrChange2 = new Effect("id", CheckName.AttrChange, true, ['sprite', 'var', '-=']);
        expect(attrChange2.contradicts(attrChange)).toBeFalsy();
        expect(attrChange.contradicts(attrChange2)).toBeFalsy();
    })

    test("contradictions: variable comparison", () => {
        let varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        let varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect("id", CheckName.VarComp, true, ["sprite2", "var", ">=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var2", ">=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<", "0"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();


        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "0"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "0"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<", "0"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<", "2"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "0"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "2"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "0"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "2"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "0"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();

        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<", "3"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<", "1"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<", "-1"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<", "3"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<", "1"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<", "-1"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "3"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "-1"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();

        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "3"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "1"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeFalsy();
        expect(varComp2.contradicts(varComp)).toBeFalsy();
        varComp = new Effect("id", CheckName.VarComp, true, ["sprite", "var", "<=", "-1"]);
        varComp2 = new Effect("id", CheckName.VarComp, true, ["sprite", "var", ">=", "1"]);
        expect(varComp.contradicts(varComp2)).toBeTruthy();
        expect(varComp2.contradicts(varComp)).toBeTruthy();
    })

    test("contradiction: click", () => {
        let effect1 = new Effect("id", CheckName.Click, true, ["sprite1"]);
        let effect2 = new Effect("id", CheckName.Click, true, ["sprite2"]);
        expect(effect1.contradicts(effect2)).toBeTruthy();
        expect(effect2.contradicts(effect1)).toBeTruthy();
        effect2 = new Effect("id", CheckName.Click, true, ["sprite1"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
    })

    test("contradiction: key", () => {
        let effect1 = new Effect("id", CheckName.Key, true, ["left"]);
        let effect2 = new Effect("id", CheckName.Key, true, ["right"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.Key, true, ["left"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
    })

    test("contradiction: sprite color", () => {
        let effect1 = new Effect("id", CheckName.SpriteColor, true, ["sprite1", "0", "0", "0"]);
        let effect2 = new Effect("id", CheckName.SpriteColor, true, ["sprite2", "0", "0", "0"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        // it can touch multiple colors at the same time
        effect2 = new Effect("id", CheckName.SpriteColor, true, ["sprite1", "0", "0", "1"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
    })

    test("contradiction: sprite touching", () => {
        let effect1 = new Effect("id", CheckName.SpriteTouching, true, ["sprite1", "sprite2"]);
        let effect2 = new Effect("id", CheckName.SpriteTouching, true, ["sprite2", "sprite3"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.SpriteTouching, true, ["sprite1", "sprite3"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
    })

    test("contradiction: expr", () => {
        let effect1 = new Effect("id", CheckName.Expr, true, ["whatever"]);
        let effect2 = new Effect("id", CheckName.Expr, true, ["whatever2"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.Click, true, ["whatever"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
    })

    // actually an effect with probability result is quite dumb to have....
    test("contradiction: probability", () => {
        let effect1 = new Effect("id", CheckName.Probability, true, ["1"]);
        let effect2 = new Effect("id", CheckName.Probability, true, ["9"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.Probability, true, ["1"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
    })

    test("contradiction: time", () => {
        let effect1 = new Effect("id", CheckName.TimeElapsed, true, ["1000"]);
        let effect2 = new Effect("id", CheckName.TimeElapsed, true, ["2000"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.TimeElapsed, true, ["1000"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect1 = new Effect("id", CheckName.TimeBetween, true, ["1000"]);
        effect2 = new Effect("id", CheckName.TimeBetween, true, ["2000"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.TimeBetween, true, ["1000"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect1 = new Effect("id", CheckName.TimeAfterEnd, true, ["1000"]);
        effect2 = new Effect("id", CheckName.TimeAfterEnd, true, ["2000"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.TimeAfterEnd, true, ["1000"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
    })

    test("contradiction: clones", () => {
        let effect1 = new Effect("id", CheckName.NbrOfClones, true, ["sprite", "=", "1"]);
        let effect2 = new Effect("id", CheckName.NbrOfClones, true, ["sprite2", "=", "2"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.NbrOfClones, true, ["sprite", "=", "1"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.NbrOfClones, true, ["sprite", "=", "2"]);
        expect(effect1.contradicts(effect2)).toBeTruthy();
        expect(effect2.contradicts(effect1)).toBeTruthy();
        effect1 = new Effect("id", CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"]);
        effect2 = new Effect("id", CheckName.NbrOfVisibleClones, true, ["sprite2", "=", "2"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.NbrOfVisibleClones, true, ["sprite", "=", "1"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.NbrOfVisibleClones, true, ["sprite", "=", "2"]);
        expect(effect1.contradicts(effect2)).toBeTruthy();
        expect(effect2.contradicts(effect1)).toBeTruthy();

        // other comparisons are valid as long as AttrComp and VarComp tests are ok (same comparison)
    })

    test("contradiction: expr", () => {
        let effect1 = new Effect("id", CheckName.TouchingEdge, true, ["sprite"]);
        let effect2 = new Effect("id", CheckName.TouchingEdge, true, ["sprite2"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
        effect2 = new Effect("id", CheckName.TouchingEdge, true, ["sprite"]);
        expect(effect1.contradicts(effect2)).toBeFalsy();
        expect(effect2.contradicts(effect1)).toBeFalsy();
    })
});
