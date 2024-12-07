import {AbstractCheck, Check, ICheckJSON, OptionalName, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

const name = "Click" as const;

export type ClickArgs = [
    /**
     * The name of the sprite.
     */
    pSpriteName: SpriteName,
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

export class Click extends AbstractCheck<ClickJSON> {
    constructor(edgeLabel: string, json: OptionalName<ClickJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: ClickJSON): ClickJSON {
        return ClickJSON.parse(checkJSON) as ClickJSON;
    }

    /**
     * Get a method for checking whether a sprite was clicked.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): Check {
        const [pSpriteName] = this.args;
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        return () => {
            const sprites = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            const anyTouchingMouse = sprites.some((s: Sprite) => s.visible && t.isMouseDown() && s.isTouchingMouse());
            return !this.negated == anyTouchingMouse;
        };
    }

    protected override _contradicts(that: ClickJSON): boolean {
        const [spriteNameThis] = this.args;
        const [spriteNameThat] = that.args;
        return spriteNameThis !== spriteNameThat; // Cannot click on two different sprites at the same time.
    }

    override get dependsOnSayText(): boolean {
        return false;
    }
}
