import TestDriver from "../../../test/test-driver";
import Util from "../../../vm/util";
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
    InputKey = "InputKey", // key name, isDown | durationValue (optional), IsDownValue (if isDown) | durationValue (if isDuration)
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
                isOK = _testArgs(3) || _testArgs(5);
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
     * @param t Instance of the test driver.
     */
    registerComponents(t: TestDriver) {
        this.inputEffect = this.getInputDataFunction(t, this.args);
    }

    private getInputDataFunction(t: TestDriver, arg: any[]) {
        console.log(arg);
        switch (this.name) {
            case InputEffectName.InputKey:
                return this.getKeyDataObject(t, arg);
            case InputEffectName.InputMouseMove:
                ModelUtil.testNumber(arg[0]);
                ModelUtil.testNumber(arg[1]);
                let mouseEvent = new MouseMoveEvent(arg[0],arg[1])
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
                let sprite = ModelUtil.checkSpriteExistence(t, arg[0]);
                let clickSpriteEvent = new ClickSpriteEvent(sprite._target);
                return () => {
                    clickSpriteEvent.apply();
                }
            default:
                // should not happen
                throw new Error("Input type not recognized: " + this.name);
        }
    }

    private getKeyDataObject(t: TestDriver, arg: any[]): (t: TestDriver) => void {
        let key = Util.getScratchKey(t.vm, arg[0]);

        let boolValue = true;
        if (arg[2] === "false") {
            boolValue = false;
        }
        let data;
        if (arg[1].toLowerCase() == "isdown") {
            data = {device: "keyboard", key: key, isDown: boolValue};
        } else if (arg[1].toLowerCase() == "duration") {
            data = {device: "keyboard", key: key, steps: arg[2]};
        } else {
            throw new Error("input effect: " + arg[1] + " not known");
        }

        let contraKey = InputEffect.getContradictingKey(arg[0]);
        if (contraKey != null) {
            contraKey = (Util.getScratchKey(t.vm, contraKey));
            return (t: TestDriver) => {
                if (t.isKeyDown(contraKey)) {
                    t.inputImmediate({device: "keyboard", key: contraKey, isDown: false});
                }
                t.inputImmediate(data);
            }
        } else {
            return (t: TestDriver) => {
                t.inputImmediate(data);
            }
        }
    }

    private static getContradictingKey(keyName: string) {
        switch (keyName) {
            case "left arrow":
            case "Left":
                return "Right";
            case "right arrow":
            case "Right":
                return "Left";
            case "up arrow":
            case "Up":
                return "Down";
            case "down arrow":
            case "Down":
                return "Up";
        }
        return null;
    }
}
