import {AbstractUserInput, IUserInputJSON} from "./AbstractUserInput";
import TestDriver from "../../../test/test-driver";
import {MouseMoveEvent} from "../../testcase/events/MouseMoveEvent";
import {z} from "zod";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "../checks/CheckTypes";
import {getNumberFunction} from "../util/ModelUtil";

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

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(MouseMoveArgs.safeParse(args));
    }

    override async inputImmediate(t: TestDriver, graphId: string): Promise<void> {
        const xFunc = getNumberFunction(this._x, t, graphId);
        const yFunc = getNumberFunction(this._y, t, graphId);
        const mouseEvent = new MouseMoveEvent(xFunc(), yFunc());
        return mouseEvent.apply();
    }

    protected _validate(json: MouseMoveJSON): MouseMoveJSON {
        return MouseMoveJSON.parse(json) as MouseMoveJSON;
    }
}
