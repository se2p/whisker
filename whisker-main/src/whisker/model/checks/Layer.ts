import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import TestDriver from "../../../test/test-driver";
import {any, result} from "./CheckResult";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";

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
    z.union([z.literal("First"), z.literal("Last")], {errorMap: () => ({message: "NeitherFirstNorLast"})})
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
     * @param t Instance of the test driver for retrieving the layers of the sprite and its clones.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const pSpriteName = this._args[0];
        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        return () => {
            const expected = this._args[1] === "First"
                ? Math.max(...t.getSprites().map((s: Sprite) => ModelUtil.returnNumberIfPossible(s.layerOrder, -1)))
                : 1;
            const sprites: Sprite[] = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            const check = (s: Sprite) => result(s.layerOrder == expected, {actual: s.layerOrder, expected});
            return any(check, this.negated, sprites);
        };
    }

    protected _contradicts(that: Layer): boolean {
        // if there is only one layer a sprite can be at the first and last layer at the same time
        return false;
    }

    protected _validate(checkJSON: LayerJSON): LayerJSON {
        return LayerJSON.parse(checkJSON) as LayerJSON;
    }

    get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(LayerArgs.safeParse(args));
    }
}
