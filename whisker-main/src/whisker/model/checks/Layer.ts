import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON, SpriteName} from "./AbstractCheck";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";

const name = "Layer" as const;

export type FirstOrLastLayer = "First" | "Last";

export type LayerArgs = [
    /**
     * Name of the key.
     */
    spriteName: SpriteName,

    /**
     * Flag if the sprite should be on the first layer.
     */
    isFirstLayer: FirstOrLastLayer,
];

const LayerArgs = z.tuple([
    SpriteName,
    z.literal("First").or(z.literal("Last")),
]);

export interface LayerJSON extends ICheckJSON {
    name: typeof name;
    args: LayerArgs;
}

export const LayerJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: LayerArgs,
});

export class Layer extends AbstractCheck<LayerJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<LayerJSON>) {
        super(edgeLabel, {...json, name});
    }

    /**
     * Get a method for checking whether a sprite is on the first/last layer.
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const pSpriteName = this._args[0];
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        return () => {
            const expected = this._args[1] === "First"
                ? Math.max(...t.getSprites(s => true).map((s: Sprite) => ModelUtil.returnNumberIfPossible(s.layerOrder, -1)))
                : 1;
            const sprites: Sprite[] = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            const anyHasCorrectLayer = sprites.some((s: Sprite) => s.layerOrder == expected);
            return !this.negated == anyHasCorrectLayer;
        };
    }

    protected _contradicts(that: Layer): boolean {
        // if there is only one layer a sprite can be at the first and last layer at the same time
        // this._args[0] == that._args[0] && this._args[1] != that._args[1]
        return false;
    }

    protected _validate(checkJSON: LayerJSON): LayerJSON {
        return LayerJSON.parse(checkJSON) as LayerJSON;
    }

    get dependsOnSayText(): boolean {
        return false;
    }
}
