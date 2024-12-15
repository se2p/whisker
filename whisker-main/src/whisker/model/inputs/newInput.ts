import {ClickSprite, ClickSpriteJSON} from "./ClickSprite";
import {ClickStage, ClickStageJSON} from "./ClickStage";
import {InputKey, InputKeyJSON} from "./InputKey";
import {InputText, InputTextJSON} from "./InputText";
import {MouseDown, MouseDownJSON} from "./MouseDown";
import {MouseMove, MouseMoveJSON} from "./MouseMove";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";

export type Input =
    | ClickSprite
    | ClickStage
    | InputKey
    | InputText
    | MouseDown
    | MouseMove
    ;

export type InputJSON =
    | ClickSpriteJSON
    | ClickStageJSON
    | InputKeyJSON
    | InputTextJSON
    | MouseDownJSON
    | MouseMoveJSON
    ;

export function newInput(inputJSON: InputJSON): Input {
    const name = inputJSON.name;
    switch (name) {
        case "InputClickSprite":
            return new ClickSprite();
        case "InputClickStage":
            return new ClickStage();
        case "InputKey":
            return new InputKey();
        case "InputText":
            return new InputKey();
        case "InputMouseDown":
            return new MouseDown();
        case "InputMouseMove":
            return new MouseMove();
        default:
            throw new NonExhaustiveCaseDistinction(name);
    }
}
