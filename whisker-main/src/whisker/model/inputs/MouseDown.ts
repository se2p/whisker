import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {MouseDownEvent} from "../../testcase/events/MouseDownEvent";

const name = "InputMouseDown" as const;

type MouseDownArgs = [boolean]; // Whether the mouse button is pressed or released.

export interface MouseDownJSON extends IUserInputJSON {
    name: typeof name;
    args: MouseDownArgs;
}

export class MouseDown extends AbstractUserInput<MouseDownJSON> {
    constructor(args: MouseDownArgs) {
        super({name, args});
    }

    private get _down(): boolean {
        return this._inputJSON.args[0];
    }

    protected _userInput(_t: TestDriver): Promise<void> {
        const mouseDownEvent = new MouseDownEvent(this._down);
        return mouseDownEvent.apply();
    }
}
