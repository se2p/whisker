import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {result} from "./CheckResult";

const name = "Click" as const;

export type ClickArgs = [
    /**
     * The name of the sprite.
     */
    spriteName: SpriteName,
];

const ClickArgs = z.tuple([
    SpriteName,
]);

export interface ClickJSON extends ICheckJSON {
    name: typeof name;
    args: ClickArgs;
}

export const ClickJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: ClickArgs,
});

export class Click extends PureCheck<ClickJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<ClickJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(ClickArgs.safeParse(args));
    }

    protected _validate(checkJSON: ClickJSON): ClickJSON {
        return ClickJSON.parse(checkJSON) as ClickJSON;
    }

    /**
     * Get a method for checking whether a sprite was clicked.
     * @param t Instance of the test driver for retrieving if a sprite or its clones are clicked
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const sprite = this._checkSpriteExistence(this._args[0]);
        return () => {
            const spriteVisible = sprite.visible;
            const spriteIsTouchingMouse = sprite.isTouchingMouse();
            const mouseDown = t.isMouseDown();
            const res = spriteVisible && spriteIsTouchingMouse && mouseDown;
            return result(res, {spriteVisible, spriteIsTouchingMouse, mouseDown}, this.negated);
        };
    }

    protected override _contradicts(that: Click): boolean {
        const [spriteNameThis] = this._args;
        const [spriteNameThat] = that._args;
        return spriteNameThis !== spriteNameThat; // Cannot click on two different sprites at the same time.
    }
}
