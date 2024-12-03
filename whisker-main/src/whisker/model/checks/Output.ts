import {AbstractCheck, Check, ICheckJSON, SpriteName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import Sprite from "../../../vm/sprite";
import {z} from "zod";

const NAME = "Output" as const;

export type OutputArgs = [
    /**
     * The name of the sprite.
     */
    pSpriteName: SpriteName,

    /**
     * Output to say.
     */
    output: string,
];

const OutputArgs = z.tuple([
    SpriteName,
    z.string(),
]);

export interface OutputJSON extends ICheckJSON {
    name: typeof NAME;
    args: OutputArgs;
}

export const OutputJSON = ICheckJSON.extend({
    name: z.literal(NAME),
    args: OutputArgs,
});

export class Output extends AbstractCheck<OutputJSON> {
    constructor(id: string, edgeLabel: string, negated: boolean, args: OutputArgs) {
        super(id, edgeLabel, negated, NAME, args);
    }

    /**
     * Get a method checking whether a sprite has the given output included in their sayText.
     * @param t Instance of the test driver.
     * @param cu  Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, graphID: string): Check {
        const [pSpriteName, output] = this._args;
        const negated = this._negated;
        const edgeLabel = this._edgeLabel;

        const spriteName = ModelUtil.checkSpriteExistence(t, pSpriteName).name;
        let expression: string;
        try {
            expression = ModelUtil.getExpressionForEval(t, output).expr;
        } catch (e) {
            // this is probably supposed to be constant text like "apple" and not an expression
            expression = ModelUtil.getExpressionForEval(t, `'${output}'`).expr;
        }

        const eventString = CheckUtility.getEventString("Output", negated, pSpriteName, output);
        const check: (s: Sprite) => boolean = (s) => {
            if (!s.sayText) {
                return false;
            }

            const sayText = s.sayText.toLocaleLowerCase();
            const expected = String(eval(expression)(t)).toLocaleLowerCase();
            return sayText.includes(expected);
        };
        cu.registerOutput(spriteName, eventString, edgeLabel, graphID, (s) => !negated == check(s));
        return () => {
            const sprites = t.getSprites((sprite: Sprite) => sprite.name === spriteName, false);
            const anySayText = sprites.some(check);
            return !negated == anySayText;
        };
    }


    override get dependsOnSayText(): true {
        return true;
    }
}
