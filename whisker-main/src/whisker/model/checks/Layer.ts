import {CheckFun0, ICheckJSON, PureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import TestDriver from "../../../test/test-driver";
import {result} from "./CheckResult";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult, SpriteName} from "./CheckTypes";
import {currentMaxLayer} from "../util/ModelUtil";

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

export class Layer extends PureCheck<LayerJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<LayerJSON>) {
        super(edgeLabel, {...json, name});
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(LayerArgs.safeParse(args));
    }

    protected _validate(checkJSON: LayerJSON): LayerJSON {
        return LayerJSON.parse(checkJSON) as LayerJSON;
    }

    /**
     * Get a method for checking whether a sprite is on the first/last layer.
     * @param t Instance of the test driver for retrieving the layers of the sprite and its clones.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const sprite = this._checkSpriteExistence(this._args[0]);
        const spriteName = sprite.name;
        this._registerOnVisualChange(spriteName);

        return () => {
            const expected = (this._args[1] === "First" ? currentMaxLayer(t) : 1);
            return result(sprite.layerOrder == expected, {actual: sprite.layerOrder, expected}, this.negated);
        };
    }

    protected _contradicts(that: Layer): boolean {
        // if there is only one layer a sprite can be at the first and last layer at the same time
        return false;
    }
}
