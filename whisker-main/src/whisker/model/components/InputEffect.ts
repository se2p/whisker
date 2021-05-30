import TestDriver from "../../../test/test-driver";
import Util from "../../../vm/util";
import {UserModelEdge} from "./ModelEdge";

export function setUpInputEffect(newEdge: UserModelEdge, effect: string) {
    const effects = effect.split(",");

    try {
        effects.forEach(effect => {
            newEdge.addInputEffect(getEffect(effect));
        })
    } catch (e) {
        throw new Error("Edge '" + newEdge.id + "': " + e.message);
    }
}

function getEffect(effect) {
    const parts = effect.split(":");
    if (parts[0] != "InputImmediate") {
        throw new Error("User model can only have InputImmediate effects.");
    }
    if (parts.length < 2) {
        throw new Error("Edge input effect not correctly formatted. ':' missing.");
    }
    return new InputEffect(getInputDataObject(parts[1], parts.splice(2, parts.length)));
}


/**
 * todo
 */
export class InputEffect {
    private readonly dataGetter: (t: TestDriver) => {};

    constructor(dataGetter: (t: TestDriver) => {}) {
        this.dataGetter = dataGetter;
    }

    inputImmediate(t: TestDriver) {
        t.inputImmediate(this.dataGetter(t));
    }
}

/**
 * todo
 * @param type
 * @param arg
 */
export function getInputDataObject(type: string, ...arg: any) : (t:TestDriver) => {} {
    switch (type.toLowerCase()) {
        case 'key':
            let duration;
            if (arg.length == 1) {
                duration = 1;
            } else {
                duration = arg[1];
            }
            return (t) => {
                return {device: type, key: Util.getScratchKey(t.vm, arg[0]), duration: duration};
            }
        case 'mouse':
            return (t) => {
                return {device: type, sprite: arg[0]}; // todo how does this look like?
            }
        case 'text':
            return (t) => {
                return {device: type, answer: arg[0]}; // todo how does this look like?
            }
        case 'drag':
            return (t) => {
                return {device: type, x: arg[0], y: arg[1]}; // todo how does this look like?
            }
        default: throw new Error(`Invalid device for input ${type}`);
    }
}
