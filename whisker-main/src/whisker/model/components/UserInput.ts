import TestDriver from "../../../test/test-driver";
import {ModelUtil} from "../util/ModelUtil";
import {MouseMoveEvent} from "../../testcase/events/MouseMoveEvent";
import {TypeTextEvent} from "../../testcase/events/TypeTextEvent";
import {MouseDownEvent} from "../../testcase/events/MouseDownEvent";
import {ClickStageEvent} from "../../testcase/events/ClickStageEvent";
import {ClickSpriteEvent} from "../../testcase/events/ClickSpriteEvent";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";
import {ArgType, UserInputJSON} from "../schema/common";

export const USER_INPUT_NAMES = Object.freeze([
    "InputClickSprite", // sprite name
    "InputClickStage", // nothing
    "InputKey", // key name (input for one step)
    "InputMouseDown", // true | false
    "InputMouseMove", // x, y
    "InputText", // answer| text
] as const);

export type UserInputName = typeof USER_INPUT_NAMES[number];

/**
 * Class for giving the Scratch VM immediate inputs.
 */
export class UserInput {
    private readonly _id: string;
    private readonly _name: UserInputName;
    private _userInput: (t: TestDriver) => void;
    private readonly _args: ArgType[];

    /**
     * Get an input effect. Checks the length of the arguments based on the input type.
     * @param id Id for this effect.
     * @param name Type of the input effect
     * @param args Arguments for this input effect.
     */
    constructor(id: string, name: UserInputName, args: ArgType[]) {
        if (!id) {
            throw new Error("No id given.");
        }
        this._name = name;
        this._id = id;
        this._args = args;
        this._userInput = () => void 0;

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
        this._userInput(t);
    }

    /**
     * Register the test driver and convert the saved input arguments to an executable input function for fast input.
     */
    registerComponents(t: TestDriver): void {
        switch (this._name) {
            case "InputKey":
                this._userInput = () => {
                    t.inputImmediate({device: "keyboard", key: (this._args)[0], isDown: true, steps: 1});
                };
                return;

            case "InputMouseMove": {
                const xFunc = ModelUtil.getExpressionForEval(t, this._args[0]);
                const yFunc = ModelUtil.getExpressionForEval(t, this._args[0]);
                this._userInput = () => {
                    const x = ModelUtil.evaluateExpression(t, xFunc.expr);
                    const y = ModelUtil.evaluateExpression(t, yFunc.expr);
                    const xVal = ModelUtil.testNumber(String(x));
                    const yVal = ModelUtil.testNumber(String(y));
                    const mouseEvent = new MouseMoveEvent(xVal, yVal);
                    mouseEvent.apply();
                };
                return;
            }

            case "InputText": {
                const textEvent = new TypeTextEvent(String((this._args)[0]));
                this._userInput = () => {
                    textEvent.apply();
                };
                return;
            }

            case "InputMouseDown": {
                const boolVal = (this._args)[0] == "true";
                const mouseDownEvent = new MouseDownEvent(boolVal);
                this._userInput = () => {
                    mouseDownEvent.apply();
                };
                return;
            }

            case "InputClickStage": {
                const clickStageEvent = new ClickStageEvent();
                this._userInput = () => {
                    clickStageEvent.apply();
                };
                return;
            }

            case "InputClickSprite": {
                const sprite = ModelUtil.checkSpriteExistence(t, (this._args)[0]);
                const clickSpriteEvent = new ClickSpriteEvent(sprite._target);
                this._userInput = () => {
                    clickSpriteEvent.apply();
                };
                return;
            }

            default:
                throw new NonExhaustiveCaseDistinction(this._name, "Input type not recognized: " + this._name);
        }
    }

    toJSON(): UserInputJSON {
        return {
            id: this._id,
            name: this._name,
            args: this._args,
        };
    }
}
