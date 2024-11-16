import TestDriver from "../../../test/test-driver";
import {ModelUtil} from "../util/ModelUtil";
import {MouseMoveEvent} from "../../testcase/events/MouseMoveEvent";
import {TypeTextEvent} from "../../testcase/events/TypeTextEvent";
import {MouseDownEvent} from "../../testcase/events/MouseDownEvent";
import {ClickStageEvent} from "../../testcase/events/ClickStageEvent";
import {ClickSpriteEvent} from "../../testcase/events/ClickSpriteEvent";
import {ArgType} from "./Check";

export enum InputEffectName {
    InputClickSprite = "InputClickSprite", // sprite name
    InputClickStage = "InputClickStage", // nothing
    InputKey = "InputKey", // key name (input for one step)
    InputMouseDown = "InputMouseDown", // true | false
    InputMouseMove = "InputMouseMove", // x, y
    InputText = "InputText" // answer| text
}

export interface SimpleInputEffect {
    id: string
    name: InputEffectName;
    args: ArgType[];
}

/**
 * Class for giving the Scratch VM immediate inputs.
 */
export class InputEffect {
    id: string;
    name: InputEffectName;
    private _inputEffect: (t: TestDriver) => void;
    private readonly _args: ArgType[];

    /**
     * Get an input effect. Checks the length of the arguments based on the input type.
     * @param id Id for this effect.
     * @param name Type of the input effect
     * @param args Arguments for this input effect.
     */
    constructor(id: string, name: InputEffectName, args: ArgType[]) {
        if (!id) {
            throw new Error("No id given.");
        }
        this.name = name;
        this.id = id;
        this._args = args;
        this._inputEffect = () => void 0;

        let expectedLength: number;
        switch (name) {
            case InputEffectName.InputKey:
            case InputEffectName.InputClickSprite:
            case InputEffectName.InputText:
            case InputEffectName.InputMouseDown:
                expectedLength = 1;
                break;
            case InputEffectName.InputClickStage:
                expectedLength = 0;
                break;
            case InputEffectName.InputMouseMove:
                expectedLength = 2;
                break;
        }
        if (args.length != expectedLength) {
            throw new Error("Wrong number of arguments for input effect " + name + ".");
        }
        if (args.some((arg) => arg == undefined)) {
            throw new Error("arguments cannot be undefined.");
        }
    }

    /**
     * Input the saved input effects of this instance to the test driver.
     */
    inputImmediate(t: TestDriver): void {
        this._inputEffect(t);
    }

    /**
     * Register the test driver and convert the saved input arguments to an executable input function for fast input.
     */
    registerComponents(t: TestDriver): void {
        this._inputEffect = this._getInputDataFunction(t, this._args);
    }

    toJSON(): SimpleInputEffect {
        return {
            id: this.id,
            name: this.name,
            args: this._args
        };
    }

    private _getInputDataFunction(t: TestDriver, arg: ArgType[]) {
        switch (this.name) {
            case InputEffectName.InputKey:
                return () => {
                    t.inputImmediate({device: "keyboard", key: arg[0], isDown: true, steps: 1});
                };
            case InputEffectName.InputMouseMove: {
                arg[0] = ModelUtil.testNumber(arg[0]);
                arg[1] = ModelUtil.testNumber(arg[1]);
                const mouseEvent = new MouseMoveEvent(arg[0], arg[1]);
                return () => {
                    mouseEvent.apply();
                };
            }
            case InputEffectName.InputText: {
                const textEvent = new TypeTextEvent(String(arg[0]));
                return () => {
                    textEvent.apply();
                };
            }
            case InputEffectName.InputMouseDown: {
                const boolVal = arg[0] == "true";
                const mouseDownEvent = new MouseDownEvent(boolVal);
                return () => {
                    mouseDownEvent.apply();
                };
            }
            case InputEffectName.InputClickStage: {
                const clickStageEvent = new ClickStageEvent();
                return () => {
                    clickStageEvent.apply();
                };
            }
            case InputEffectName.InputClickSprite: {
                const sprite = ModelUtil.checkSpriteExistence(t, arg[0]);
                const clickSpriteEvent = new ClickSpriteEvent(sprite._target);
                return () => {
                    clickSpriteEvent.apply();
                };
            }
            default:
                // should not happen
                throw new Error("Input type not recognized: " + this.name);
        }
    }
}
