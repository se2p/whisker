import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";

const name = "InputMouseDown" as const;

type MouseDownArgs = [boolean]; // Whether the mouse button is pressed or released.

export interface MouseDownJSON extends IUserInputJSON {
    name: typeof name;
    args: MouseDownArgs;
}

export class MouseDown extends AbstractUserInput {
    constructor() {
        super();
    }

    protected _userInput(t: TestDriver): Promise<void> {
        return Promise.resolve(undefined);
    }
}
