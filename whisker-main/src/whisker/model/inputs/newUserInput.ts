import {ClickSprite, ClickSpriteJSON} from "./ClickSprite";
import {ClickStage, ClickStageJSON} from "./ClickStage";
import {InputKey, InputKeyJSON} from "./InputKey";
import {InputText, InputTextJSON} from "./InputText";
import {MouseDown, MouseDownJSON} from "./MouseDown";
import {MouseMove, MouseMoveJSON} from "./MouseMove";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";
import {z} from "zod";

export type UserInput =
    | ClickSprite
    | ClickStage
    | InputKey
    | InputText
    | MouseDown
    | MouseMove
    ;

export type UserInputJSON =
    | ClickSpriteJSON
    | ClickStageJSON
    | InputKeyJSON
    | InputTextJSON
    | MouseDownJSON
    | MouseMoveJSON
    ;

export const UserInputJSON = z.discriminatedUnion("name", [
    ClickSpriteJSON,
    ClickStageJSON,
    InputKeyJSON,
    InputTextJSON,
    MouseDownJSON,
    MouseMoveJSON,
]);

export function newUserInput(inputJSON: UserInputJSON): UserInput {
    const name = inputJSON.name;
    switch (name) {
        case "InputClickSprite":
            return new ClickSprite(...inputJSON.args);
        case "InputClickStage":
            return new ClickStage(...inputJSON.args);
        case "InputKey":
            return new InputKey(...inputJSON.args);
        case "InputText":
            return new InputKey(...inputJSON.args);
        case "InputMouseDown":
            return new MouseDown(...inputJSON.args);
        case "InputMouseMove":
            return new MouseMove(...inputJSON.args);
        default:
            throw new NonExhaustiveCaseDistinction(name);
    }
}
