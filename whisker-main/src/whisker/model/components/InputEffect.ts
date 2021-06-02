import TestDriver from "../../../test/test-driver";
import Util from "../../../vm/util";
import {UserModelEdge} from "./ModelEdge";

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
function getInputEffect(parentEdge: UserModelEdge, effect: string) {
    const parts = effect.split(":");
    if (parts[0] != "InputImmediate") {
        throw new Error("User model can only have InputImmediate effects.");
    }
    if (parts.length < 2) {
        throw new Error("Edge input effect not correctly formatted. ':' missing.");
    }
    return new InputEffect(parentEdge, parts.splice(1, parts.length));
}


/**
 * Class for giving the Scratch VM immediate inputs.
 */
export class InputEffect {
    id: string;
    private inputEffect: (t: TestDriver) => void;
    edge: UserModelEdge;
    private readonly args: any[];

    /**
     * Get an input effect. Checks the length of the arguments based on the input type, e.g. "key".
     * @param edge Parent edge this input effect belongs to.
     * @param args Arguments for this input effect.
     */
    constructor(edge: UserModelEdge, args: any[]) {
        this.edge = edge;
        this.id = edge.id + ".inputEffect" + edge.inputEffects.length;
        this.args = args;

        let _testArgs = function (length) {
            let error = new Error("Wrong number of arguments for input effect " + args[0] + ".");
            if (args.length != length) {
                throw error;
            }

            for (let i = 0; i < length; i++) {
                if (args[i] == undefined) {
                    throw error;
                }
            }
        }
        switch (args[0].toLowerCase()) {
            case 'key':
                _testArgs(4);
                break;
            case 'mouse':
            case 'text':
                _testArgs(2);
                break;
            case 'drag':
                _testArgs(3);
                break;
        }
    }

    /**
     * Input the saved input effects of this instance to the test driver.
     * @param t Instance of the test driver.
     */
    inputImmediate(t: TestDriver) {
        this.inputEffect(t);
    }

    /**
     * Register the test driver and convert the saved input arguments to an executable input function for fast input.
     * @param t Instance of the test driver.
     */
    registerComponents(t: TestDriver) {
        this.inputEffect = InputEffect.getInputDataObject(t, this.args);
    }

    private static getInputDataObject(t: TestDriver, arg: any[]): (t: TestDriver) => void {
        let type = arg[0];
        switch (type.toLowerCase()) {
            case 'key':
                return InputEffect.getKeyDataObject(t, arg);
            case 'mouse':
                return (t: TestDriver) => {
                    t.inputImmediate({device: type, sprite: arg[0]});
                }; // todo how does this look like?
            case 'text':
                return (t: TestDriver) => {
                    t.inputImmediate({device: type, answer: arg[0]});
                }// todo how does this look like?
            case 'drag':
                return (t: TestDriver) => {
                    t.inputImmediate({device: type, x: arg[0], y: arg[1]});
                }// todo how does this look like?
            default:
                throw new Error(`Invalid device for input ${type}`);
        }
    }

    private static getKeyDataObject(t: TestDriver, arg: any[]): (t: TestDriver) => void {
        let key = Util.getScratchKey(t.vm, arg[1]);

        let boolValue = true;
        if (arg[3] === "false") {
            boolValue = false;
        }
        let data;
        if (arg[2].toLowerCase() == "isdown") {
            data = {device: "keyboard", key: key, isDown: boolValue};
        } else if (arg[1].toLowerCase() == "duration") {
            data = {device: "keyboard", key: key, duration: boolValue};
        } else {
            throw new Error("input effect: " + arg[2] + " not known");
        }

        let contraKey = InputEffect.getContradictingKey(arg[1]);
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
