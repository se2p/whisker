import {AbstractCheck, Check, ICheckJSON, SpriteName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

const NAME = "Click" as const;

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
    name: typeof NAME;
    args: ClickArgs;
}

export const ClickJSON = ICheckJSON.extend({
    name: z.literal(NAME),
    args: ClickArgs,
});

export class Click extends AbstractCheck<ClickJSON> {
    constructor(edgeLabel: string, id: string, negated: boolean, args: ClickArgs) {
        super(edgeLabel, id, negated, NAME, args);
    }

    /**
     * Get a method for checking whether a sprite was clicked.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): Check {
        const [pSpriteName] = this._args;
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        return () => {
            const sprites = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            const anyTouchingMouse = sprites.some((s: Sprite) => s.visible && t.isMouseDown() && s.isTouchingMouse());
            return !this._negated == anyTouchingMouse;
        };
    }
}
