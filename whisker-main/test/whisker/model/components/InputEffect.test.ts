import {InputEffect, InputEffectName, SimpleInputEffect} from "../../../../src/whisker/model/components/InputEffect";
import {ArgType} from "../../../../src/whisker/model/components/Check";
import {TestDriverMock} from "../TestDriverMock";
import {ScratchInterface} from "../../../../src/whisker/scratch/ScratchInterface";
import {ScratchPosition} from "../../../../src/whisker/scratch/ScratchPosition";
import {Container} from "../../../../src/whisker/utils/Container";
import {SpriteMock} from "../SpriteMock";
import {WhiskerSearchConfiguration} from "../../../../src/whisker/utils/WhiskerSearchConfiguration";

import('../../../../src/whisker/scratch/ScratchInterface');

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

    describe("input effects", () => {
        jest.mock('../../../../src/whisker/utils/Container');
        const tdMock = new TestDriverMock();
        const t = tdMock.getTestDriver();
        Container.testDriver = t;

        test("Mouse input effect", () => {
            jest.mock('../../../../src/whisker/scratch/ScratchInterface');
            ScratchInterface.setMousePosition = jest.fn();
            const effect = new InputEffect("test", InputEffectName.InputMouseMove, ["12", "34"]);
            effect.registerComponents(t, false);
            effect.inputImmediate(t);
            expect(ScratchInterface.setMousePosition).toHaveBeenCalledWith(new ScratchPosition(12, 34));
        });

        test("Key input effect", () => {
            tdMock.inputImmediate = jest.fn();
            const effect = new InputEffect("test", InputEffectName.InputKey, ["b"]);
            effect.registerComponents(t, false);
            effect.inputImmediate(t);
            expect(tdMock.inputImmediate).toHaveBeenCalledWith([{
                device: "keyboard",
                key: "b",
                isDown: true,
                steps: 1
            }]);
        });

        test("Text input effect", () => {
            tdMock.typeText = jest.fn();
            const effect = new InputEffect("test", InputEffectName.InputText, ["this is some text"]);
            effect.registerComponents(t, false);
            effect.inputImmediate(t);
            expect(tdMock.typeText).toHaveBeenCalledWith("this is some text");
        });

        test("Mouse down input effect", () => {
            jest.mock('../../../../src/whisker/utils/Container');
            tdMock.mouseDown = jest.fn();
            const effect = new InputEffect("test", InputEffectName.InputMouseDown, ["false"]);
            effect.registerComponents(t, false);
            effect.inputImmediate(t);
            expect(tdMock.mouseDown).toHaveBeenCalledWith(false);
        });

        test("Click stage input effect", () => {
            tdMock.clickStage = jest.fn();
            const effect = new InputEffect("test", InputEffectName.InputClickStage, []);
            effect.registerComponents(t, false);
            effect.inputImmediate(t);
            expect(tdMock.clickStage).toHaveBeenCalledWith();
        });

        test("Click stage input effect", () => {
            Container.config = {getClickDuration: () => 42} as unknown as WhiskerSearchConfiguration;
            tdMock.currentSprites = SpriteMock.stringsToSpriteArray(["apple", "bowl"]);
            tdMock.clickSprite = jest.fn();
            const effect = new InputEffect("test", InputEffectName.InputClickSprite, ["bowl"]);
            effect.registerComponents(t, false);
            effect.inputImmediate(t);
            expect(tdMock.clickSprite).toHaveBeenCalledWith("bowl", 42);
        });
    });
});
