import {InputEffect, InputEffectName, SimpleInputEffect} from "../../../../src/whisker/model/components/InputEffect";
import {ArgType} from "../../../../src/whisker/model/components/Check";

describe('InputEffect', () => {

    test("constructor throws for undefined id", () => {
        expect(() => {
            new InputEffect(undefined, InputEffectName.InputKey, ["left"]);
        }).toThrow();
    });

    describe("not enough arguments", () => {
        const constructorArguments: [InputEffectName, ArgType[]][] = [
            [InputEffectName.InputKey, []],
            [InputEffectName.InputClickSprite, []],
            [InputEffectName.InputText, []],
            [InputEffectName.InputMouseDown, []],
            [InputEffectName.InputMouseMove, []],
            [InputEffectName.InputMouseMove, [0]],
        ];
        it.each(constructorArguments)('constructor throws for (%s, %s)', (name: InputEffectName, args: ArgType[]) => {
            expect(() => {
                new InputEffect("test", name, args);
            }).toThrow();
        });
    });

    test("constructor does not need args for InputEffectName.InputClickStage", () => {
        expect(() => {
            new InputEffect("test", InputEffectName.InputClickStage, []);
        }).not.toThrow();
    });

    test("SimplifyForSave()", () => {
        const effect = new InputEffect("test", InputEffectName.InputKey, ["left"]);
        const actual = effect.simplifyForSave();
        const expected: SimpleInputEffect = {
            id: "test",
            name: InputEffectName.InputKey,
            args: ["left"]
        };
        expect(actual).toStrictEqual(expected);
    });

});
