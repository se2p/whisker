import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";

const name = "InputMouseMove" as const;

type MouseMoveArgs = [number, number]; // The coordinates to move the mouse to.

export interface MouseMoveJSON extends IUserInputJSON {
    name: typeof name;
    args: MouseMoveArgs;
}

export class MouseMove extends AbstractUserInput<MouseMoveJSON> {
    constructor(args: MouseMoveArgs) {
        super({name, args});
    }

    protected _userInput(t: TestDriver): Promise<void> {
        return Promise.resolve(undefined);
    }
}
