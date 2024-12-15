import {AbstractUserInput} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";

export class InputText extends AbstractUserInput {
    constructor() {
        super();
    }

    protected _userInput(t: TestDriver): Promise<void> {
        return Promise.resolve(undefined);
    }
}
