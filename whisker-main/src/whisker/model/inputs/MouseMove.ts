import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {ModelUtil} from "../util/ModelUtil";
import {MouseMoveEvent} from "../../testcase/events/MouseMoveEvent";
import {z} from "zod";
import {ArgType} from "../util/schema";
import {InputErrorCode} from "../checks/newCheck";

const name = "InputMouseMove" as const;

// A coordinate (as number), or a JavaScript expression (its code as string) that evaluates to a coordinate.
type CoordinateOrJSExpr = number | string;
type MouseMoveArgs = [CoordinateOrJSExpr, CoordinateOrJSExpr];

const CoordinateOrJSExpr = z.number().or(z.string());
const MouseMoveArgs = z.tuple([CoordinateOrJSExpr, CoordinateOrJSExpr]);

export type MouseMoveJSON = IUserInputJSON<typeof name, MouseMoveArgs>;

export const MouseMoveJSON = z.object({
    name: z.literal(name),
    args: MouseMoveArgs,
});

export class MouseMove extends AbstractUserInput<MouseMoveJSON> {
    constructor(...args: MouseMoveArgs) {
        super({name, args});
    }

    private get _x(): CoordinateOrJSExpr {
        return this._inputJSON.args[0];
    }

    private get _y(): CoordinateOrJSExpr {
        return this._inputJSON.args[1];
    }

    protected _validate(json: MouseMoveJSON): MouseMoveJSON {
        return MouseMoveJSON.parse(json) as MouseMoveJSON;
    }

    override async inputImmediate(t: TestDriver): Promise<void> {
        const xFunc = ModelUtil.getNumberFunction(this._x, t);
        const yFunc = ModelUtil.getNumberFunction(this._y, t);
        const mouseEvent = new MouseMoveEvent(xFunc(), yFunc());
        return mouseEvent.apply();
    }

    public static convertArgs(args: ArgType[]): InputErrorCode[] {
        return [
            typeof args[0] == "string" && args[0].length > 0 ? "" : "NeitherNumberNorExpr",
            typeof args[1] == "string" && args[1].length > 0 ? "" : "NeitherNumberNorExpr"
        ];
    }
}
