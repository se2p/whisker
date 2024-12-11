import {UserInput, UserInputName} from "../../../../src/whisker/model/components/UserInput";
import {TestDriverMock} from "../TestDriverMock";
import {ScratchInterface} from "../../../../src/whisker/scratch/ScratchInterface";
import {ScratchPosition} from "../../../../src/whisker/scratch/ScratchPosition";
import {Container} from "../../../../src/whisker/utils/Container";
import {SpriteMock} from "../SpriteMock";
import {WhiskerSearchConfiguration} from "../../../../src/whisker/utils/WhiskerSearchConfiguration";
import {ArgType, UserInputJSON} from "../../../../src/whisker/model/util/schema";

import('../../../../src/whisker/scratch/ScratchInterface');

describe('InputEffect', () => {

    describe("not enough arguments", () => {
        const constructorArguments: [UserInputName, ArgType[]][] = [
            ["InputKey", []],
            ["InputClickSprite", []],
            ["InputText", []],
            ["InputMouseDown", []],
            ["InputMouseMove", []],
            ["InputMouseMove", [0]],
        ];
        it.each(constructorArguments)('constructor throws for (%s, %s)', (name: UserInputName, args: ArgType[]) => {
            expect(() => {
                new UserInput(name, args);
            }).toThrow();
        });
    });

    test("Throws when some argument is undefined", () => {
        expect(() => {
            new UserInput("InputMouseMove", ["12", undefined]);
        }).toThrow();
    });

    test("constructor does not need args for InputEffectName.InputClickStage", () => {
        expect(() => {
            new UserInput("InputClickStage", []);
        }).not.toThrow();
    });

    test("toJSON()", () => {
        const effect = new UserInput("InputKey", ["left"]);
        const actual = effect.toJSON();
        const expected: UserInputJSON = {
            name: "InputKey",
            args: ["left"],
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
            const effect = new UserInput("InputMouseMove", ["12", "34"]);
            effect.registerComponents(t);
            effect.inputImmediate(t);
            expect(ScratchInterface.setMousePosition).toHaveBeenCalledWith(new ScratchPosition(12, 34));
        });

        test("Key input effect", () => {
            tdMock.inputImmediate = jest.fn();
            const effect = new UserInput("InputKey", ["b"]);
            effect.registerComponents(t);
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
            const effect = new UserInput("InputText", ["this is some text"]);
            effect.registerComponents(t);
            effect.inputImmediate(t);
            expect(tdMock.typeText).toHaveBeenCalledWith("this is some text");
        });

        test("Mouse down input effect", () => {
            jest.mock('../../../../src/whisker/utils/Container');
            tdMock.mouseDown = jest.fn();
            const effect = new UserInput("InputMouseDown", ["false"]);
            effect.registerComponents(t);
            effect.inputImmediate(t);
            expect(tdMock.mouseDown).toHaveBeenCalledWith(false);
        });

        test("Click stage input effect", () => {
            tdMock.clickStage = jest.fn();
            const effect = new UserInput("InputClickStage", []);
            effect.registerComponents(t);
            effect.inputImmediate(t);
            expect(tdMock.clickStage).toHaveBeenCalledWith();
        });

        test("Click stage input effect", () => {
            Container.config = {getClickDuration: () => 42} as unknown as WhiskerSearchConfiguration;
            tdMock.currentSprites = SpriteMock.stringsToSpriteArray(["apple", "bowl"]);
            tdMock.clickSprite = jest.fn();
            const effect = new UserInput("InputClickSprite", ["bowl"]);
            effect.registerComponents(t);
            effect.inputImmediate(t);
            expect(tdMock.clickSprite).toHaveBeenCalledWith("bowl", 42);
        });
    });
});
