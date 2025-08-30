import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {any, fail, pass} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";

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

export class Click extends AbstractCheck<ClickJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<ClickJSON>) {
        super(edgeLabel, {...json, name});
    }

    override get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(ClickArgs.safeParse(args));
    }

    /**
     * Get a method for checking whether a sprite was clicked.
     * @param t Instance of the test driver for retrieving if a sprite or its clones are clicked
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const [pSpriteName] = this._args;
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;

        const clickCheck = (s: Sprite) => {
            if (!s.visible) {
                return fail({message: `Expected sprite "${spriteName}" to be visible`});
            }

            if (!s.isTouchingMouse()) {
                return fail({message: `Expected sprite "${spriteName}" to touch the mouse pointer`});
            }

            if (!t.isMouseDown()) {
                return fail({message: `Expected sprite "${spriteName}" to be clicked`});
            }

            return pass();
        };

        return () => {
            const sprites = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            return any(clickCheck, this.negated, sprites)
                .enhance({message: `Expected sprite "${spriteName}" not to be clicked`});
        };
    }

    protected _validate(checkJSON: ClickJSON): ClickJSON {
        return ClickJSON.parse(checkJSON) as ClickJSON;
    }

    protected override _contradicts(that: Click): boolean {
        const [spriteNameThis] = this._args;
        const [spriteNameThat] = that._args;
        return spriteNameThis !== spriteNameThat; // Cannot click on two different sprites at the same time.
    }
}
