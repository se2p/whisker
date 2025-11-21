import {deepCopy} from "./Objects";
import {Block} from "../blocks/Block";
import {deletedInput} from "../blocks/Inputs";
import {getInputKeys} from "./blocks";

export function canonicalizeInputs(block: Block): Block {
    block = deepCopy(block);

    // For substacks and boolean inputs, the input key is sometimes missing entirely if the input is empty.
    // We canonicalize the representation by explicitly adding a key and representing a missing input via a dummy.
    // The dummy is also used in Scratch, but only if an input was added and then deleted again.
    for (const key of getInputKeys(block.opcode)) {
        if (!(key in block.inputs)) {
            block.inputs[key] = deletedInput(); // dummy input
        }
    }

    return block;
}
