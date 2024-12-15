import {TestDriverMock} from "../TestDriverMock";
import {ScratchInterface} from "../../../../src/whisker/scratch/ScratchInterface";
import {ScratchPosition} from "../../../../src/whisker/scratch/ScratchPosition";
import {Container} from "../../../../src/whisker/utils/Container";
import {SpriteMock} from "../SpriteMock";
import {WhiskerSearchConfiguration} from "../../../../src/whisker/utils/WhiskerSearchConfiguration";
import {newUserInput, UserInputJSON} from "../../../../src/whisker/model/inputs/newUserInput";
import {MouseMove} from "../../../../src/whisker/model/inputs/MouseMove";
import {ClickStage} from "../../../../src/whisker/model/inputs/ClickStage";
import {ClickSprite} from "../../../../src/whisker/model/inputs/ClickSprite";
import {MouseDown} from "../../../../src/whisker/model/inputs/MouseDown";
import {InputText} from "../../../../src/whisker/model/inputs/InputText";
import {InputKey} from "../../../../src/whisker/model/inputs/InputKey";

import('../../../../src/whisker/scratch/ScratchInterface');

describe('InputEffect', () => {

    describe("not enough arguments", () => {
        const constructorArguments: UserInputJSON[] = [
            {name: "InputKey", args: []},
            {name: "InputClickSprite", args: []},
            {name: "InputText", args: []},
            {name: "InputMouseDown", args: []},
            {name: "InputMouseMove", args: []},
            {name: "InputMouseMove", args: [0]},
        ] as unknown as UserInputJSON[];
        it.each(constructorArguments)('constructor throws for (%s, %s)', (json) => {
            expect(() => {
                newUserInput(json);
            }).toThrow();
        });
    });

    test("Throws when some argument is undefined", () => {
        expect(() => {
            new MouseMove(12, undefined);
        }).toThrow();
    });

    test("constructor does not need args for InputEffectName.InputClickStage", () => {
        expect(() => {
            new ClickStage();
        }).not.toThrow();
    });

    test("toJSON()", () => {
        const effect = new InputKey("left");
        const actual = effect.toJSON();
        const expected: UserInputJSON = {
            name: "InputKey",
            args: ["left arrow"],
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
            const effect = new MouseMove(12, 34);
            effect.inputImmediate(t);
            expect(ScratchInterface.setMousePosition).toHaveBeenCalledWith(new ScratchPosition(12, 34));
        });

        test("Key input effect", () => {
            tdMock.inputImmediate = jest.fn();
            const effect = new InputKey("b");
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
            const effect = new InputText("this is some text");
            effect.inputImmediate(t);
            expect(tdMock.typeText).toHaveBeenCalledWith("this is some text");
        });

        test("Mouse down input effect", () => {
            jest.mock('../../../../src/whisker/utils/Container');
            tdMock.mouseDown = jest.fn();
            const effect = new MouseDown(false);
            effect.inputImmediate(t);
            expect(tdMock.mouseDown).toHaveBeenCalledWith(false);
        });

        test("Click stage input effect", () => {
            tdMock.clickStage = jest.fn();
            const effect = new ClickStage();
            effect.inputImmediate(t);
            expect(tdMock.clickStage).toHaveBeenCalledWith();
        });

        test("Click stage input effect", () => {
            Container.config = {getClickDuration: () => 42} as unknown as WhiskerSearchConfiguration;
            tdMock.currentSprites = SpriteMock.stringsToSpriteArray(["apple", "bowl"]);
            tdMock.clickSprite = jest.fn();
            const effect = new ClickSprite(["bowl"]);
            effect.inputImmediate(t);
            expect(tdMock.clickSprite).toHaveBeenCalledWith("bowl", 42);
        });
    });
});
