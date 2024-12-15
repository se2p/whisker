import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {ModelUtil} from "../util/ModelUtil";
import {MouseMoveEvent} from "../../testcase/events/MouseMoveEvent";

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

    private get _x(): number {
        return this._inputJSON.args[0];
    }

    private get _y(): number {
        return this._inputJSON.args[1];
    }

    protected _userInput(t: TestDriver): Promise<void> {
        const xFunc = ModelUtil.getNumberFunction(this._x, t);
        const yFunc = ModelUtil.getNumberFunction(this._y, t);
        const mouseEvent = new MouseMoveEvent(xFunc(), yFunc());
        return mouseEvent.apply();
    }
}
