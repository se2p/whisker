import {ClickSprite} from "./ClickSprite";
import {ClickStage} from "./ClickStage";
import {InputKey} from "./InputKey";
import {InputText} from "./InputText";
import {MouseDown} from "./MouseDown";
import {MouseMove} from "./MouseMove";

export type Input =
    | ClickSprite
    | ClickStage
    | InputKey
    | InputText
    | MouseDown
    | MouseMove
    ;
