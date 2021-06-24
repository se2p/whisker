import TestDriver from "../../../test/test-driver";
import {UserModelEdge} from "./ModelEdge";
import {ModelUtil} from "../util/ModelUtil";
import {MouseMoveEvent} from "../../testcase/events/MouseMoveEvent";
import {TypeTextEvent} from "../../testcase/events/TypeTextEvent";
import {MouseDownEvent} from "../../testcase/events/MouseDownEvent";
import {ClickStageEvent} from "../../testcase/events/ClickStageEvent";
import {ClickSpriteEvent} from "../../testcase/events/ClickSpriteEvent";

export enum InputEffectName {
    InputClickSprite = "InputClickSprite", // sprite name
    InputClickStage = "InputClickStage", // nothing
    InputKey = "InputKey", // key name (input for one step)
    InputMouseDown = "InputMouseDown", // true | false
    InputMouseMove = "InputMouseMove", // x, y
    InputText = "InputText" // answer| text
}

/**
 * Evaluate and set up the input effect of the given edge string.
 * @param newEdge Edge of a user model with the input effects.
 * @param effect String representing the input effects.
 */
export function setUpInputEffect(newEdge: UserModelEdge, effect: string) {
    const effects = effect.split(",");

    try {
        effects.forEach(effect => {
            newEdge.addInputEffect(getInputEffect(newEdge, effect.trim()));
        })
    } catch (e) {
        throw new Error("Edge '" + newEdge.id + "': " + e.message);
    }
}

/**
 * Get an input effect object based on a input effect string e.g. "InputImmediate:Key:Left:isDown:true". No negation
 * possible in contrast to other effects. Splits the input effect string based on ':'.
 * @param parentEdge Parent edge.
 * @param effect String defining the effect, f.e. Output:Hmm
 */
function getInputEffect(parentEdge: UserModelEdge, effect) {
    const parts = effect.split(":");
    return new InputEffect(parentEdge, parts[0], parts.splice(1, parts.length));
}


/**
 * Class for giving the Scratch VM immediate inputs.
 */
export class InputEffect {
    id: string;
    name: InputEffectName;
    private inputEffect: (t: TestDriver) => void;
    edge: UserModelEdge;
    private readonly args: any[];

    /**
     * Get an input effect. Checks the length of the arguments based on the input type.
     * @param edge Parent edge this input effect belongs to.
     * @param name Type of the input effect
     * @param args Arguments for this input effect.
     */
    constructor(edge: UserModelEdge, name: InputEffectName, args: any[]) {
        this.edge = edge;
        this.name = name;
        this.id = edge.id + ".inputEffect" + edge.inputEffects.length;
        this.args = args;

        let _testArgs = function (length) {
            if (args.length != length) {
                return false;
            }

            for (let i = 0; i < length; i++) {
                if (args[i] == undefined) {
                    return false;
                }
            }
            return true;
        }
        let isOK = true;
        switch (name) {
            case InputEffectName.InputKey:
                isOK = _testArgs(1);
                break;
            case InputEffectName.InputClickSprite:
            case InputEffectName.InputText:
            case InputEffectName.InputMouseDown:
                isOK = _testArgs(1);
                break;
            case InputEffectName.InputClickStage:
                isOK = _testArgs(0);
                break;
            case InputEffectName.InputMouseMove:
                isOK = _testArgs(2);
                break;
        }
        if (!isOK) {
            throw  new Error("Wrong number of arguments for input effect " + name + ".");
        }
    }

    /**
     * Input the saved input effects of this instance to the test driver.
     */
    inputImmediate(t: TestDriver) {
        this.inputEffect(t);
    }

    /**
     * Register the test driver and convert the saved input arguments to an executable input function for fast input.
     */
    registerComponents(t: TestDriver, caseSensitive: boolean) {
        this.inputEffect = this.getInputDataFunction(t, caseSensitive, this.args);
    }

    private getInputDataFunction(t: TestDriver, caseSensitive: boolean, arg: any[]) {
        switch (this.name) {
            case InputEffectName.InputKey:
                return () => {
                    t.inputImmediate({device: "keyboard", key: arg[0], isDown: true, steps: 1});
                }
            case InputEffectName.InputMouseMove:
                arg[0] = ModelUtil.testNumber(arg[0]);
                arg[1] = ModelUtil.testNumber(arg[1]);
                let mouseEvent = new MouseMoveEvent(arg[0], arg[1])
                return () => {
                    mouseEvent.apply();
                };
            case InputEffectName.InputText:
                let textEvent = new TypeTextEvent(arg[0]);
                return () => {
                    textEvent.apply();
                }
            case InputEffectName.InputMouseDown:
                let boolVal = arg[0] == "true";
                let mouseDownEvent = new MouseDownEvent(boolVal);
                return () => {
                    mouseDownEvent.apply();
                }
            case InputEffectName.InputClickStage:
                let clickStageEvent = new ClickStageEvent();
                return () => {
                    clickStageEvent.apply();
                }
            case InputEffectName.InputClickSprite:
                let sprite = ModelUtil.checkSpriteExistence(t, caseSensitive, arg[0]);
                let clickSpriteEvent = new ClickSpriteEvent(sprite._target);
                return () => {
                    clickSpriteEvent.apply();
                }
            default:
                // should not happen
                throw new Error("Input type not recognized: " + this.name);
        }
    }
}
