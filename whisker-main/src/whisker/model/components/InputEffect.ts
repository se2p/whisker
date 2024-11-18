import TestDriver from "../../../test/test-driver";
import {ModelUtil} from "../util/ModelUtil";
import {MouseMoveEvent} from "../../testcase/events/MouseMoveEvent";
import {TypeTextEvent} from "../../testcase/events/TypeTextEvent";
import {MouseDownEvent} from "../../testcase/events/MouseDownEvent";
import {ClickStageEvent} from "../../testcase/events/ClickStageEvent";
import {ClickSpriteEvent} from "../../testcase/events/ClickSpriteEvent";
import {ArgType} from "./Check";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";

export const INPUT_EFFECT_NAMES = Object.freeze([
    "InputClickSprite", // sprite name
    "InputClickStage", // nothing
    "InputKey", // key name (input for one step)
    "InputMouseDown", // true | false
    "InputMouseMove", // x, y
    "InputText", // answer| text
] as const);

export type InputEffectName = typeof INPUT_EFFECT_NAMES[number];

export interface InputEffectJSON {
    id: string;
    name: InputEffectName;
    args: ArgType[];
}

/**
 * Class for giving the Scratch VM immediate inputs.
 */
export class InputEffect {
    private readonly _id: string;
    private readonly _name: InputEffectName;
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
        this._name = name;
        this._id = id;
        this._args = args;
        this._inputEffect = () => void 0;

        let expectedLength: number;
        switch (name) {
            case "InputKey":
            case "InputClickSprite":
            case "InputText":
            case "InputMouseDown":
                expectedLength = 1;
                break;
            case "InputClickStage":
                expectedLength = 0;
                break;
            case "InputMouseMove":
                expectedLength = 2;
                break;
            default:
                throw new NonExhaustiveCaseDistinction(name);
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

    toJSON(): InputEffectJSON {
        return {
            id: this._id,
            name: this._name,
            args: this._args,
        };
    }

    private _getInputDataFunction(t: TestDriver, arg: ArgType[]) {
        switch (this._name) {
            case "InputKey":
                return () => {
                    t.inputImmediate({device: "keyboard", key: arg[0], isDown: true, steps: 1});
                };
            case "InputMouseMove": {
                arg[0] = ModelUtil.testNumber(arg[0]);
                arg[1] = ModelUtil.testNumber(arg[1]);
                const mouseEvent = new MouseMoveEvent(arg[0], arg[1]);
                return () => {
                    mouseEvent.apply();
                };
            }
            case "InputText": {
                const textEvent = new TypeTextEvent(String(arg[0]));
                return () => {
                    textEvent.apply();
                };
            }
            case "InputMouseDown": {
                const boolVal = arg[0] == "true";
                const mouseDownEvent = new MouseDownEvent(boolVal);
                return () => {
                    mouseDownEvent.apply();
                };
            }
            case "InputClickStage": {
                const clickStageEvent = new ClickStageEvent();
                return () => {
                    clickStageEvent.apply();
                };
            }
            case "InputClickSprite": {
                const sprite = ModelUtil.checkSpriteExistence(t, arg[0]);
                const clickSpriteEvent = new ClickSpriteEvent(sprite._target);
                return () => {
                    clickSpriteEvent.apply();
                };
            }
            default:
                // should not happen
                throw new Error("Input type not recognized: " + this._name);
        }
    }
}
