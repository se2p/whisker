import {Condition} from "./Condition";
import TestDriver from "../../../test/test-driver";
import {Input} from "../../../vm/inputs";

export class KeyCondition implements Condition {
    private readonly keyToCheck: string;

    constructor(keyToCheck: string) {
        this.keyToCheck = keyToCheck;
    }

    check(testDriver: TestDriver): boolean {
        if (testDriver.vmWrapper.inputs.inputs.length > 0) {
            const inputs = testDriver.vmWrapper.inputs.inputs;

            // try to find the input equal to the string
            for (let i = 0; i < inputs.length; i++) {
                if (inputs[i]._data.key === Input.scratchKeyToKeyString(this.keyToCheck)) {
                    return true;
                }
            }
            return false;
        } else {
            // console.log("inputs empty") todo why
        }
        return false;
    }

    register(testDriver): void {
        // do nothing before a step...
    }

    reset(): void {
    }
}
